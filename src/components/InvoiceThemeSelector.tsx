import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import {
  INVOICE_THEMES,
  InvoiceDesignThemeId,
  StoreSettings,
} from '../types';

interface InvoiceThemeSelectorProps {
  storeSettings: StoreSettings;
  onApplyTheme: (themeId: InvoiceDesignThemeId) => void;
}

export const InvoiceThemeSelector: React.FC<InvoiceThemeSelectorProps> = ({
  storeSettings,
  onApplyTheme,
}) => {
  const themeKeys: InvoiceDesignThemeId[] = [
    'modern_kids',
    'classic_gst',
    'royal_blue',
    'thermal_slip',
  ];

  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = themeKeys.indexOf(storeSettings.activeInvoiceTheme);
    return idx >= 0 ? idx : 0;
  });

  const activeThemeId = themeKeys[currentIndex];
  const activeTheme = INVOICE_THEMES[activeThemeId];

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (currentIndex < themeKeys.length - 1) setCurrentIndex((i) => i + 1);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            Invoice Theme Customization
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Pick a signature bill template for Ghanshyam kids wear
          </p>
        </div>
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          {activeTheme.badgeText}
        </span>
      </div>

      {/* Central ViewPager Carousel Mock Container */}
      <div className="relative bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm overflow-hidden h-[360px] flex flex-col justify-between">
        {/* Left Arrow Button */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
            aria-label="Previous Template"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Arrow Button */}
        {currentIndex < themeKeys.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
            aria-label="Next Template"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Live Mock Template Preview */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {activeThemeId === 'modern_kids' && (
            <div className="border border-indigo-100 rounded-2xl p-4 bg-gradient-to-b from-indigo-50/60 to-white shadow-sm flex flex-col justify-between h-full">
              <div className="flex justify-between items-start border-b border-indigo-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm">
                    👗
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-indigo-950 uppercase">
                      {storeSettings.storeName}
                    </p>
                    <p className="text-[10px] text-amber-600 font-bold">
                      Kids Fashion Boutique
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  RETAIL BILL
                </span>
              </div>

              <div className="py-2 text-[11px] space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>1x Cotton Romper Set (6-12M)</span>
                  <span className="font-bold">₹699</span>
                </div>
                <div className="flex justify-between font-medium text-slate-700">
                  <span>1x Fairy Summer Frock (2-3Y)</span>
                  <span className="font-bold">₹599</span>
                </div>
              </div>

              <div className="border-t border-indigo-100 pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Total Payable</span>
                <span className="text-base font-black text-indigo-600">₹1,298.00</span>
              </div>
            </div>
          )}

          {activeThemeId === 'classic_gst' && (
            <div className="border-2 border-slate-800 rounded-xl p-4 bg-white flex flex-col justify-between h-full">
              <div className="border-b-2 border-slate-800 pb-2 flex justify-between text-xs">
                <div>
                  <p className="font-black uppercase text-slate-900">
                    {storeSettings.storeName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    TAX INVOICE • GSTIN: 24AAACG1234F1Z5
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[10px]">ORIGINAL COPY</p>
                  <p className="text-[10px] text-slate-500">Bill: GKW-1051</p>
                </div>
              </div>

              <div className="py-2 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>2x Dino Kids Night Suit (4Y)</span>
                  <span className="font-bold">₹998</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>CGST (2.5%) + SGST (2.5%)</span>
                  <span>+₹49.90</span>
                </div>
              </div>

              <div className="border-t-2 border-slate-800 pt-2 flex justify-between text-xs font-black">
                <span>NET TOTAL</span>
                <span className="text-slate-900 text-sm">₹1,047.90</span>
              </div>
            </div>
          )}

          {activeThemeId === 'royal_blue' && (
            <div className="border border-blue-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between h-full">
              <div className="bg-blue-700 text-white p-3 text-center">
                <p className="text-[9px] font-bold text-amber-300 uppercase tracking-widest">
                  ROYAL GARMENTS LETTERHEAD
                </p>
                <p className="font-black text-sm uppercase">👑 {storeSettings.storeName}</p>
                <p className="text-[9px] text-blue-100">{storeSettings.address}</p>
              </div>

              <div className="p-3 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>1x Royal Baba Silk Sherwani (4-5Y)</span>
                  <span className="font-bold text-blue-800">₹1,299</span>
                </div>
              </div>

              <div className="bg-blue-50/80 p-2.5 border-t border-blue-100 flex justify-between items-center text-xs">
                <span className="font-bold text-blue-950">Grand Net Total</span>
                <span className="font-black text-sm text-blue-700">₹1,299.00</span>
              </div>
            </div>
          )}

          {activeThemeId === 'thermal_slip' && (
            <div className="font-mono text-center border border-dashed border-slate-300 p-3 bg-slate-50/80 rounded-xl flex flex-col justify-between h-full">
              <div>
                <p className="text-[10px] text-slate-400">===========================</p>
                <p className="text-xs font-black uppercase">{storeSettings.storeName}</p>
                <p className="text-[10px] text-slate-600">COMPACT THERMAL SLIP 80MM</p>
                <p className="text-[10px] text-slate-400">===========================</p>
              </div>

              <div className="text-left text-[11px] py-1">
                <div className="flex justify-between">
                  <span>1x LED Sneakers (6K)</span>
                  <span>₹750.00</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-1 text-right text-xs font-black">
                <span>TOTAL: ₹750.00</span>
              </div>
            </div>
          )}
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {themeKeys.map((k, idx) => (
            <button
              key={k}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? 'w-6 bg-indigo-600'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stylized Premium Feature Access Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
          <Crown className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-tight">
              Premium Prints Active
            </h4>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-500 text-white">
              UNLOCKED
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            All 4 signature formats ready: Thermal POS, Classic GST, Royal Blue & Modern Boutique
          </p>
        </div>
      </div>

      {/* Horizontal Theme Selector Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {themeKeys.map((key, idx) => {
          const t = INVOICE_THEMES[key];
          const isSelected = idx === currentIndex;
          const isStoreActive = storeSettings.activeInvoiceTheme === key;

          return (
            <div
              key={key}
              onClick={() => setCurrentIndex(idx)}
              className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: t.primaryColor }}
                />
                {isStoreActive && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                )}
              </div>
              <p
                className={`text-xs font-extrabold ${
                  isSelected ? 'text-indigo-950' : 'text-slate-800'
                }`}
              >
                {t.title}
              </p>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                {t.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Apply Button */}
      <button
        onClick={() => onApplyTheme(activeThemeId)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
      >
        <Check className="w-4 h-4" />
        <span>Apply "{activeTheme.title}" As Default Bill Design</span>
      </button>
    </div>
  );
};
