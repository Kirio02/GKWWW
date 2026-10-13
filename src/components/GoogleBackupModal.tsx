import React, { useState, useEffect } from 'react';
import {
  Cloud,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ExternalLink,
  FileText,
  ShieldCheck,
  Users,
  Receipt,
  Wallet,
  Package,
  Layers,
  X,
  Clock,
  Trash2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  BillInvoice,
  CashEntry,
  Customer,
  DriveBackupItem,
  InventoryItem,
  KhataTransaction,
  StoreBackupPayload,
  StoreSettings,
} from '../types';
import {
  googleSignIn,
  logoutGoogle,
  initAuth,
  getAccessToken,
  setAccessToken,
} from '../services/googleAuth';
import {
  uploadBackupToDrive,
  uploadCsvToDrive,
  listDriveBackups,
  downloadDriveBackup,
  deleteDriveFile,
} from '../services/googleDriveService';
import {
  exportStoreToGoogleSheets,
  SheetExportResult,
} from '../services/googleSheetsService';
import {
  downloadCsvFile,
  generateCustomersCsv,
  generateKhataTransactionsCsv,
  generateInvoicesCsv,
  generateCashbookCsv,
  generateInventoryCsv,
  generateMasterStoreCsv,
} from '../utils/csvExporter';

interface GoogleBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
  customers: Customer[];
  transactions: KhataTransaction[];
  inventory: InventoryItem[];
  invoices: BillInvoice[];
  cashbook: CashEntry[];
  onRestoreData: (backup: StoreBackupPayload) => void;
}

export const GoogleBackupModal: React.FC<GoogleBackupModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  customers,
  transactions,
  inventory,
  invoices,
  cashbook,
  onRestoreData,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'GOOGLE_SERVICES' | 'CSV_EXPORT'>('GOOGLE_SERVICES');

  // Drive backups state
  const [driveBackups, setDriveBackups] = useState<DriveBackupItem[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);

  // Sheets state
  const [isExportingSheet, setIsExportingSheet] = useState<boolean>(false);
  const [sheetResult, setSheetResult] = useState<SheetExportResult | null>(null);

  // CSV Drive Upload state
  const [isUploadingCsvToDrive, setIsUploadingCsvToDrive] = useState<boolean>(false);
  const [csvDriveSuccess, setCsvDriveSuccess] = useState<string | null>(null);

  // Error & Status message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Safety Confirmation Dialog state for Restore
  const [confirmRestoreItem, setConfirmRestoreItem] = useState<DriveBackupItem | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Safety Confirmation Dialog state for Delete
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<DriveBackupItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Prepare full data payload
  const currentBackupPayload: StoreBackupPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    appName: storeSettings.storeName,
    storeSettings,
    customers,
    transactions,
    inventory,
    invoices,
    cashbook,
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, cachedToken) => {
        setCurrentUser(user);
        if (cachedToken) {
          setToken(cachedToken);
        }
      },
      () => {
        setCurrentUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Drive backups when signed in with token
  const fetchBackups = async (authToken: string) => {
    setIsLoadingBackups(true);
    setErrorMsg(null);
    try {
      const items = await listDriveBackups(authToken);
      setDriveBackups(items);
    } catch (err: any) {
      console.warn('Error listing Drive backups:', err);
      // If unauthorized, token might need refreshing
      if (err.message?.includes('401')) {
        setErrorMsg('Google session expired. Please sign in again.');
        setToken(null);
      }
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBackups(token);
    }
  }, [token]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setToken(result.accessToken);
        await fetchBackups(result.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setCurrentUser(null);
      setToken(null);
      setDriveBackups([]);
      setSheetResult(null);
      setBackupSuccessMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing out.');
    }
  };

  // Google Drive: Create Backup
  const handleCreateDriveBackup = async () => {
    if (!token) {
      setErrorMsg('Please sign in with Google first.');
      return;
    }
    setIsBackingUp(true);
    setErrorMsg(null);
    setBackupSuccessMsg(null);
    try {
      const res = await uploadBackupToDrive(currentBackupPayload, token);
      setBackupSuccessMsg(`Backup saved to Google Drive: "${res.name}"`);
      await fetchBackups(token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload backup to Google Drive.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Google Drive: Restore Backup
  const handleConfirmRestore = async () => {
    if (!confirmRestoreItem || !token) return;
    setIsRestoring(true);
    setErrorMsg(null);
    try {
      const backupData = await downloadDriveBackup(confirmRestoreItem.id, token);
      if (backupData && backupData.customers) {
        onRestoreData(backupData);
        setBackupSuccessMsg(`Successfully restored data from "${confirmRestoreItem.name}"!`);
        setConfirmRestoreItem(null);
      } else {
        throw new Error('Downloaded backup file has an invalid format.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to restore backup from Google Drive.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Google Drive: Delete Backup
  const handleConfirmDelete = async () => {
    if (!confirmDeleteItem || !token) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteDriveFile(confirmDeleteItem.id, token);
      setBackupSuccessMsg(`Deleted file "${confirmDeleteItem.name}" from Google Drive.`);
      setConfirmDeleteItem(null);
      await fetchBackups(token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete backup file.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Google Sheets: Export Store to Google Sheets
  const handleExportToSheets = async () => {
    if (!token) {
      setErrorMsg('Please sign in with Google first.');
      return;
    }
    setIsExportingSheet(true);
    setErrorMsg(null);
    setSheetResult(null);
    try {
      const result = await exportStoreToGoogleSheets(currentBackupPayload, token);
      setSheetResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export store data to Google Sheets.');
    } finally {
      setIsExportingSheet(false);
    }
  };

  // Google Drive: Upload Master CSV to Drive
  const handleUploadMasterCsvToDrive = async () => {
    if (!token) {
      setErrorMsg('Please sign in with Google first.');
      return;
    }
    setIsUploadingCsvToDrive(true);
    setErrorMsg(null);
    setCsvDriveSuccess(null);
    try {
      const csvContent = generateMasterStoreCsv(currentBackupPayload);
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `ghanshyam_kids_wear_master_ledger_${dateStr}.csv`;
      const result = await uploadCsvToDrive(fileName, csvContent, token);
      setCsvDriveSuccess(`Saved CSV to Google Drive: "${result.name}"`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload CSV to Google Drive.');
    } finally {
      setIsUploadingCsvToDrive(false);
    }
  };

  // Local CSV Downloads
  const dateTag = new Date().toISOString().split('T')[0];
  const handleDownloadMasterCsv = () => {
    const csv = generateMasterStoreCsv(currentBackupPayload);
    downloadCsvFile(`Ghanshyam_Kids_Wear_Master_Ledger_${dateTag}.csv`, csv);
  };

  const handleDownloadCustomersCsv = () => {
    const csv = generateCustomersCsv(customers);
    downloadCsvFile(`Customers_Khata_List_${dateTag}.csv`, csv);
  };

  const handleDownloadTransactionsCsv = () => {
    const csv = generateKhataTransactionsCsv(transactions, customers);
    downloadCsvFile(`Khata_Transactions_Ledger_${dateTag}.csv`, csv);
  };

  const handleDownloadInvoicesCsv = () => {
    const csv = generateInvoicesCsv(invoices);
    downloadCsvFile(`Invoices_Register_${dateTag}.csv`, csv);
  };

  const handleDownloadCashbookCsv = () => {
    const csv = generateCashbookCsv(cashbook);
    downloadCsvFile(`Cashbook_Rokad_Log_${dateTag}.csv`, csv);
  };

  const handleDownloadInventoryCsv = () => {
    const csv = generateInventoryCsv(inventory);
    downloadCsvFile(`Inventory_Stock_Master_${dateTag}.csv`, csv);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">Google Backup & CSV Export</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-medium">
                Google Drive Backup • Google Sheets • Finalized CSV Files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('GOOGLE_SERVICES')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition cursor-pointer ${
              activeTab === 'GOOGLE_SERVICES'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4 text-indigo-600" />
            <span>Google Drive & Sheets</span>
          </button>
          <button
            onClick={() => setActiveTab('CSV_EXPORT')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition cursor-pointer ${
              activeTab === 'CSV_EXPORT'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Finalize CSV Files</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 no-scrollbar">
          {/* Status and Notifications */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="font-medium">{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800 text-xs font-bold cursor-pointer">
                Dismiss
              </button>
            </div>
          )}
          {backupSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{backupSuccessMsg}</span>
              </div>
              <button onClick={() => setBackupSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: GOOGLE SERVICES */}
          {activeTab === 'GOOGLE_SERVICES' && (
            <div className="space-y-4">
              {/* Google Account Profile / Sign-in Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                {currentUser ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.displayName || 'Google User'}
                          className="w-11 h-11 rounded-full border border-slate-300 shadow-xs"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                          {currentUser.displayName ? currentUser.displayName[0] : 'G'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-sm text-slate-900">
                            {currentUser.displayName || 'Google Account Connected'}
                          </h4>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Connected
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{currentUser.email}</p>
                        <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                          Active scopes: Google Drive (drive.file) & Google Sheets
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto"
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                      Connect Your Google Account
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                      Sign in to enable automated cloud backup to Google Drive, restore records across devices, and export live reports to Google Sheets.
                    </p>
                    {/* Official Google Sign-In Button */}
                    <button
                      onClick={handleSignIn}
                      disabled={isSigningIn}
                      className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50 mx-auto"
                    >
                      {isSigningIn ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          <path fill="none" d="M0 0h48v48H0z" />
                        </svg>
                      )}
                      <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action 1: Google Drive Backup */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Google Drive Cloud Backup</h4>
                      <p className="text-[11px] text-slate-500">
                        Back up {customers.length} customers, {transactions.length} transactions, {invoices.length} invoices, and {cashbook.length} cash entries.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCreateDriveBackup}
                    disabled={!currentUser || isBackingUp}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isBackingUp ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isBackingUp ? 'Saving...' : 'Back Up Now'}</span>
                  </button>
                </div>

                {/* Cloud Backups List on Drive */}
                <div className="mt-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Available Backups in Google Drive ({driveBackups.length})</span>
                    </span>
                    {currentUser && (
                      <button
                        onClick={() => token && fetchBackups(token)}
                        disabled={isLoadingBackups}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    )}
                  </div>

                  {!currentUser ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      Sign in above to see your saved cloud backups on Google Drive.
                    </p>
                  ) : isLoadingBackups ? (
                    <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Fetching Google Drive backup files...</span>
                    </div>
                  ) : driveBackups.length === 0 ? (
                    <div className="py-3 px-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      No cloud backups found yet. Click <strong>"Back Up Now"</strong> above to create your first cloud snapshot.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                      {driveBackups.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {item.modifiedTime
                                ? new Date(item.modifiedTime).toLocaleString('en-IN')
                                : 'Recent'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setConfirmRestoreItem(item)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Restore this backup into app"
                            >
                              <Download className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => setConfirmDeleteItem(item)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                              title="Delete from Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action 2: Google Sheets Integration */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Export to Google Sheets</h4>
                      <p className="text-[11px] text-slate-500">
                        Generates a formatted Google Spreadsheet with 5 tabs: Customers, Khata, Invoices, Cashbook & Inventory.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportToSheets}
                    disabled={!currentUser || isExportingSheet}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isExportingSheet ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                    <span>{isExportingSheet ? 'Generating...' : 'Create Google Sheet'}</span>
                  </button>
                </div>

                {sheetResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                    <div>
                      <p className="text-xs font-black text-emerald-900">
                        Spreadsheet successfully generated!
                      </p>
                      <p className="text-[11px] text-emerald-700 truncate max-w-sm">
                        {sheetResult.title}
                      </p>
                    </div>
                    <a
                      href={sheetResult.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-700 transition"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Action 3: Save CSV Directly to Google Drive */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Upload Finalized CSV to Drive</h4>
                    <p className="text-[11px] text-slate-500">
                      Upload the complete store CSV directly into your Google Drive root folder.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUploadMasterCsvToDrive}
                  disabled={!currentUser || isUploadingCsvToDrive}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploadingCsvToDrive ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploadingCsvToDrive ? 'Uploading...' : 'Save CSV to Drive'}</span>
                </button>
              </div>

              {csvDriveSuccess && (
                <div className="p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between">
                  <span>{csvDriveSuccess}</span>
                  <button onClick={() => setCsvDriveSuccess(null)} className="text-slate-400 hover:text-white font-bold cursor-pointer">
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FINALIZED CSV EXPORT */}
          {activeTab === 'CSV_EXPORT' && (
            <div className="space-y-4">
              {/* Master All-in-One CSV Hero Card */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl p-5 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                      Recommended Audit File
                    </span>
                    <h4 className="text-lg font-black mt-2">
                      Finalized Master Store Ledger CSV
                    </h4>
                    <p className="text-xs text-emerald-100 mt-1 max-w-md">
                      Single consolidated multi-table business ledger file containing: Executive summary, Customer balances, Khata transactions, Invoices register, Cashbook rokad, and Garment inventory.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadMasterCsv}
                    className="shrink-0 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Download Master CSV</span>
                  </button>
                </div>
                <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap gap-4 text-[11px] text-emerald-100">
                  <span>• RFC 4180 Compliant</span>
                  <span>• UTF-8 BOM formatted for Excel & Tally</span>
                  <span>• Ready for accountant & CA submission</span>
                </div>
              </div>

              {/* Individual Modular CSV Downloads */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-black text-sm text-slate-900">
                  Individual Module CSV Files
                </h4>
                <p className="text-xs text-slate-500">
                  Download specific section data formatted for Excel, Google Sheets, or local backups:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Khata Ledger CSV */}
                  <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Khata Transactions</p>
                        <p className="text-[10px] text-slate-500">{transactions.length} entries recorded</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadTransactionsCsv}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                  </div>

                  {/* Customer Khata Directory CSV */}
                  <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Customers Directory</p>
                        <p className="text-[10px] text-slate-500">{customers.length} customer accounts</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadCustomersCsv}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                  </div>

                  {/* Invoices Register CSV */}
                  <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Invoices & Bills</p>
                        <p className="text-[10px] text-slate-500">{invoices.length} bills generated</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadInvoicesCsv}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                  </div>

                  {/* Cashbook Log CSV */}
                  <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Cashbook (Rokad)</p>
                        <p className="text-[10px] text-slate-500">{cashbook.length} cash movements</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadCashbookCsv}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                  </div>

                  {/* Garment Inventory CSV */}
                  <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-2 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Garment Inventory & Sizes</p>
                        <p className="text-[10px] text-slate-500">{inventory.length} garment items cataloged</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadInventoryCsv}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-amber-50 text-amber-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure OAuth 2.0 with direct Google Workspace APIs</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Safety Confirmation Dialog for Restore */}
      {confirmRestoreItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-black text-base text-slate-900 mb-1">
              Restore Store Data from Google Drive?
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              You are about to restore backup file: <br />
              <strong className="text-slate-900 font-bold">{confirmRestoreItem.name}</strong>
              <br />
              <span className="text-amber-700 font-medium block mt-2">
                This action will update and replace your current local records with the data saved in this cloud backup.
              </span>
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setConfirmRestoreItem(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <span>Confirm & Restore</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Confirmation Dialog for Delete from Drive */}
      {confirmDeleteItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-black text-base text-slate-900 mb-1">
              Delete Backup from Google Drive?
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to delete <br />
              <strong className="text-slate-900 font-bold">{confirmDeleteItem.name}</strong>
              <br />
              from your Google Drive? This action cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteItem(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
