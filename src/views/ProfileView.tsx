import React, { useState } from 'react';
import {
  Store,
  Edit,
  CloudDownload,
  Languages,
  QrCode,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  HelpCircle,
  Sparkles,
  Phone,
  MapPin,
  ShieldCheck,
  Code2,
  Cloud,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { AppLanguage, StoreSettings } from '../types';
import { languageList } from '../utils/language';
import { downloadProjectSourceZip } from '../utils/sourceExporter';

interface ProfileViewProps {
  storeSettings: StoreSettings;
  totalCustomers: number;
  totalTransactions: number;
  totalInventory: number;
  totalInvoices: number;
  onOpenEditStore: () => void;
  onOpenLanguage: () => void;
  onOpenQr: () => void;
  onOpenGoogleBackup: () => void;
  onReopenGuide: () => void;
  onLoadDemoData: () => void;
  onClearAllData: () => void;
  onImportKhatabook: (phone: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  storeSettings,
  totalCustomers,
  totalTransactions,
  totalInventory,
  totalInvoices,
  onOpenEditStore,
  onOpenLanguage,
  onOpenQr,
  onOpenGoogleBackup,
  onReopenGuide,
  onLoadDemoData,
  onClearAllData,
  onImportKhatabook,
}) => {
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [showKhatabookModal, setShowKhatabookModal] = useState(false);
  const [kbPhone, setKbPhone] = useState('+91 98765 43210');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleDownloadZip = async () => {
    if (isExportingZip) return;
    setIsExportingZip(true);
    try {
      await downloadProjectSourceZip((progress) => {
        setExportStatus(progress.message);
      });
      setExportStatus('Saved to ghanshyam-kids-wear-source.zip');
      setTimeout(() => {
        setExportStatus(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to download source zip:', err);
      setExportStatus('Export failed. Check console.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const currentLangObj =
    languageList.find((l) => l.code === storeSettings.language) || languageList[0];

  const handleCopyLedgerJson = () => {
    const backupObj = {
      storeName: storeSettings.storeName,
      phone: storeSettings.phone,
      address: storeSettings.address,
      upiId: storeSettings.upiId,
      developer: 'Kirio Ken',
      timestamp: Date.now(),
      stats: {
        totalCustomers,
        totalTransactions,
        totalInventory,
        totalInvoices,
      },
    };
    navigator.clipboard.writeText(JSON.stringify(backupObj, null, 2));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2500);
  };

  const handleKhatabookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kbPhone.trim()) {
      onImportKhatabook(kbPhone.trim());
      setShowKhatabookModal(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full max-w-full overflow-x-hidden pb-24">
      {/* Store Hero Banner */}
      <div className="bg-gradient-to-tr from-indigo-800 via-indigo-700 to-indigo-900 text-white rounded-3xl p-6 shadow-xl text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Store className="w-8 h-8 text-amber-300" />
        </div>
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide">
          {storeSettings.storeName}
        </h2>
        <p className="text-xs text-amber-300 font-bold mt-0.5">
          Premium Kids Fashion, Clothing & Accessories
        </p>
        <div className="mt-3 text-xs text-indigo-100/90 space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{storeSettings.address}</span>
          </p>
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <Phone className="w-3.5 h-3.5" />
            <span>{storeSettings.phone} • UPI: {storeSettings.upiId}</span>
          </p>
        </div>
        <button
          onClick={onOpenEditStore}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5 text-indigo-600" />
          <span>Edit Store Address & UPI Number</span>
        </button>
      </div>

      {/* FEATURED: Google Cloud Backup & Sheets Export */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-white">
                Google Cloud Backup & Sheets
              </h4>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Drive + Sheets
              </span>
            </div>
            <p className="text-xs text-indigo-200 font-medium mt-0.5">
              Back up to Google Drive, restore across devices, and export finalized CSV / Google Sheets
            </p>
          </div>
        </div>
        <button
          onClick={onOpenGoogleBackup}
          className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-black transition shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <Cloud className="w-4 h-4 text-indigo-600" />
          <span>Manage Google & CSV</span>
        </button>
      </div>

      {/* FEATURED: Import from Khatabook */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CloudDownload className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">
              Import from Khatabook
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Restore Khatabook cloud backup linked to your mobile number
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowKhatabookModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          Import
        </button>
      </div>

      {/* Developer Credit Card (Kirio Ken) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
          KK
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-indigo-950">
              Developer: Kirio Ken
            </h4>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Verified Architect
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Lead Software Architect & Android Engineer
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Khatabook Blueprint Edition v8.43.0
          </p>
        </div>
      </div>

      {/* Language & Tools Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">App Language / भाषा</p>
              <p className="text-[11px] text-slate-500">Currently: {currentLangObj.nativeName}</p>
            </div>
          </div>
          <button
            onClick={onOpenLanguage}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Change
          </button>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">Store UPI QR Code</p>
              <p className="text-[11px] text-slate-500">{storeSettings.upiId}</p>
            </div>
          </div>
          <button
            onClick={onOpenQr}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Show QR
          </button>
        </div>

        {/* Finalize CSV Files */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">Export Finalized CSV Files</p>
              <p className="text-[11px] text-slate-500">Khata ledger, bills, rokad cashbook & stock in Excel CSV</p>
            </div>
          </div>
          <button
            onClick={onOpenGoogleBackup}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Copy className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">Export Store Ledger (JSON)</p>
              <p className="text-[11px] text-slate-500">Copy backup summary to clipboard</p>
            </div>
          </div>
          <button
            onClick={handleCopyLedgerJson}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            {copiedBackup ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBackup ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Download Project Source Code / Archive */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CloudDownload className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Download Source Code & Project Files</p>
                <p className="text-[11px] text-slate-500">Export full project ZIP (Capacitor & GitHub Actions included)</p>
              </div>
            </div>
            <button
              onClick={handleDownloadZip}
              disabled={isExportingZip}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isExportingZip
                  ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:scale-95'
              }`}
            >
              {isExportingZip ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Zipping...</span>
                </>
              ) : (
                <>
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>Download ZIP</span>
                </>
              )}
            </button>
          </div>
          {exportStatus && (
            <div className="text-[11px] text-indigo-700 bg-indigo-50/80 border border-indigo-200/80 px-3 py-1.5 rounded-xl animate-in fade-in flex items-center justify-between">
              <span>{exportStatus}</span>
              <span className="font-mono text-[10px] bg-indigo-100/70 text-indigo-800 px-1.5 py-0.5 rounded">
                ghanshyam-kids-wear-source.zip
              </span>
            </div>
          )}
        </div>

        {/* How to use guide */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">How To Use Guide (Walkthrough)</p>
              <p className="text-[11px] text-slate-500">Re-open the step-by-step app user guide</p>
            </div>
          </div>
          <button
            onClick={onReopenGuide}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            View Guide
          </button>
        </div>

        {/* Demo Data button */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-xs font-bold text-slate-900">Load Kids Wear Demo Data</p>
              <p className="text-[11px] text-slate-500">Populate demo customers, garments & bills for testing</p>
            </div>
          </div>
          <button
            onClick={() => setShowDemoConfirm(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Load Demo
          </button>
        </div>

        {/* Clean Slate Reset */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-xs font-bold text-red-600">Reset Store to Clean Slate</p>
              <p className="text-[11px] text-slate-500">Clear all records and start 100% fresh</p>
            </div>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Clean Slate
          </button>
        </div>
      </div>

      {/* Khatabook Import Modal */}
      {showKhatabookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200">
            <h3 className="font-black text-base text-slate-900 mb-2">
              Import from Khatabook Backup
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your registered Khatabook mobile number to restore customer balances and transactions into Ghanshyam kids wear.
            </p>
            <form onSubmit={handleKhatabookSubmit} className="space-y-3">
              <input
                type="tel"
                required
                value={kbPhone}
                onChange={(e) => setKbPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
              />
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                Backup linked to this phone number will be synced directly into the live khata ledger.
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKhatabookModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Restore Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Demo Data Confirm Modal */}
      {showDemoConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-200 text-center">
            <h4 className="font-black text-base text-slate-900 mb-2">
              Load Sample Kids Wear Demo Data?
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              This will populate sample customers (Rajesh Sharma, Pooja Mehta, etc.), kids wear garments (Baba Suit, Princess Frock), and past bills for testing.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDemoConfirm(false)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onLoadDemoData();
                  setShowDemoConfirm(false);
                }}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Load Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Slate Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-200 text-center">
            <h4 className="font-black text-base text-red-600 mb-2">
              Reset to 100% Clean Slate?
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              This will clear all customers, transactions, stock items, bills, and cashbook entries, returning the app to a brand new clean state.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
