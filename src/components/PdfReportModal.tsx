import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Share2,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  AlertCircle,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Store,
} from 'lucide-react';
import {
  Customer,
  KhataTransaction,
  StoreSettings,
  BillInvoice,
  CashEntry,
} from '../types';

export interface PdfReportModalProps {
  reportType: 'CUSTOMER' | 'STORE_OWNER' | 'STORE_SUMMARY';
  customer?: Customer | null;
  customers: Customer[];
  transactions: KhataTransaction[];
  invoices: BillInvoice[];
  cashbook: CashEntry[];
  storeSettings: StoreSettings;
  onDismiss: () => void;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  reportType,
  customer,
  customers,
  transactions,
  invoices,
  cashbook,
  storeSettings,
  onDismiss,
}) => {
  const [copied, setCopied] = useState(false);

  // 1. Data computations for Customer report
  const targetCustomer = customer || customers[0] || null;
  const customerTxList = targetCustomer
    ? transactions
        .filter((t) => t.customerId === targetCustomer.id)
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];

  const latestCustomerTx = customerTxList[customerTxList.length - 1];
  const pendingAmount = targetCustomer ? Math.abs(targetCustomer.netBalance) : 0;
  const isUdhaar = targetCustomer ? targetCustomer.netBalance > 0 : false;

  // 2. Data computations for Store Owner / General report
  const totalReceivables = customers
    .filter((c) => c.netBalance > 0)
    .reduce((sum, c) => sum + c.netBalance, 0);

  const totalPayables = customers
    .filter((c) => c.netBalance < 0)
    .reduce((sum, c) => sum + Math.abs(c.netBalance), 0);

  const totalSales = invoices.reduce((sum, inv) => sum + inv.netTotal, 0);

  const totalCashIn = cashbook
    .filter((c) => c.type === 'CASH_IN')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalCashOut = cashbook
    .filter((c) => c.type === 'CASH_OUT')
    .reduce((sum, c) => sum + c.amount, 0);

  const netCash = totalCashIn - totalCashOut;

  // Cashbook entries sorted chronologically
  const chronologicalCashbook = [...cashbook].sort((a, b) => a.timestamp - b.timestamp);

  // Generate plain text version for copying / sharing
  const generatePlainText = () => {
    const today = new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });

    if (reportType === 'CUSTOMER' && targetCustomer) {
      return `*${storeSettings.storeName.toUpperCase()} - KHATA STATEMENT (PDF)*
Customer: ${targetCustomer.name}
Phone: ${targetCustomer.phone}
Date: ${today}

*CURRENT PENDING DUES (TOP PRIORITY):*
Total Outstanding: ₹ ${pendingAmount.toFixed(2)} (${isUdhaar ? 'Udhaar / You Gave' : 'Advance / Jama'})
${latestCustomerTx ? `Latest Bill: ₹ ${latestCustomerTx.amount.toFixed(2)} on ${new Date(latestCustomerTx.timestamp).toLocaleDateString('en-IN')}\nDesc: ${latestCustomerTx.description || 'Garment entry'}` : ''}
UPI Payment ID: ${storeSettings.upiId}

*COMPLETE HISTORICAL LEDGER:*
${customerTxList.length === 0
  ? 'No past ledger entries found.'
  : customerTxList
      .map(
        (t, idx) =>
          `${idx + 1}. ${new Date(t.timestamp).toLocaleDateString('en-IN')}: ${t.type === 'GAVE_CREDIT' ? '[-] Udhaar' : '[+] Jama'} ₹ ${t.amount.toFixed(2)}${t.description ? ` (${t.description})` : ''}${t.isCleared ? ' [CANCELLED]' : ''}`
      )
      .join('\n')}

Store: ${storeSettings.storeName} | ${storeSettings.phone}
Engineered by Kirio Ken`;
    }

    if (reportType === 'STORE_OWNER') {
      return `*GHANSHYAM KIDS WEAR - OWNER PERSONAL FINANCIAL LEDGER (PDF)*
Store Owner: ${storeSettings.storeName}
Date: ${today}
Phone: ${storeSettings.phone} | UPI: ${storeSettings.upiId}

*CURRENT FINANCIAL POSITION (TOP PRIORITY):*
💵 Cash in Drawer (Net): ₹ ${netCash.toFixed(2)}
🔺 Market Udhaar Receivable: ₹ ${totalReceivables.toFixed(2)}
🔻 Supplier / Advance Payable: ₹ ${totalPayables.toFixed(2)}
🧾 Total Counter Sales: ₹ ${totalSales.toFixed(2)} (${invoices.length} bills)

*HISTORICAL CASH FLOW & EXPENSES JOURNAL:*
${chronologicalCashbook.length === 0
  ? 'No cash transactions recorded.'
  : chronologicalCashbook
      .map(
        (c, idx) =>
          `${idx + 1}. ${new Date(c.timestamp).toLocaleDateString('en-IN')}: [${c.type}] ₹ ${c.amount.toFixed(2)} - ${c.category} (${c.note || 'No note'})`
      )
      .join('\n')}

Engineered by Kirio Ken | Ghanshyam kids wear`;
    }

    // Default STORE_SUMMARY
    return `*GHANSHYAM KIDS WEAR - STORE AUDIT REPORT (PDF)*
Store: ${storeSettings.storeName}
Date: ${today}
Phone: ${storeSettings.phone}
Total Sales: ₹ ${totalSales.toFixed(2)}
Udhaar Receivable: ₹ ${totalReceivables.toFixed(2)}
Cash in Hand: ₹ ${netCash.toFixed(2)}

Engineered by Kirio Ken`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePlainText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = generatePlainText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const titleText =
    reportType === 'CUSTOMER' && targetCustomer
      ? `${targetCustomer.name} - Isolated Historical Ledger`
      : reportType === 'STORE_OWNER'
        ? `Owner's Personal Historical Ledger & Financial Statement`
        : `Store Business Audit Report`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 max-h-[92vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:rounded-none">
        {/* Top Modal Bar (Hidden on print) */}
        <div className="p-4 md:px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  {titleText}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  PDF Format
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {storeSettings.storeName} • Kirio Ken Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onDismiss}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 bg-slate-50/50 print:p-4 print:bg-white print:overflow-visible no-scrollbar">
          {/* Printable Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-5 h-5 text-indigo-600" />
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {storeSettings.storeName}
                </h1>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {storeSettings.address}
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Phone: {storeSettings.phone} • UPI: <span className="font-mono font-bold text-indigo-700">{storeSettings.upiId}</span>
              </p>
            </div>

            <div className="md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block mb-1">
                {reportType === 'CUSTOMER'
                  ? 'OFFICIAL CUSTOMER STATEMENT'
                  : reportType === 'STORE_OWNER'
                    ? 'OWNER FINANCIAL LEDGER'
                    : 'STORE AUDIT STATEMENT'}
              </span>
              <p className="text-xs text-slate-500 font-semibold">
                Generated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
              </p>
              <p className="text-[11px] text-slate-400">
                Document Ref: PDF-{Date.now().toString().slice(-6)}
              </p>
            </div>
          </div>

          {/* VIEW TYPE 1: CUSTOMER SPECIFIC ISOLATED STATEMENT */}
          {reportType === 'CUSTOMER' && targetCustomer && (
            <div className="space-y-5">
              {/* Customer Contact Badge */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer Account
                  </span>
                  <h2 className="text-lg font-black text-slate-900">
                    {targetCustomer.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Mobile: {targetCustomer.phone} {targetCustomer.address ? `• ${targetCustomer.address}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ledger Status
                  </span>
                  <p
                    className={`text-sm font-extrabold ${
                      isUdhaar ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {isUdhaar ? 'Dues Outstanding' : 'All Clear / Advance'}
                  </p>
                </div>
              </div>

              {/* 1. PROMINENT CURRENT PENDING BILL & OUTSTANDING AT THE TOP */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Current Pending Bill & Outstanding Dues (Top Priority)
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                    Payable Now
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-3">
                  <div>
                    <h3 className="text-4xl font-black text-white tracking-tight">
                      ₹ {pendingAmount.toFixed(2)}
                    </h3>
                    <p className="text-xs text-indigo-200 mt-1 font-medium">
                      {isUdhaar
                        ? 'Total Pending Udhaar balance owed by customer to Ghanshyam kids wear'
                        : 'Advance deposit / credit balance with store'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-300 font-semibold">Instant UPI Pay:</p>
                    <p className="font-mono text-sm font-bold text-amber-300">
                      {storeSettings.upiId}
                    </p>
                  </div>
                </div>

                {latestCustomerTx && (
                  <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-indigo-100 gap-2">
                    <div>
                      <span className="text-slate-400">Most Recent Bill / Entry: </span>
                      <span className="font-bold text-white">
                        {latestCustomerTx.description || 'Garment item'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>
                        Date: {new Date(latestCustomerTx.timestamp).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>
                      <span className="font-black text-amber-300">
                        ₹ {latestCustomerTx.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. CHRONOLOGICAL COMPLETE HISTORICAL LEDGER FOR THIS CUSTOMER ONLY */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Complete Historical Ledger Record
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Chronological ledger of solely {targetCustomer.name}'s past dues, credits & debits ({customerTxList.length} Entries)
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Isolated Account
                  </span>
                </div>

                {customerTxList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No historical entries recorded for this customer account.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Description / Bill</th>
                          <th className="py-2.5 px-3 text-right">Debit (-)</th>
                          <th className="py-2.5 px-3 text-right">Credit (+)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerTxList.map((tx, idx) => {
                          const isGave = tx.type === 'GAVE_CREDIT';
                          return (
                            <tr
                              key={tx.id}
                              className={tx.isCleared ? 'bg-slate-50/80 opacity-60 line-through' : 'hover:bg-slate-50/50'}
                            >
                              <td className="py-2.5 px-3 font-semibold text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                                {new Date(tx.timestamp).toLocaleDateString('en-IN', {
                                  dateStyle: 'medium',
                                })}
                              </td>
                              <td className="py-2.5 px-3 font-bold">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] ${
                                    isGave
                                      ? 'bg-red-50 text-red-600 border border-red-200'
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                  }`}
                                >
                                  {isGave ? 'Udhaar (Gave)' : 'Jama (Got)'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-800 font-medium">
                                {tx.description || 'Transaction entry'}
                                {tx.billNumber && (
                                  <span className="ml-1 text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1 py-0.2 rounded">
                                    {tx.billNumber}
                                  </span>
                                )}
                                {tx.isCleared && (
                                  <span className="ml-1 text-[9px] text-slate-500 font-bold">
                                    [CANCELLED]
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-red-600 whitespace-nowrap">
                                {isGave ? `₹ ${tx.amount.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-emerald-600 whitespace-nowrap">
                                {!isGave ? `₹ ${tx.amount.toFixed(2)}` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-100/80 font-black text-slate-900">
                          <td colSpan={4} className="py-3 px-3 text-right">
                            Net Outstanding Balance:
                          </td>
                          <td
                            colSpan={2}
                            className={`py-3 px-3 text-right text-sm ${
                              isUdhaar ? 'text-red-600' : 'text-emerald-600'
                            }`}
                          >
                            ₹ {pendingAmount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW TYPE 2: STORE OWNER'S PERSONAL HISTORICAL LEDGER & REPORT */}
          {reportType === 'STORE_OWNER' && (
            <div className="space-y-5">
              {/* Store Owner Standing Cards (Top Priority) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Cash in Drawer
                  </span>
                  <p className="text-xl font-black text-slate-900">
                    ₹ {netCash.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">Daily Cash Flow</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Market Udhaar
                  </span>
                  <p className="text-xl font-black text-red-600">
                    ₹ {totalReceivables.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-red-500 font-bold">Aapko Milenge</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Supplier Payable
                  </span>
                  <p className="text-xl font-black text-indigo-700">
                    ₹ {totalPayables.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-indigo-500 font-bold">Aapko Dene Hain</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Gross Sales
                  </span>
                  <p className="text-xl font-black text-slate-900">
                    ₹ {totalSales.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold">{invoices.length} Bills Issued</span>
                </div>
              </div>

              {/* Owner's Chronological Cash Flow & Expense Journal */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Owner's Chronological Cash Flow & Expense Journal
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      All daily cash movements, counter inflows, rent, utility and store outlays
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {chronologicalCashbook.length} Entries
                  </span>
                </div>

                {chronologicalCashbook.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No cashbook journal entries on record.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Note</th>
                          <th className="py-2 px-3 text-right">Cash Out (-)</th>
                          <th className="py-2 px-3 text-right">Cash In (+)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {chronologicalCashbook.map((c, idx) => {
                          const isIn = c.type === 'CASH_IN';
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                              <td className="py-2 px-3 text-slate-700 font-medium whitespace-nowrap">
                                {new Date(c.timestamp).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-800">{c.category}</td>
                              <td className="py-2 px-3 text-slate-600">{c.note || '-'}</td>
                              <td className="py-2 px-3 text-right font-black text-red-600">
                                {!isIn ? `₹ ${c.amount.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-black text-emerald-600">
                                {isIn ? `₹ ${c.amount.toFixed(2)}` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-100 font-black text-slate-900">
                          <td colSpan={4} className="py-2.5 px-3 text-right">
                            Net Cash Balance:
                          </td>
                          <td colSpan={2} className="py-2.5 px-3 text-right text-sm text-slate-900">
                            ₹ {netCash.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Customer Receivables Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-black text-slate-900">
                    Customer Ledger Receivables Summary
                  </h3>
                  <span className="text-xs font-bold text-red-600">
                    Total: ₹ {totalReceivables.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {customers
                    .filter((c) => c.netBalance > 0)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-500">{c.phone}</p>
                        </div>
                        <span className="text-xs font-black text-red-600">
                          ₹ {c.netBalance.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {customers.filter((c) => c.netBalance > 0).length === 0 && (
                    <p className="text-xs text-slate-400 py-2">No pending customer udhaar accounts.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW TYPE 3: GENERAL STORE SUMMARY REPORT */}
          {reportType === 'STORE_SUMMARY' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Gross Store Sales
                  </span>
                  <p className="text-xl font-black text-slate-900">₹ {totalSales.toFixed(2)}</p>
                  <span className="text-[10px] text-indigo-600 font-semibold">{invoices.length} Bills</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Udhaar Outstanding
                  </span>
                  <p className="text-xl font-black text-red-600">₹ {totalReceivables.toFixed(2)}</p>
                  <span className="text-[10px] text-red-500 font-semibold">Receivable</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Cash in Hand
                  </span>
                  <p className="text-xl font-black text-emerald-600">₹ {netCash.toFixed(2)}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Available</span>
                </div>
              </div>
            </div>
          )}

          {/* Document Footer */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              <p className="font-semibold text-slate-600">
                {storeSettings.storeName} • Official Financial Document
              </p>
              <p className="text-[11px]">
                Valid and verified digital statement • Kirio Ken Architecture
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Authorized Store Signature
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar (Hidden on print) */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
