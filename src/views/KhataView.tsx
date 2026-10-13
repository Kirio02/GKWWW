import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  Users,
  MessageSquare,
  QrCode,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react';
import { Customer, StoreSettings } from '../types';
import { Strings } from '../utils/language';

interface KhataViewProps {
  customers: Customer[];
  storeSettings: StoreSettings;
  onSelectCustomer: (customer: Customer) => void;
  onOpenAddCustomer: () => void;
  onOpenContacts: () => void;
  onOpenWhatsAppContacts: () => void;
  onOpenQr: () => void;
}

export const KhataView: React.FC<KhataViewProps> = ({
  customers,
  storeSettings,
  onSelectCustomer,
  onOpenAddCustomer,
  onOpenContacts,
  onOpenWhatsAppContacts,
  onOpenQr,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RECEIVE' | 'PAY' | 'SETTLED'>('ALL');
  const lang = storeSettings.language;

  const totalReceivable = customers
    .filter((c) => c.netBalance > 0)
    .reduce((sum, c) => sum + c.netBalance, 0);

  const totalPayable = customers
    .filter((c) => c.netBalance < 0)
    .reduce((sum, c) => sum + Math.abs(c.netBalance), 0);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'RECEIVE' && c.netBalance > 0) ||
      (filterType === 'PAY' && c.netBalance < 0) ||
      (filterType === 'SETTLED' && c.netBalance === 0);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full max-w-full overflow-x-hidden pb-32">
      {/* Top Ledger Summary Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
        <div className="grid grid-cols-2 divide-x divide-slate-100 text-center">
          {/* You'll Receive */}
          <div
            onClick={() => setFilterType('RECEIVE')}
            className="px-3 cursor-pointer hover:bg-slate-50/50 rounded-2xl transition py-1"
          >
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>{Strings.youllReceive(lang)}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-emerald-600">
              ₹ {totalReceivable.toFixed(0)}
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
              Udhaar Pending
            </span>
          </div>

          {/* You'll Pay */}
          <div
            onClick={() => setFilterType('PAY')}
            className="px-3 cursor-pointer hover:bg-slate-50/50 rounded-2xl transition py-1"
          >
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-red-600" />
              <span>{Strings.youllPay(lang)}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-red-600">
              ₹ {totalPayable.toFixed(0)}
            </h3>
            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1">
              Advance / Supplier
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Pills Row */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onOpenContacts}
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-2xl text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Contacts</span>
        </button>
        <button
          onClick={onOpenWhatsAppContacts}
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-2xl text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp</span>
        </button>
        <button
          onClick={onOpenQr}
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-2xl text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-indigo-600" />
          <span>QR Code</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={Strings.searchPlaceholder(lang)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips with hidden scrollbars (Part 1 fix) */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar hide-scrollbar w-full max-w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        data-scrollable="true"
      >
        {[
          { id: 'ALL', label: `${Strings.filterAll(lang)} (${customers.length})` },
          { id: 'RECEIVE', label: Strings.youllReceive(lang) },
          { id: 'PAY', label: Strings.youllPay(lang) },
          { id: 'SETTLED', label: Strings.settled(lang) },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer border shrink-0 ${
              filterType === f.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-base">
            No khata accounts found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 font-medium">
            Tap "+ Customer Jodein" below to add a new ledger account or ask the AI Voice assistant!
          </p>
          <button
            onClick={onOpenAddCustomer}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{Strings.addCustomer(lang)}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCustomers.map((cust) => {
            const initials = cust.name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join('');
            const dateStr = new Date(cust.lastTransactionDate).toLocaleString('en-IN', {
              dateStyle: 'medium',
            });
            return (
              <div
                key={cust.id}
                onClick={() => onSelectCustomer(cust)}
                className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:shadow transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {/* Initials Avatar */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                      cust.type === 'RETAIL_PARENT'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        : cust.type === 'WHOLESALE_BUYER'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                    }`}
                  >
                    {initials || 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                        {cust.name}
                      </h4>
                      {cust.type !== 'RETAIL_PARENT' && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {cust.type === 'WHOLESALE_BUYER' ? 'Wholesale' : 'Supplier'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {cust.phone} {cust.address ? `• ${cust.address}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Last: {dateStr}
                    </p>
                  </div>
                </div>

                {/* Net Balance */}
                <div className="text-right">
                  {cust.netBalance > 0 && (
                    <>
                      <p className="text-base font-black text-emerald-600">
                        ₹ {cust.netBalance.toFixed(0)}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-700">
                        {Strings.youllReceive(lang)}
                      </p>
                    </>
                  )}
                  {cust.netBalance < 0 && (
                    <>
                      <p className="text-base font-black text-red-600">
                        ₹ {Math.abs(cust.netBalance).toFixed(0)}
                      </p>
                      <p className="text-[10px] font-bold text-red-700">
                        {Strings.youllPay(lang)}
                      </p>
                    </>
                  )}
                  {cust.netBalance === 0 && (
                    <>
                      <p className="text-sm font-bold text-slate-400">₹ 0</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {Strings.settled(lang)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Customer Button (Adjusted above bottom bar) */}
      <div className="fixed bottom-24 md:bottom-24 right-5 md:right-8 z-30">
        <button
          onClick={onOpenAddCustomer}
          className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider shadow-2xl shadow-indigo-600/40 border border-white/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-5 h-5" />
          <span>{Strings.addCustomer(lang)}</span>
        </button>
      </div>
    </div>
  );
};
