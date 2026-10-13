import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Users,
  MessageSquare,
  QrCode,
  DollarSign,
  PackagePlus,
  Check,
  Building,
  Languages,
  Store,
  Phone,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  AppLanguage,
  CustomerType,
  KidsWearCategory,
  PaymentMode,
  CashFlowType,
  StoreSettings,
  CATEGORIES,
} from '../types';
import { languageList } from '../utils/language';

// 1. ADD CUSTOMER DIALOG
interface AddCustomerDialogProps {
  onDismiss: () => void;
  onPickContact: () => void;
  onPickWhatsApp: () => void;
  onConfirm: (
    name: string,
    phone: string,
    address: string,
    type: CustomerType,
    openingBalance: number
  ) => void;
}

export const AddCustomerDialog: React.FC<AddCustomerDialogProps> = ({
  onDismiss,
  onPickContact,
  onPickWhatsApp,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<CustomerType>('RETAIL_PARENT');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('');
  const [isUdhaar, setIsUdhaar] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const rawAmt = parseFloat(openingBalanceStr) || 0;
    const finalBalance = isUdhaar ? rawAmt : -rawAmt;
    onConfirm(name, phone, address, type, finalBalance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              Add New Khata Customer
            </h3>
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Pick Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={onPickContact}
            className="flex items-center justify-center gap-1.5 py-2 px-3 border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>From Contacts</span>
          </button>
          <button
            type="button"
            onClick={onPickWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2 px-3 border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>From WhatsApp</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Customer Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Bhai or Pooja Mehta"
              className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Address / Area</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Main Market, Near Clock Tower"
              className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Customer Category:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'RETAIL_PARENT' as CustomerType, label: 'Retail' },
                { id: 'WHOLESALE_BUYER' as CustomerType, label: 'Wholesale' },
                { id: 'SUPPLIER' as CustomerType, label: 'Supplier' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setType(c.id)}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    type === c.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">
              Opening Balance (Optional)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3.5 top-2 text-sm text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                value={openingBalanceStr}
                onChange={(e) => setOpeningBalanceStr(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
              />
            </div>
          </div>

          {parseFloat(openingBalanceStr) > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsUdhaar(true)}
                className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  isUdhaar
                    ? 'bg-red-50 text-red-600 border-red-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                Customer Owes (Udhaar)
              </button>
              <button
                type="button"
                onClick={() => setIsUdhaar(false)}
                className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  !isUdhaar
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                Advance Paid (Jama)
              </button>
            </div>
          )}

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. ADD TRANSACTION DIALOG (YOU GAVE / YOU GOT)
interface AddTransactionDialogProps {
  customerName: string;
  isCredit: boolean;
  onDismiss: () => void;
  onConfirm: (
    amount: number,
    paymentMode: PaymentMode,
    description: string,
    photoUrl?: string,
    customDate?: number,
    notifyChannel?: 'WHATSAPP' | 'SMS' | null
  ) => void;
}

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  customerName,
  isCredit,
  onDismiss,
  onConfirm,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [customDateStr, setCustomDateStr] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    isCredit ? 'CREDIT' : 'CASH'
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [notifyChannel, setNotifyChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountStr);
    if (amt > 0) {
      const chosenTimestamp = customDateStr
        ? new Date(customDateStr).getTime()
        : Date.now();
      onConfirm(
        amt,
        paymentMode,
        description,
        photoUrl || undefined,
        chosenTimestamp,
        notifyCustomer ? notifyChannel : null
      );
    }
  };

  const headerColor = isCredit ? 'text-red-600' : 'text-emerald-600';
  const buttonBg = isCredit ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 my-auto max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className={`font-black text-base ${headerColor}`}>
              {isCredit ? 'You Gave (Udhaar / Debit)' : 'You Got (Payment / Jama)'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">Customer: {customerName}</p>
          </div>
          <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount Input */}
          <div>
            <label className="text-xs font-bold text-slate-700">Enter Amount *</label>
            <div className="relative mt-1">
              <span className={`absolute left-3.5 top-2.5 text-base font-black ${headerColor}`}>
                ₹
              </span>
              <input
                type="number"
                required
                autoFocus
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 border border-slate-200 rounded-xl px-3.5 py-2 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700">Description / Note</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isCredit
                  ? 'e.g. 2x Party Baba Suit 4Y'
                  : 'e.g. Partial cash payment / GPay'
              }
              className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
            />
          </div>

          {/* BILL PHOTO ATTACHMENT */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Bill / Slip Photo Attachment (Optional)
            </label>
            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={photoUrl}
                    alt="Receipt Attachment"
                    className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Photo Attached</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Ready to save with bill</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-xs font-bold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 border border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📷 Capture / Upload Bill Photo</span>
                </button>
              </div>
            )}
          </div>

          {/* CUSTOM BILL DATE PICKER */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>📅 Bill / Transaction Date</span>
              </label>
              <span className="text-[10px] font-semibold text-slate-400">
                Backdating allowed
              </span>
            </div>
            <input
              type="date"
              value={customDateStr}
              onChange={(e) => setCustomDateStr(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 cursor-pointer"
            />
          </div>

          {/* PAYMENT METHOD OPTIONS */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Payment / Entry Mode:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH' as PaymentMode, label: 'Cash' },
                { id: 'UPI' as PaymentMode, label: 'UPI / QR' },
                { id: 'CREDIT' as PaymentMode, label: 'Khata' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMode(m.id)}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    paymentMode === m.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* AUTOMATED SHARING & NOTIFICATIONS */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
                <span>Notify Customer Immediately</span>
              </label>
            </div>
            {notifyCustomer && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setNotifyChannel('WHATSAPP')}
                  className={`py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    notifyChannel === 'WHATSAPP'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyChannel('SMS')}
                  className={`py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    notifyChannel === 'SMS'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Via SMS
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!(parseFloat(amountStr) > 0)}
              className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 ${buttonBg}`}
            >
              Confirm ₹{amountStr || '0'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. ADD INVENTORY DIALOG
interface AddInventoryDialogProps {
  onDismiss: () => void;
  onConfirm: (
    name: string,
    category: KidsWearCategory,
    sizes: string[],
    retailPrice: number,
    wholesalePrice: number,
    stockQuantity: number,
    color: string,
    itemCode: string
  ) => void;
}

export const AddInventoryDialog: React.FC<AddInventoryDialogProps> = ({
  onDismiss,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<KidsWearCategory>('BOYS_CASUAL');
  const [retailPriceStr, setRetailPriceStr] = useState('');
  const [wholesalePriceStr, setWholesalePriceStr] = useState('');
  const [stockStr, setStockStr] = useState('20');
  const [color, setColor] = useState('Multi');
  const [itemCode, setItemCode] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['1-2Y', '2-4Y']);

  const availableSizes = [
    '0-6M',
    '6-12M',
    '1-2Y',
    '2-4Y',
    '4-6Y',
    '6-8Y',
    '8-10Y',
    '10-14Y',
  ];

  const toggleSize = (s: string) => {
    if (selectedSizes.includes(s)) {
      setSelectedSizes(selectedSizes.filter((x) => x !== s));
    } else {
      setSelectedSizes([...selectedSizes, s]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ret = parseFloat(retailPriceStr) || 0;
    const ws = parseFloat(wholesalePriceStr) || ret * 0.7;
    const stock = parseInt(stockStr, 10) || 10;
    if (name.trim() && ret > 0) {
      onConfirm(
        name,
        category,
        selectedSizes.length > 0 ? selectedSizes : ['Standard'],
        ret,
        ws,
        stock,
        color,
        itemCode || `GK-${Math.floor(100 + Math.random() * 900)}`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              Add Kids Wear Garment
            </h3>
          </div>
          <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Garment Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Floral Princess Frock or Silk Baba Kurta"
              className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Garment Category:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as KidsWearCategory)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
            >
              {CATEGORIES.filter((c) => c.id !== 'ALL').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Select Sizes:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    type="button"
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Retail Price (₹) *</label>
              <input
                type="number"
                required
                value={retailPriceStr}
                onChange={(e) => setRetailPriceStr(e.target.value)}
                placeholder="650"
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Wholesale (₹)</label>
              <input
                type="number"
                value={wholesalePriceStr}
                onChange={(e) => setWholesalePriceStr(e.target.value)}
                placeholder="450"
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Stock Qty *</label>
              <input
                type="number"
                required
                value={stockStr}
                onChange={(e) => setStockStr(e.target.value)}
                placeholder="20"
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Color / Pattern</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Baby Pink"
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !(parseFloat(retailPriceStr) > 0)}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Save Garment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. ADD CASHBOOK DIALOG
interface AddCashDialogProps {
  onDismiss: () => void;
  onConfirm: (
    amount: number,
    type: CashFlowType,
    category: string,
    note: string
  ) => void;
}

export const AddCashDialog: React.FC<AddCashDialogProps> = ({
  onDismiss,
  onConfirm,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<CashFlowType>('CASH_OUT');
  const [category, setCategory] = useState('Supplier Payment');
  const [note, setNote] = useState('');

  const isIn = type === 'CASH_IN';

  const cashOutCategories = [
    { label: 'Supplier Payment', icon: '🚚' },
    { label: 'Utility Bill', icon: '⚡' },
    { label: 'Shop Expense', icon: '🛍️' },
    { label: 'Chai & Snacks', icon: '☕' },
    { label: 'Shop Rent', icon: '🏢' },
    { label: 'Staff Advance', icon: '👤' },
    { label: 'Transport / Bhada', icon: '📦' },
    { label: 'Other Expense', icon: '📝' },
  ];

  const cashInCategories = [
    { label: 'Counter Sales', icon: '💵' },
    { label: 'Udhaar Recovery', icon: '📥' },
    { label: 'Bank Withdrawal', icon: '🏦' },
    { label: 'Owner Capital', icon: '💼' },
    { label: 'Other Inflow', icon: '➕' },
  ];

  const handleSelectType = (selectedType: CashFlowType) => {
    setType(selectedType);
    if (selectedType === 'CASH_OUT') {
      setCategory('Supplier Payment');
    } else {
      setCategory('Counter Sales');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountStr);
    if (amt > 0) {
      onConfirm(amt, type, category.trim() || (isIn ? 'Counter Sales' : 'Shop Expense'), note.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className={`font-black text-base ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
              {isIn ? 'Record Cash In (Income / Recovery)' : 'Record Cash Out (Expense / Payout)'}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {isIn ? 'Cash received into drawer / galla' : 'Log shop expenses, supplier payouts, or bills'}
            </p>
          </div>
          <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prominent Dual Toggle Option */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Select Cash Flow Type *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => handleSelectType('CASH_IN')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-black rounded-xl transition cursor-pointer ${
                  isIn
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                <span>📥</span>
                <span>Cash In (Income)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectType('CASH_OUT')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-black rounded-xl transition cursor-pointer ${
                  !isIn
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-500'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                <span>💸</span>
                <span>Cash Out (Expense)</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block">
              Amount (₹) *
            </label>
            <div className="relative mt-1">
              <span
                className={`absolute left-3.5 top-2.5 text-base font-black ${
                  isIn ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {isIn ? '+ ₹' : '- ₹'}
              </span>
              <input
                type="number"
                step="any"
                required
                autoFocus
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-10 border rounded-2xl px-3.5 py-2.5 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 ${
                  isIn
                    ? 'border-emerald-200 focus:ring-emerald-500/30'
                    : 'border-red-200 focus:ring-red-500/30'
                }`}
              />
            </div>
          </div>

          {/* Quick Expense / Income Categories Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {isIn ? 'Income Category' : 'Expense Category *'}
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">Tap to select</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(isIn ? cashInCategories : cashOutCategories).map((cat) => {
                const isSelected = category.toLowerCase() === cat.label.toLowerCase();
                return (
                  <button
                    type="button"
                    key={cat.label}
                    onClick={() => setCategory(cat.label)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? isIn
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-400 font-black'
                          : 'bg-red-50 text-red-800 border-red-400 ring-1 ring-red-400 font-black'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={isIn ? 'e.g. Counter Sales' : 'e.g. Supplier Payment, Utility Bill'}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
            />
          </div>

          {/* Remarks / Note Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Quick Note / Remarks (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isIn
                  ? 'e.g. Received from counter customer'
                  : 'e.g. 500 ka bijali bill bhara / Raju supplier advance / Chai nashta'
              }
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!(parseFloat(amountStr) > 0)}
              className={`flex-1 py-3 text-white rounded-xl text-xs font-black transition disabled:opacity-40 cursor-pointer shadow-md ${
                isIn
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/25'
              }`}
            >
              {isIn ? 'Record Cash In (+)' : 'Record Cash Out (-)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 5. UPI QR CODE MODAL
interface UpiQrDialogProps {
  storeSettings: StoreSettings;
  amount: number;
  onDismiss: () => void;
}

export const UpiQrDialog: React.FC<UpiQrDialogProps> = ({
  storeSettings,
  amount,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-200 text-center">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5 text-indigo-600">
            <QrCode className="w-5 h-5" />
            <span className="font-extrabold text-sm uppercase">Store UPI QR</span>
          </div>
          <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="font-black text-lg text-slate-900 uppercase">
          {storeSettings.storeName}
        </h3>
        <p className="font-mono text-xs text-indigo-700 font-semibold mb-3">
          {storeSettings.upiId}
        </p>

        {amount > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl py-2 px-4 inline-block mb-4">
            <span className="text-xs text-indigo-600 font-bold">Pay Amount: </span>
            <span className="text-base font-black text-indigo-950">₹{amount.toFixed(2)}</span>
          </div>
        )}

        {/* QR Code Graphics */}
        <div className="bg-slate-50 border-2 border-indigo-600 rounded-2xl p-6 flex flex-col items-center justify-center shadow-inner mx-auto my-2">
          <QrCode className="w-40 h-40 text-slate-900" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
            Accepted: GPay • PhonePe • Paytm
          </p>
        </div>

        <p className="text-xs text-slate-500 font-medium my-3">
          Customer scans and pays directly. Balance automatically syncs with ledger.
        </p>

        <button
          onClick={onDismiss}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};

// 6. LANGUAGE SELECTOR DIALOG
interface LanguageDialogProps {
  currentLanguage: AppLanguage;
  onDismiss: () => void;
  onSelect: (lang: AppLanguage) => void;
}

export const LanguageDialog: React.FC<LanguageDialogProps> = ({
  currentLanguage,
  onDismiss,
  onSelect,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-base text-slate-900">
              Select Language / भाषा
            </h3>
          </div>
          <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {languageList.map((l) => (
            <div
              key={l.code}
              onClick={() => onSelect(l.code)}
              className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                currentLanguage === l.code
                  ? 'border-indigo-600 bg-indigo-50/70'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div>
                <p className={`text-sm font-black ${currentLanguage === l.code ? 'text-indigo-950' : 'text-slate-900'}`}>
                  {l.displayName}
                </p>
                <p className="text-xs text-slate-500 font-medium">{l.nativeName}</p>
              </div>
              {currentLanguage === l.code && (
                <Check className="w-4 h-4 text-indigo-600" />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onDismiss}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};

// 7. EDIT STORE DIALOG
interface EditStoreDialogProps {
  storeSettings: StoreSettings;
  onDismiss: () => void;
  onConfirm: (name: string, phone: string, address: string, upiId: string) => void;
}

export const EditStoreDialog: React.FC<EditStoreDialogProps> = ({
  storeSettings,
  onDismiss,
  onConfirm,
}) => {
  const [name, setName] = useState(storeSettings.storeName);
  const [phone, setPhone] = useState(storeSettings.phone);
  const [address, setAddress] = useState(storeSettings.address);
  const [upiId, setUpiId] = useState(storeSettings.upiId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name, phone, address, upiId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-base text-slate-900">
              Edit Store & UPI Details
            </h3>
          </div>
          <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Store Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Store Phone Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Store Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">
              UPI ID for Payments (GPay/PhonePe/Paytm) *
            </label>
            <input
              type="text"
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Save Store Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 8. CONTACT & WHATSAPP PICKER MODAL
interface ContactPickerModalProps {
  isWhatsApp: boolean;
  onDismiss: () => void;
  onSelect: (name: string, phone: string) => void;
}

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  isWhatsApp,
  onDismiss,
  onSelect,
}) => {
  const contacts = isWhatsApp
    ? [
        { name: 'Kavita Patel (WA)', phone: '+91 98982 34567' },
        { name: 'Suresh Cloth Center', phone: '+91 98221 44556' },
        { name: 'Manish Bhai (Kids Wear)', phone: '+91 97234 11223' },
        { name: 'Deepa Shah', phone: '+91 99090 88776' },
        { name: 'Girish Garments WA', phone: '+91 94280 55667' },
      ]
    : [
        { name: 'Aakash Sharma', phone: '+91 98123 45678' },
        { name: 'Bhavin Modi', phone: '+91 98765 12340' },
        { name: 'Chetan Textile', phone: '+91 94250 67890' },
        { name: 'Dinesh Bhai', phone: '+91 99770 11223' },
        { name: 'Hitesh Garments', phone: '+91 98980 99887' },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {isWhatsApp ? (
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            ) : (
              <Users className="w-5 h-5 text-indigo-600" />
            )}
            <h3 className="font-extrabold text-base text-slate-900">
              {isWhatsApp ? 'Import from WhatsApp' : 'Import from Contacts'}
            </h3>
          </div>
          <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4 font-medium">
          Tap any customer contact to auto-fill into Ghanshyam kids wear
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto mb-4 no-scrollbar">
          {contacts.map((c, i) => (
            <div
              key={i}
              onClick={() => onSelect(c.name, c.phone)}
              className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl flex items-center justify-between cursor-pointer transition"
            >
              <div>
                <p className="font-bold text-xs text-slate-900">{c.name}</p>
                <p className="text-[11px] text-slate-500">{c.phone}</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Select
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
