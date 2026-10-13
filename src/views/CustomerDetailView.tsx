import React from 'react';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  QrCode,
  CheckCircle2,
  Share2,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from 'lucide-react';
import {
  Customer,
  KhataTransaction,
  StoreSettings,
  TransactionType,
} from '../types';
import { Strings } from '../utils/language';

interface CustomerDetailViewProps {
  customer: Customer;
  transactions: KhataTransaction[];
  storeSettings: StoreSettings;
  onBack: () => void;
  onOpenAddTransaction: (isCredit: boolean) => void;
  onToggleCleared: (transactionId: string) => void;
  onSettleAll: () => void;
  onOpenQr: (amount: number) => void;
  onOpenReminder: () => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customer,
  transactions,
  storeSettings,
  onBack,
  onOpenAddTransaction,
  onToggleCleared,
  onSettleAll,
  onOpenQr,
  onOpenReminder,
}) => {
  const [lightboxPhoto, setLightboxPhoto] = React.useState<string | null>(null);
  const lang = storeSettings.language;

  const customerTransactions = transactions.filter(
    (t) => t.customerId === customer.id
  );

  const handleCall = () => {
    window.location.href = `tel:${customer.phone}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full max-w-full overflow-x-hidden">
      {/* Top Customer Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Back to Khata list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 leading-tight">
              {customer.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {customer.phone} {customer.address ? `• ${customer.address}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCall}
            className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer"
            title="Call Customer"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenReminder}
            className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
            title="Send Payment Reminder & Statement"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full no-scrollbar pb-32">
        {/* Net Balance Banner Card */}
        <div
          className={`rounded-3xl p-5 border shadow-sm ${
            customer.netBalance > 0
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : customer.netBalance < 0
                ? 'bg-red-50/70 border-red-200 text-red-950'
                : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}
        >
          <div className="text-center">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                customer.netBalance > 0
                  ? 'text-emerald-700'
                  : customer.netBalance < 0
                    ? 'text-red-700'
                    : 'text-slate-500'
              }`}
            >
              {customer.netBalance > 0
                ? `${Strings.youllReceive(lang)} (Udhaar Pending)`
                : customer.netBalance < 0
                  ? `${Strings.youllPay(lang)} (Advance Paid)`
                  : Strings.settled(lang)}
            </span>
            <h2
              className={`text-3xl md:text-4xl font-black mt-1 ${
                customer.netBalance > 0
                  ? 'text-emerald-700'
                  : customer.netBalance < 0
                    ? 'text-red-600'
                    : 'text-slate-700'
              }`}
            >
              ₹ {Math.abs(customer.netBalance).toFixed(2)}
            </h2>
          </div>

          {/* Quick Action Pills inside Balance Card */}
          <div className="mt-4 pt-4 border-t border-black/10 flex flex-wrap items-center justify-around gap-2">
            <button
              onClick={onOpenReminder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-bold text-slate-800 shadow-sm border border-black/5 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Reminder & Statement</span>
            </button>
            {customer.netBalance > 0 && (
              <button
                onClick={() => onOpenQr(customer.netBalance)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-bold text-slate-800 shadow-sm border border-black/5 transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>UPI Payment QR</span>
              </button>
            )}
            {customer.netBalance !== 0 && (
              <button
                onClick={onSettleAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-bold text-emerald-700 shadow-sm border border-black/5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Settle All (Chukta)</span>
              </button>
            )}
          </div>
        </div>

        {/* Ledger Instruction Banner */}
        <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-3.5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 font-medium">
            <span className="font-extrabold">Manual Tick to Cancel Out: </span>
            Kisi bhi transaction par tick lagane se wo entry cancel ho jati hai aur customer ka net balance turant adjust hota hai.
          </div>
        </div>

        {/* Transaction Entries List */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-sm font-extrabold text-slate-900">
              Transaction Entries ({customerTransactions.length})
            </h4>
            <span className="text-xs text-slate-500 font-semibold">
              Tap checkbox to cancel out
            </span>
          </div>

          {customerTransactions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No transactions recorded</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Use the buttons below to record credit given or payment received.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {customerTransactions.map((tx) => {
                const isGave = tx.type === 'GAVE_CREDIT';
                const dateStr = new Date(tx.timestamp).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });
                return (
                  <div
                    key={tx.id}
                    className={`bg-white border rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all ${
                      tx.isCleared
                        ? 'border-slate-200 bg-slate-100/60 opacity-60'
                        : 'border-slate-200/90 shadow-sm hover:border-slate-300'
                    }`}
                  >
                    {/* Checkbox for manual tick / cancel out */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={tx.isCleared}
                        onChange={() => onToggleCleared(tx.id)}
                        className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Tick to cancel out entry"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-black uppercase tracking-wider ${
                              tx.isCleared
                                ? 'line-through text-slate-400'
                                : isGave
                                  ? 'text-red-600'
                                  : 'text-emerald-600'
                            }`}
                          >
                            {isGave ? Strings.youGave(lang) : Strings.youGot(lang)}
                          </span>
                          {tx.isCleared && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                              CANCELLED
                            </span>
                          )}
                          {tx.billNumber && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                              {tx.billNumber}
                            </span>
                          )}
                        </div>

                        {tx.description && (
                          <p
                            className={`text-xs font-medium mt-0.5 ${
                              tx.isCleared
                                ? 'line-through text-slate-400'
                                : 'text-slate-800'
                            }`}
                          >
                            {tx.description}
                          </p>
                        )}

                        {tx.photoUrl && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={tx.photoUrl}
                              alt="Attached slip"
                              onClick={() => setLightboxPhoto(tx.photoUrl || null)}
                              className="w-10 h-10 object-cover rounded-lg border border-indigo-200 cursor-pointer hover:opacity-90 transition shadow-2xs"
                              title="Click to zoom bill photo"
                            />
                            <button
                              type="button"
                              onClick={() => setLightboxPhoto(tx.photoUrl || null)}
                              className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              📷 View Attached Bill Slip
                            </button>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400 mt-1">
                          {dateStr} • {tx.paymentMode}
                        </p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p
                        className={`text-base font-black ${
                          tx.isCleared
                            ? 'line-through text-slate-400'
                            : isGave
                              ? 'text-red-600'
                              : 'text-emerald-600'
                        }`}
                      >
                        ₹ {tx.amount.toFixed(2)}
                      </p>
                      {tx.isCleared && (
                        <p className="text-[10px] text-slate-400 font-bold">
                          Excluded
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Khatabook Dual Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white border-t border-slate-200 shadow-lg w-full max-w-full box-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3">
          {/* AAPNE DIYE (YOU GAVE) BUTTON */}
          <button
            onClick={() => onOpenAddTransaction(true)}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-red-600/25 transition cursor-pointer"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>{Strings.youGave(lang)} 🔴</span>
          </button>

          {/* AAPKO MILE (YOU GOT) BUTTON */}
          <button
            onClick={() => onOpenAddTransaction(false)}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition cursor-pointer"
          >
            <ArrowDownLeft className="w-5 h-5" />
            <span>{Strings.youGot(lang)} 🟢</span>
          </button>
        </div>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-4 max-w-lg w-full flex flex-col items-center shadow-2xl">
            <div className="w-full flex justify-between items-center mb-2">
              <h4 className="font-extrabold text-sm text-slate-900">
                Attached Bill / Receipt Photo
              </h4>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxPhoto}
              alt="Bill slip full view"
              className="max-h-[70vh] rounded-2xl object-contain w-full border border-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};
