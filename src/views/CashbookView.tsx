import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Calendar,
} from 'lucide-react';
import { CashEntry, CashFlowType, StoreSettings } from '../types';

interface CashbookViewProps {
  cashbook: CashEntry[];
  storeSettings: StoreSettings;
  onOpenAddCash: () => void;
}

export const CashbookView: React.FC<CashbookViewProps> = ({
  cashbook,
  storeSettings,
  onOpenAddCash,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CASH_IN' | 'CASH_OUT'>('ALL');

  const totalCashIn = cashbook
    .filter((e) => e.type === 'CASH_IN')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCashOut = cashbook
    .filter((e) => e.type === 'CASH_OUT')
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashInHand = totalCashIn - totalCashOut;

  const filteredEntries = cashbook.filter((e) => {
    if (filter === 'CASH_IN') return e.type === 'CASH_IN';
    if (filter === 'CASH_OUT') return e.type === 'CASH_OUT';
    return true;
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full max-w-full overflow-x-hidden pb-32">
      {/* Cashbook Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Net Daily Cash In Drawer
        </p>
        <h2
          className={`text-3xl md:text-4xl font-black mt-1 ${
            netCashInHand >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          ₹ {netCashInHand.toFixed(2)}
        </h2>
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 divide-x divide-slate-100">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 mb-0.5">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Total Cash In (+)</span>
            </div>
            <p className="text-xl font-black text-emerald-600">
              ₹ {totalCashIn.toFixed(2)}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-700 mb-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Total Cash Out (-)</span>
            </div>
            <p className="text-xl font-black text-red-600">
              ₹ {totalCashOut.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Cash Entries List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1">
          <h4 className="text-sm font-extrabold text-slate-900">
            Cash Entries ({cashbook.length})
          </h4>
          {/* Quick Filter Tabs with hidden scrollbar */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({cashbook.length})
            </button>
            <button
              onClick={() => setFilter('CASH_IN')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'CASH_IN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              Cash In ({cashbook.filter((e) => e.type === 'CASH_IN').length})
            </button>
            <button
              onClick={() => setFilter('CASH_OUT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'CASH_OUT'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-700 hover:text-red-900'
              }`}
            >
              Cash Out ({cashbook.filter((e) => e.type === 'CASH_OUT').length})
            </button>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
            <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h5 className="font-bold text-slate-700 text-sm">
              {filter === 'ALL'
                ? 'No cash transactions recorded'
                : filter === 'CASH_IN'
                ? 'No Cash In transactions recorded'
                : 'No Cash Out expense entries recorded'}
            </h5>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              Track counter cash inflows, tea/utility expenses, and daily registers.
            </p>
            <button
              onClick={onOpenAddCash}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Cash Entry</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredEntries.map((entry) => {
              const isIn = entry.type === 'CASH_IN';
              const dateStr = new Date(entry.timestamp).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });
              return (
                <div
                  key={entry.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isIn
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-red-50 text-red-600 border border-red-100'
                      }`}
                    >
                      {isIn ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-sm text-slate-900">
                          {entry.category}
                        </h5>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isIn
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isIn ? 'Cash In' : 'Cash Out'}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {entry.note}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {dateStr}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-base font-black ${
                        isIn ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {isIn ? '+' : '-'} ₹{entry.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Add Cash Button */}
      <div className="fixed bottom-24 md:bottom-24 right-5 md:right-8 z-30">
        <button
          onClick={onOpenAddCash}
          className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider shadow-2xl shadow-indigo-600/40 border border-white/20 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add Cash Entry</span>
        </button>
      </div>
    </div>
  );
};
