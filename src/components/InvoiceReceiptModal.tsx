import React from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Sparkles,
  Store,
  FileCheck,
} from 'lucide-react';
import { BillInvoice, INVOICE_THEMES, StoreSettings } from '../types';
import { isClothingOrKidsItem, sanitizeInvoiceNote } from '../utils/clothingUtils';

interface InvoiceReceiptModalProps {
  invoice: BillInvoice;
  storeSettings: StoreSettings;
  onDismiss: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  storeSettings,
  onDismiss,
}) => {
  const theme = INVOICE_THEMES[invoice.designTheme] || INVOICE_THEMES.modern_kids;
  const dateStr = new Date(invoice.timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const cleanNotes = sanitizeInvoiceNote(invoice.optionalNotes);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*${storeSettings.storeName.toUpperCase()}*
Bill No: ${invoice.invoiceNumber}
Date: ${dateStr}
Customer: ${invoice.customerName}

Items (${invoice.items.length}):
${invoice.items
  .map((i) => {
    const showSize = i.size && isClothingOrKidsItem(i.itemName);
    return `• ${i.itemName}${showSize ? ` (${i.size})` : ''} x${i.quantity} = ₹${(i.quantity * i.unitPrice).toFixed(0)}`;
  })
  .join('\n')}
--------------------------------
Subtotal: ₹${invoice.subtotal.toFixed(2)}
${invoice.discountAmount > 0 ? `Discount: -₹${invoice.discountAmount.toFixed(2)}\n` : ''}${invoice.additionalCharges > 0 ? `Delivery/Packaging: +₹${invoice.additionalCharges.toFixed(2)}\n` : ''}${invoice.gstAmount > 0 ? `GST (${invoice.gstPercent}%): +₹${invoice.gstAmount.toFixed(2)}\n` : ''}*Net Payable: ₹${invoice.netTotal.toFixed(2)}*
Payment Mode: ${invoice.paymentMode}

Pay via UPI: ${storeSettings.upiId}

Thank you for shopping at ${storeSettings.storeName}!
_Engineered by Kirio Ken_`;

    const cleanPhone = invoice.customerPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone.length >= 10
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200">
        {/* Top actions bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Receipt Preview • {theme.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Print Bill"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="p-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
              title="Share via WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDismiss}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-white text-slate-900 font-sans print:p-0 no-scrollbar">
          {/* THEME 1: MODERN KIDS BOUTIQUE */}
          {invoice.designTheme === 'modern_kids' && (
            <div className="border border-indigo-100 rounded-2xl p-5 bg-gradient-to-b from-indigo-50/40 to-white shadow-sm">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/20 text-lg">
                    👗
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-indigo-950 uppercase tracking-tight">
                      {storeSettings.storeName}
                    </h2>
                    <p className="text-[11px] font-bold text-amber-600">
                      Kids Fashion & Garments Boutique
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    RETAIL INVOICE
                  </span>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    {invoice.invoiceNumber}
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 py-2 border-b border-indigo-50 flex justify-between">
                <span>{storeSettings.address}</span>
                <span>Ph: {storeSettings.phone}</span>
              </div>
            </div>
          )}

          {/* THEME 2: CLASSIC RETAIL GST */}
          {invoice.designTheme === 'classic_gst' && (
            <div className="border-2 border-slate-800 rounded-xl p-5 bg-white">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black uppercase text-slate-900 tracking-wider">
                    {storeSettings.storeName}
                  </h2>
                  <p className="text-xs font-bold text-slate-600">
                    TAX INVOICE (GST COMPLIANT)
                  </p>
                  <p className="text-[11px] text-slate-500">{storeSettings.address}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-extrabold text-slate-900">
                    Bill No: {invoice.invoiceNumber}
                  </p>
                  <p className="text-slate-500 text-[11px]">GSTIN: {invoice.gstinNumber || '24AAACG1234F1Z5'}</p>
                  <p className="text-slate-500 text-[11px]">State: {invoice.stateOfSupply}</p>
                </div>
              </div>
            </div>
          )}

          {/* THEME 3: ROYAL BLUE LETTERHEAD */}
          {invoice.designTheme === 'royal_blue' && (
            <div className="border border-blue-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="bg-blue-700 text-white p-4 text-center">
                <p className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">
                  ESTD. PREMIUM KIDS GARMENTS
                </p>
                <h2 className="text-xl font-black tracking-wide uppercase">
                  👑 {storeSettings.storeName}
                </h2>
                <p className="text-xs text-blue-100 mt-0.5">{storeSettings.address}</p>
              </div>
              <div className="p-3 bg-blue-50/70 border-b border-blue-100 flex justify-between text-xs font-semibold text-blue-900">
                <span>Invoice: {invoice.invoiceNumber}</span>
                <span>Ph: {storeSettings.phone}</span>
              </div>
            </div>
          )}

          {/* THEME 4: COMPACT THERMAL SLIP */}
          {invoice.designTheme === 'thermal_slip' && (
            <div className="font-mono text-center border border-dashed border-slate-300 p-4 bg-slate-50/80 rounded-xl">
              <p className="text-xs font-bold">*********************************</p>
              <h2 className="text-sm font-black uppercase tracking-wider">
                {storeSettings.storeName}
              </h2>
              <p className="text-[11px] text-slate-600">POS CASH RECEIPT (80mm)</p>
              <p className="text-[10px] text-slate-500">{storeSettings.phone}</p>
              <p className="text-xs font-bold">*********************************</p>
            </div>
          )}

          {/* Common Invoice Metadata (Customer & Date) */}
          <div className="my-4 py-2 border-y border-slate-100 flex justify-between items-center text-xs">
            <div>
              <p className="text-slate-500 text-[11px]">Billed To:</p>
              <p className="font-bold text-slate-900 text-sm">
                {invoice.customerName}
              </p>
              {invoice.customerPhone && (
                <p className="text-slate-500 text-[11px]">
                  {invoice.customerPhone}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-[11px]">Date & Time:</p>
              <p className="font-semibold text-slate-800">{dateStr}</p>
              <span
                className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded mt-0.5 ${
                  invoice.paymentMode === 'CREDIT'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                Mode: {invoice.paymentMode}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="my-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="text-left py-1.5">Description</th>
                  <th className="text-center py-1.5">Qty</th>
                  <th className="text-right py-1.5">Rate</th>
                  <th className="text-right py-1.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => {
                  const showSize = item.size && isClothingOrKidsItem(item.itemName);
                  return (
                    <tr key={idx} className="text-slate-800">
                      <td className="py-2 text-left">
                        <p className="font-bold">{item.itemName}</p>
                        {showSize && (
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                            Size: {item.size}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-center font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-2 text-right text-slate-500">
                        ₹{item.unitPrice.toFixed(0)}
                      </td>
                      <td className="py-2 text-right font-bold text-slate-900">
                        ₹{(item.quantity * item.unitPrice).toFixed(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Amount Calculation Summary */}
          <div className="my-4 pt-3 border-t border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold">₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-bold">-₹{invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {invoice.additionalCharges > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Delivery / Packaging Charges</span>
                <span className="font-semibold">+₹{invoice.additionalCharges.toFixed(2)}</span>
              </div>
            )}
            {invoice.gstAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>GST ({invoice.gstPercent}%)</span>
                <span className="font-semibold">+₹{invoice.gstAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-200">
              <span>Net Payable Amount</span>
              <span className="text-base font-black text-indigo-700">
                ₹{invoice.netTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Attached Bill / Slip Photo */}
          {invoice.photoUrl && (
            <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left">
              <p className="text-[11px] font-bold text-slate-700 mb-1.5">Attached Bill / Slip Photo:</p>
              <img
                src={invoice.photoUrl}
                alt="Bill Slip Attachment"
                className="max-h-48 rounded-xl object-contain border border-slate-200 w-full bg-white"
              />
            </div>
          )}

          {/* Notes & UPI QR Box */}
          {cleanNotes && (
            <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 my-3 border border-slate-100">
              <span className="font-bold text-slate-700">Note: </span>
              {cleanNotes}
            </div>
          )}

          <div className="mt-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-indigo-950">Pay via UPI QR / ID:</p>
              <p className="font-mono text-indigo-700 text-[11px]">
                {storeSettings.upiId}
              </p>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded bg-indigo-600 text-white">
              GPay • PhonePe • Paytm
            </span>
          </div>

          {/* Developer Attribution Tag */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              System Engineered by Kirio Ken • Ghanshyam kids wear
            </p>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 shrink-0">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
