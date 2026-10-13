import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Smartphone,
  Printer,
  Copy,
  Check,
  Share2,
  Calendar,
  AlertCircle,
  FileText,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Customer, KhataTransaction, StoreSettings } from '../types';

interface PaymentReminderModalProps {
  customer: Customer;
  transactions: KhataTransaction[];
  storeSettings: StoreSettings;
  onDismiss: () => void;
}

export const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({
  customer,
  transactions,
  storeSettings,
  onDismiss,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [copied, setCopied] = useState(false);

  // Filter only this customer's transactions and sort chronologically (oldest to newest for ledger)
  const customerTxList = transactions
    .filter((t) => t.customerId === customer.id)
    .sort((a, b) => a.timestamp - b.timestamp);

  // The latest pending transaction or bill (most recent entry)
  const latestTx = customerTxList[customerTxList.length - 1];
  const pendingAmount = Math.abs(customer.netBalance);
  const isUdhaar = customer.netBalance > 0;

  // Build the isolated customer statement text
  const generateStatementText = () => {
    const header = `*${storeSettings.storeName.toUpperCase()} - KHATA STATEMENT*
Customer: ${customer.name}
Phone: ${customer.phone}
Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}
----------------------------------------`;

    // 1. Current pending balance / latest bill prominently at the top
    const pendingSection = `*CURRENT PENDING DUES (TOP PRIORITY):*
*Total Outstanding Balance: ₹ ${pendingAmount.toFixed(2)}*
${latestTx ? `Latest Bill/Entry: ₹ ${latestTx.amount.toFixed(2)} (${latestTx.type === 'GAVE_CREDIT' ? 'Udhaar' : 'Jama'}) on ${new Date(latestTx.timestamp).toLocaleDateString('en-IN')}\nDescription: ${latestTx.description || 'Garment bill'}` : ''}
Pay via UPI: ${storeSettings.upiId}
----------------------------------------`;

    // 2. Chronological complete historical ledger for this customer only
    const historySection = `*COMPLETE HISTORICAL LEDGER:*
${customerTxList.length === 0
  ? 'No past ledger entries found.'
  : customerTxList
      .map((t, idx) => {
        const d = new Date(t.timestamp).toLocaleDateString('en-IN');
        const sign = t.type === 'GAVE_CREDIT' ? '[-] Udhaar Gave' : '[+] Jama Received';
        const note = t.description ? ` (${t.description})` : '';
        const bill = t.billNumber ? ` [Bill: ${t.billNumber}]` : '';
        const status = t.isCleared ? ' [CANCELLED]' : '';
        return `${idx + 1}. ${d}: ${sign} ₹ ${t.amount.toFixed(2)}${note}${bill}${status}`;
      })
      .join('\n')}
----------------------------------------
Store: ${storeSettings.storeName}
Address: ${storeSettings.address}
Phone: ${storeSettings.phone}
_Engineered by Kirio Ken_`;

    return `${header}\n${pendingSection}\n${historySection}`;
  };

  const fullStatementText = generateStatementText();

  const handleCopy = () => {
    navigator.clipboard.writeText(fullStatementText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const reminderMsg = `Namaste ${customer.name} ji,\n\nGentle payment reminder from *${storeSettings.storeName}*.\nYour current pending balance is *₹ ${pendingAmount.toFixed(2)}*.\n\nPlease find your isolated khata statement below:\n\n${fullStatementText}\n\nPlease clear via UPI: ${storeSettings.upiId} or visit our store. Thank you!`;
    const url = cleanPhone.length >= 10
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(reminderMsg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(reminderMsg)}`;
    window.open(url, '_blank');
  };

  const handleSendSms = () => {
    const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
    const smsMsg = `Namaste ${customer.name}, Reminder from ${storeSettings.storeName}: Your pending khata balance is Rs ${pendingAmount.toFixed(2)}. Pay via UPI: ${storeSettings.upiId}. Full statement: https://ghanshyam.app/s/${customer.id.substring(0, 8)}`;
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(smsMsg)}`;
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 md:px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  Payment Reminder & Statement Sharing
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Customer: {customer.name} • {customer.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Selection Tabs (WhatsApp vs SMS) */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
            <button
              onClick={() => setSelectedChannel('WHATSAPP')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition cursor-pointer border ${
                selectedChannel === 'WHATSAPP'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>
            <button
              onClick={() => setSelectedChannel('SMS')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition cursor-pointer border ${
                selectedChannel === 'SMS'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Share via SMS</span>
            </button>
          </div>
        </div>

        {/* Scrollable Statement Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/70 no-scrollbar">
          {/* 1. PROMINENT CURRENT PENDING BILL / OUTSTANDING AT THE TOP */}
          <div className="bg-gradient-to-tr from-indigo-900 to-indigo-800 text-white rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
                CURRENT PENDING BILL & OUTSTANDING
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                TOP PRIORITY
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <p className="text-3xl font-black text-white">
                  ₹ {pendingAmount.toFixed(2)}
                </p>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {isUdhaar ? 'Pending Udhaar (Customer Owes)' : 'Advance Paid (Credit Balance)'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-indigo-200">Store UPI ID:</p>
                <p className="font-mono text-xs font-bold text-amber-300">
                  {storeSettings.upiId}
                </p>
              </div>
            </div>
            {latestTx && (
              <div className="mt-4 pt-3 border-t border-indigo-700/60 flex items-center justify-between text-xs text-indigo-100">
                <span>
                  Latest Entry: {new Date(latestTx.timestamp).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
                <span className="font-bold">
                  {latestTx.type === 'GAVE_CREDIT' ? 'Udhaar' : 'Jama'}: ₹ {latestTx.amount.toFixed(0)}
                </span>
              </div>
            )}
          </div>

          {/* 2. CHRONOLOGICAL COMPLETE HISTORICAL LEDGER FOR THIS CUSTOMER ONLY */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Customer's Isolated Historical Ledger ({customerTxList.length} Entries)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Chronological order • Isolated to {customer.name}
              </span>
            </div>

            {customerTxList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No historical transactions on record for this customer.
              </p>
            ) : (
              <div className="space-y-2">
                {customerTxList.map((tx, idx) => {
                  const isGave = tx.type === 'GAVE_CREDIT';
                  const dateStr = new Date(tx.timestamp).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });
                  return (
                    <div
                      key={tx.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        tx.isCleared
                          ? 'bg-slate-50 border-slate-200 line-through opacity-60'
                          : 'bg-white border-slate-200/90 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isGave
                              ? 'bg-red-50 text-red-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {isGave ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">
                              #{idx + 1} {isGave ? 'Udhaar (Diye)' : 'Jama (Mile)'}
                            </span>
                            {tx.billNumber && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1 rounded">
                                {tx.billNumber}
                              </span>
                            )}
                            {tx.isCleared && (
                              <span className="text-[9px] font-extrabold text-slate-500 bg-slate-200 px-1 rounded">
                                CANCELLED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {tx.description || tx.paymentMode} • {dateStr}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-black ${
                            isGave ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {isGave ? '-' : '+'} ₹{tx.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Statement'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {selectedChannel === 'WHATSAPP' ? (
              <button
                onClick={handleSendWhatsApp}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send WhatsApp Reminder & Statement</span>
              </button>
            ) : (
              <button
                onClick={handleSendSms}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/25 transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Send SMS Reminder & Statement</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
