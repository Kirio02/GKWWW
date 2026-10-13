import React, { useState } from 'react';
import {
  Receipt,
  Palette,
  History,
  Calendar,
  User,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Share2,
  FileCheck,
  Check,
  Truck,
  Percent,
  Lock,
} from 'lucide-react';
import {
  BillInvoice,
  Customer,
  InvoiceDesignThemeId,
  OrderItem,
  StoreSettings,
} from '../types';
import { InvoiceThemeSelector } from '../components/InvoiceThemeSelector';
import {
  isClothingOrKidsItem,
  COMMON_KIDS_SIZES,
  sanitizeInvoiceNote,
} from '../utils/clothingUtils';

interface BillingViewProps {
  storeSettings: StoreSettings;
  customers: Customer[];
  invoices: BillInvoice[];
  cartItems: OrderItem[];
  onUpdateCartQty: (index: number, delta: number) => void;
  onClearCart: () => void;
  onSaveBill: (invoiceData: {
    customerId: string | null;
    customerName: string;
    customerPhone: string;
    discountAmount: number;
    additionalCharges: number;
    gstPercent: number;
    paymentMode: string;
    gstinNumber: string;
    stateOfSupply: string;
    optionalNotes: string;
    privateNote: string;
    designTheme: InvoiceDesignThemeId;
    photoUrl?: string;
    customDate?: number;
  }) => void;
  onViewInvoice: (invoice: BillInvoice) => void;
  onApplyTheme: (themeId: InvoiceDesignThemeId) => void;
  onBrowseStock: () => void;
  onAddCustomItem?: (item: OrderItem) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  storeSettings,
  customers,
  invoices,
  cartItems,
  onUpdateCartQty,
  onClearCart,
  onSaveBill,
  onViewInvoice,
  onApplyTheme,
  onBrowseStock,
  onAddCustomItem,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'NEW_BILL' | 'THEMES' | 'HISTORY'>('NEW_BILL');

  // Form state for New Bill
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('Walk-in Customer');
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [discountStr, setDiscountStr] = useState('0');
  const [additionalChargesStr, setAdditionalChargesStr] = useState('0');
  const [showDeliveryFee, setShowDeliveryFee] = useState(false);
  const [selectedGstPercent, setSelectedGstPercent] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('CASH');
  const [billDateStr, setBillDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [billPhotoUrl, setBillPhotoUrl] = useState<string | null>(null);
  const billFileRef = React.useRef<HTMLInputElement>(null);

  const [showGstinSection, setShowGstinSection] = useState(false);
  const [gstinNumber, setGstinNumber] = useState('');
  const [stateOfSupply, setStateOfSupply] = useState('Gujarat (24)');

  const [showNotesSection, setShowNotesSection] = useState(false);
  const [optionalNotes, setOptionalNotes] = useState('');
  const [privateNote, setPrivateNote] = useState('');

  // Custom Item Form state
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemRate, setCustomItemRate] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');
  const [customItemSize, setCustomItemSize] = useState('2-4 Yrs');

  const isClothCustom = isClothingOrKidsItem(customItemName);

  const handleAddCustom = () => {
    if (!customItemName.trim()) return;
    const rate = parseFloat(customItemRate) || 0;
    const qty = parseInt(customItemQty, 10) || 1;
    const item: OrderItem = {
      itemId: '',
      itemName: customItemName.trim(),
      size: isClothCustom ? customItemSize.trim() : '',
      quantity: qty,
      unitPrice: rate,
    };
    if (onAddCustomItem) {
      onAddCustomItem(item);
    }
    setCustomItemName('');
    setCustomItemRate('');
    setCustomItemQty('1');
    setCustomItemSize('2-4 Yrs');
    setShowCustomItemForm(false);
  };

  const nextInvoiceNumber = `GKW-${1051 + invoices.length}`;
  const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = parseFloat(discountStr) || 0;
  const additionalCharges = showDeliveryFee ? parseFloat(additionalChargesStr) || 0 : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxablePlusCharges = discountedSubtotal + additionalCharges;
  const gstAmount = taxablePlusCharges * (selectedGstPercent / 100);
  const netTotal = taxablePlusCharges + gstAmount;

  const handleCreateBill = () => {
    if (cartItems.length === 0) {
      alert('Please add items to cart before generating bill!');
      return;
    }
    const chosenTimestamp = billDateStr ? new Date(billDateStr).getTime() : Date.now();
    onSaveBill({
      customerId: selectedCustomer?.id || null,
      customerName: customerNameInput.trim() || 'Walk-in Customer',
      customerPhone: customerPhoneInput.trim(),
      discountAmount: discount,
      additionalCharges,
      gstPercent: selectedGstPercent,
      paymentMode,
      gstinNumber,
      stateOfSupply,
      optionalNotes: sanitizeInvoiceNote(optionalNotes),
      privateNote: sanitizeInvoiceNote(privateNote),
      designTheme: storeSettings.activeInvoiceTheme,
      photoUrl: billPhotoUrl || undefined,
      customDate: chosenTimestamp,
    });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full max-w-full overflow-x-hidden pb-44">
      {/* 3-Way Sub-Tab Switcher */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 flex items-center shadow-sm">
        <button
          onClick={() => setActiveSubTab('NEW_BILL')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'NEW_BILL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>New Bill ({cartItems.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('THEMES')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'THEMES'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Designs (4)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('HISTORY')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'HISTORY'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Past Bills ({invoices.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: NEW BILL FORM */}
      {activeSubTab === 'NEW_BILL' && (
        <div className="space-y-4">
          {/* 1. Invoice Number & Date */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400">Invoice Number</p>
              <h4 className="text-base font-black text-indigo-700">
                {nextInvoiceNumber}
              </h4>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Today: {new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
          </div>

          {/* 2. Customer / Party Selection */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Customer / Party Details
                </h4>
              </div>
              {selectedCustomer && (
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerNameInput('Walk-in Customer');
                    setCustomerPhoneInput('');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Change Party
                </button>
              )}
            </div>

            {selectedCustomer ? (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-sm text-indigo-950">
                    {selectedCustomer.name}
                  </p>
                  <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500">Khata: </span>
                  <span
                    className={`text-xs font-black ${
                      selectedCustomer.netBalance > 0
                        ? 'text-emerald-700'
                        : selectedCustomer.netBalance < 0
                          ? 'text-red-600'
                          : 'text-slate-600'
                    }`}
                  >
                    ₹ {selectedCustomer.netBalance.toFixed(0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    placeholder="Customer Name (e.g. Ramesh Bhai or Walk-in)"
                    className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                  />
                  <input
                    type="tel"
                    value={customerPhoneInput}
                    onChange={(e) => setCustomerPhoneInput(e.target.value)}
                    placeholder="Customer Mobile (For WhatsApp Bill)"
                    className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                  />
                </div>
                {customers.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      Or Quick Select from Khata:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {customers.slice(0, 4).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerNameInput(c.name);
                            setCustomerPhoneInput(c.phone);
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-700 transition cursor-pointer"
                        >
                          {c.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Items in Bill */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Kids Wear Items ({cartItems.length})
                </h4>
              </div>
              {cartItems.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="space-y-3">
                <div
                  onClick={onBrowseStock}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-slate-50/50 transition"
                >
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-extrabold text-slate-700">
                    No items added to bill yet
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tap to browse kids wear catalog or create a custom item / bill below
                  </p>
                </div>

                {showCustomItemForm ? (
                  <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-3.5 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-950">
                        Add Custom Bill Item / Service
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCustomItemForm(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Description *
                        </label>
                        <input
                          type="text"
                          value={customItemName}
                          onChange={(e) => setCustomItemName(e.target.value)}
                          placeholder="e.g. Water Bill, School Uniform, Baba Kurta"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Rate (₹)
                          </label>
                          <input
                            type="number"
                            value={customItemRate}
                            onChange={(e) => setCustomItemRate(e.target.value)}
                            placeholder="Amount"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Qty
                          </label>
                          <input
                            type="number"
                            value={customItemQty}
                            onChange={(e) => setCustomItemQty(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                          />
                        </div>
                      </div>
                    </div>

                    {isClothCustom ? (
                      <div className="pt-2 border-t border-amber-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-700">
                            Kids Wear Size / Age (Years):
                          </label>
                          <span className="text-[9px] text-amber-800 font-semibold">
                            Type years or pick
                          </span>
                        </div>
                        <input
                          type="text"
                          value={customItemSize}
                          onChange={(e) => setCustomItemSize(e.target.value)}
                          placeholder="e.g. 2-3 Yrs, 4-5 Yrs, 6-8 Yrs"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1">
                          {COMMON_KIDS_SIZES.slice(0, 7).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setCustomItemSize(sz)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                                customItemSize === sz
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'bg-white text-slate-600 border-amber-200'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic bg-amber-100/40 px-2 py-1 rounded">
                        Size section hidden (non-clothing item)
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={!customItemName.trim() || !(parseFloat(customItemRate) > 0)}
                      onClick={handleAddCustom}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow transition cursor-pointer"
                    >
                      + Add Item to Cart
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomItemForm(true)}
                    className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Custom Bill Item / Service</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">
                        {item.itemName}
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {isClothingOrKidsItem(item.itemName) && item.size
                          ? `Size: ${item.size} • `
                          : ''}
                        Rate: ₹{item.unitPrice.toFixed(0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                        <button
                          onClick={() => onUpdateCartQty(idx, -1)}
                          className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateCartQty(idx, 1)}
                          className="p-1 text-slate-500 hover:text-emerald-600 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs font-black text-indigo-700 min-w-14 text-right">
                        ₹{(item.quantity * item.unitPrice).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Custom Item Quick Form */}
                {showCustomItemForm && (
                  <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-3.5 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-950">
                        Add Custom Bill Item / Service
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCustomItemForm(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Description *
                        </label>
                        <input
                          type="text"
                          value={customItemName}
                          onChange={(e) => setCustomItemName(e.target.value)}
                          placeholder="e.g. Water Bill, School Uniform, Baba Kurta"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Rate (₹)
                          </label>
                          <input
                            type="number"
                            value={customItemRate}
                            onChange={(e) => setCustomItemRate(e.target.value)}
                            placeholder="Amount"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Qty
                          </label>
                          <input
                            type="number"
                            value={customItemQty}
                            onChange={(e) => setCustomItemQty(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                          />
                        </div>
                      </div>
                    </div>

                    {isClothCustom ? (
                      <div className="pt-2 border-t border-amber-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-700">
                            Kids Wear Size / Age (Years):
                          </label>
                          <span className="text-[9px] text-amber-800 font-semibold">
                            Type years or pick
                          </span>
                        </div>
                        <input
                          type="text"
                          value={customItemSize}
                          onChange={(e) => setCustomItemSize(e.target.value)}
                          placeholder="e.g. 2-3 Yrs, 4-5 Yrs, 6-8 Yrs"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1">
                          {COMMON_KIDS_SIZES.slice(0, 7).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setCustomItemSize(sz)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                                customItemSize === sz
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'bg-white text-slate-600 border-amber-200'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic bg-amber-100/40 px-2 py-1 rounded">
                        Size section hidden (non-clothing item)
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={!customItemName.trim() || !(parseFloat(customItemRate) > 0)}
                      onClick={handleAddCustom}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow transition cursor-pointer"
                    >
                      + Add Item to Cart
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={onBrowseStock}
                    className="py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ From Stock Catalog</span>
                  </button>
                  <button
                    onClick={() => setShowCustomItemForm(true)}
                    className="py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Custom Item / Bill</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Additional Charges Toggle */}
          {cartItems.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Delivery / Gift Packaging Charges
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showDeliveryFee}
                  onChange={(e) => setShowDeliveryFee(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
              </div>
              {showDeliveryFee && (
                <div className="pt-2">
                  <input
                    type="number"
                    value={additionalChargesStr}
                    onChange={(e) => setAdditionalChargesStr(e.target.value)}
                    placeholder="Delivery / Packaging fee (₹)"
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* 5. Amount Breakdown Layout */}
          {cartItems.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 text-xs">
              <h4 className="font-extrabold text-sm text-slate-900 mb-2">
                Amount Breakdown
              </h4>
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold">₹ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Discount (₹)</span>
                <input
                  type="number"
                  value={discountStr}
                  onChange={(e) => setDiscountStr(e.target.value)}
                  className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-right text-xs font-bold"
                />
              </div>
              {showDeliveryFee && additionalCharges > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Delivery / Charges</span>
                  <span className="font-bold">+ ₹{additionalCharges.toFixed(2)}</span>
                </div>
              )}
              {/* GST rate selection */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 font-semibold">GST Rate:</span>
                <div className="flex gap-1">
                  {[0, 5, 12, 18].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setSelectedGstPercent(rate)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                        selectedGstPercent === rate
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
              {gstAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST Amount</span>
                  <span className="font-bold">+ ₹{gstAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Net Bill Amount</span>
                <span className="text-base text-indigo-700">₹ {netTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* 6. GSTIN & State of Supply (Optional) */}
          {cartItems.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    GSTIN & State of Supply (Optional)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showGstinSection}
                  onChange={(e) => setShowGstinSection(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
              </div>
              {showGstinSection && (
                <div className="pt-2 space-y-2">
                  <input
                    type="text"
                    value={gstinNumber}
                    onChange={(e) => setGstinNumber(e.target.value)}
                    placeholder="Customer GSTIN (e.g. 24AAACG1234F1Z5)"
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      State of Supply:
                    </span>
                    <select
                      value={stateOfSupply}
                      onChange={(e) => setStateOfSupply(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white"
                    >
                      <option value="Gujarat (24)">Gujarat (24)</option>
                      <option value="Maharashtra (27)">Maharashtra (27)</option>
                      <option value="Rajasthan (08)">Rajasthan (08)</option>
                      <option value="Delhi (07)">Delhi (07)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. Public Note & Private Memo */}
          {cartItems.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Receipt Notes & Private Memo
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showNotesSection}
                  onChange={(e) => setShowNotesSection(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
              </div>
              {showNotesSection && (
                <div className="pt-2 space-y-2">
                  <input
                    type="text"
                    value={optionalNotes}
                    onChange={(e) => setOptionalNotes(e.target.value)}
                    placeholder="Notes printed on bill (e.g. Exchange within 7 days with bill)"
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    value={privateNote}
                    onChange={(e) => setPrivateNote(e.target.value)}
                    placeholder="Private memo (Only visible to store owner)"
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Bottom Fixed Checkout Bar (Part 1 fix: strictly bounded within 100% width) */}
          {cartItems.length > 0 && (
            <div className="fixed bottom-[60px] md:bottom-[64px] left-0 right-0 z-30 p-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl max-w-4xl mx-auto rounded-t-3xl border-x space-y-2.5 w-full box-border">
              {/* Photo & Date Row */}
              <div className="flex items-center justify-between gap-3 text-xs">
                {/* Photo Attachment */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={billFileRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setBillPhotoUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  {billPhotoUrl ? (
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200">
                      <span className="text-[10px] font-bold">📷 Photo Attached</span>
                      <button
                        type="button"
                        onClick={() => setBillPhotoUrl(null)}
                        className="text-red-600 hover:text-red-800 font-bold ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => billFileRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>📷 Attach Slip Photo</span>
                    </button>
                  )}
                </div>

                {/* Custom Bill Date Picker */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600">📅 Bill Date:</span>
                  <input
                    type="date"
                    value={billDateStr}
                    onChange={(e) => setBillDateStr(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Payment Method Options & Total Row */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400">Total Payable: </span>
                  <span className="text-base font-black text-indigo-700">
                    ₹ {netTotal.toFixed(2)}
                  </span>
                </div>

                {/* Payment Mode Options */}
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'CASH', label: 'Cash' },
                    { id: 'UPI', label: 'UPI' },
                    { id: 'CREDIT', label: 'Khata' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMode(m.id)}
                      className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border transition cursor-pointer ${
                        paymentMode === m.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateBill}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Save & Generate Invoice Receipt</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: DESIGNS THEME SELECTOR */}
      {activeSubTab === 'THEMES' && (
        <InvoiceThemeSelector
          storeSettings={storeSettings}
          onApplyTheme={onApplyTheme}
        />
      )}

      {/* SUB-TAB 3: PAST INVOICES */}
      {activeSubTab === 'HISTORY' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-900">
              Past Sales & Receipts ({invoices.length})
            </h4>
          </div>

          {invoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h5 className="font-bold text-slate-700 text-sm">No bills generated yet</h5>
              <p className="text-xs text-slate-400 mt-0.5">
                Create a new bill from the "New Bill" tab or ask the AI Voice assistant!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {invoices.map((inv) => {
                const dateStr = new Date(inv.timestamp).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });
                return (
                  <div
                    key={inv.invoiceId}
                    onClick={() => onViewInvoice(inv)}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-indigo-700">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.2 rounded ${
                            inv.paymentMode === 'CREDIT'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {inv.paymentMode}
                        </span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600">
                          {inv.designTheme}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-slate-900 mt-1">
                        {inv.customerName}
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        {dateStr} • {inv.items.length} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900">
                        ₹ {inv.netTotal.toFixed(2)}
                      </p>
                      <span className="text-xs font-bold text-indigo-600 hover:underline">
                        View Receipt →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
