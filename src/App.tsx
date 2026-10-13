import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Package,
  Receipt,
  Wallet,
  Store,
  Sparkles,
  Languages,
  ShoppingBag,
  Cloud,
} from 'lucide-react';
import {
  AiAction,
  AppLanguage,
  AppTab,
  BillInvoice,
  CashEntry,
  Customer,
  CustomerType,
  InventoryItem,
  InvoiceDesignThemeId,
  KhataTransaction,
  OrderItem,
  PaymentMode,
  StoreBackupPayload,
  StoreSettings,
} from './types';
import { DEFAULT_STORE_SETTINGS, getSampleDemoData } from './data/sampleData';
import { languageList } from './utils/language';
import { OnboardingModal } from './components/OnboardingModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { InvoiceReceiptModal } from './components/InvoiceReceiptModal';
import { PaymentReminderModal } from './components/PaymentReminderModal';
import { PdfReportModal } from './components/PdfReportModal';
import { GoogleBackupModal } from './components/GoogleBackupModal';
import {
  AddCustomerDialog,
  AddTransactionDialog,
  AddInventoryDialog,
  AddCashDialog,
  UpiQrDialog,
  LanguageDialog,
  EditStoreDialog,
  ContactPickerModal,
} from './components/Dialogs';
import { KhataView } from './views/KhataView';
import { CustomerDetailView } from './views/CustomerDetailView';
import { InventoryView } from './views/InventoryView';
import { BillingView } from './views/BillingView';
import { CashbookView } from './views/CashbookView';
import { ProfileView } from './views/ProfileView';

export default function App() {
  // 1. Core State Persistence
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('gkw_has_completed_onboarding_v2') === 'true';
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('gkw_store_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return DEFAULT_STORE_SETTINGS;
  });

  // START 100% EMPTY ON FIRST CLEAN INSTALL AS REQUESTED
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('gkw_customers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });

  const [transactions, setTransactions] = useState<KhataTransaction[]>(() => {
    const saved = localStorage.getItem('gkw_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('gkw_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });

  const [invoices, setInvoices] = useState<BillInvoice[]>(() => {
    const saved = localStorage.getItem('gkw_invoices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });

  const [cashbook, setCashbook] = useState<CashEntry[]>(() => {
    const saved = localStorage.getItem('gkw_cashbook');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });

  // Cart for POS Billing
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<AppTab>('KHATA');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modals Visibility
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [showEditStoreModal, setShowEditStoreModal] = useState<boolean>(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [showAddTxModal, setShowAddTxModal] = useState<boolean>(false);
  const [addTxIsCredit, setAddTxIsCredit] = useState<boolean>(true);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState<boolean>(false);
  const [showAddCashModal, setShowAddCashModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrAmount, setQrAmount] = useState<number>(0);
  const [showContactPicker, setShowContactPicker] = useState<boolean>(false);
  const [contactPickerIsWa, setContactPickerIsWa] = useState<boolean>(false);
  const [previewInvoice, setPreviewInvoice] = useState<BillInvoice | null>(null);
  const [reminderCustomer, setReminderCustomer] = useState<Customer | null>(null);
  const [pdfReportAction, setPdfReportAction] = useState<AiAction | null>(null);
  const [showGoogleBackupModal, setShowGoogleBackupModal] = useState<boolean>(false);

  const handleRestoreBackup = (backup: StoreBackupPayload) => {
    if (backup.storeSettings) setStoreSettings(backup.storeSettings);
    if (Array.isArray(backup.customers)) setCustomers(backup.customers);
    if (Array.isArray(backup.transactions)) setTransactions(backup.transactions);
    if (Array.isArray(backup.inventory)) setInventory(backup.inventory);
    if (Array.isArray(backup.invoices)) setInvoices(backup.invoices);
    if (Array.isArray(backup.cashbook)) setCashbook(backup.cashbook);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('gkw_store_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('gkw_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('gkw_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('gkw_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('gkw_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('gkw_cashbook', JSON.stringify(cashbook));
  }, [cashbook]);

  const handleCompleteOnboarding = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem('gkw_has_completed_onboarding_v2', 'true');
  };

  const handleReopenGuide = () => {
    setHasCompletedOnboarding(false);
  };

  // Recalculate customer's balance based on uncleared transactions
  const recalculateCustomerBalance = (
    customerId: string,
    currentTxList: KhataTransaction[]
  ) => {
    const active = currentTxList.filter((t) => t.customerId === customerId && !t.isCleared);
    const newBal = active.reduce((sum, t) => {
      return t.type === 'GAVE_CREDIT' ? sum + t.amount : sum - t.amount;
    }, 0);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, netBalance: newBal, lastTransactionDate: Date.now() }
          : c
      )
    );
  };

  // Add Customer
  const handleAddCustomer = (
    name: string,
    phone: string,
    address: string,
    type: CustomerType,
    openingBalance: number
  ) => {
    const newCust: Customer = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      type,
      netBalance: openingBalance,
      lastTransactionDate: Date.now(),
      createdAt: Date.now(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    setShowAddCustomerModal(false);

    if (openingBalance !== 0) {
      const isCredit = openingBalance > 0;
      const tx: KhataTransaction = {
        id: `t_${Date.now()}`,
        customerId: newCust.id,
        customerName: newCust.name,
        amount: Math.abs(openingBalance),
        type: isCredit ? 'GAVE_CREDIT' : 'GOT_PAYMENT',
        paymentMode: 'CREDIT',
        description: 'Opening balance',
        isCleared: false,
        timestamp: Date.now(),
      };
      setTransactions((prev) => [tx, ...prev]);
    }
  };

  // Add Transaction
  const handleAddTransaction = (
    customerId: string,
    customerName: string,
    amount: number,
    isCredit: boolean,
    paymentMode: PaymentMode,
    description: string,
    photoUrl?: string,
    customDate?: number,
    notifyChannel?: 'WHATSAPP' | 'SMS' | null
  ) => {
    const txTimestamp = customDate || Date.now();
    const tx: KhataTransaction = {
      id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerId,
      customerName,
      amount,
      type: isCredit ? 'GAVE_CREDIT' : 'GOT_PAYMENT',
      paymentMode,
      description,
      isCleared: false,
      photoUrl,
      date: customDate,
      timestamp: txTimestamp,
    };
    const nextTxList = [tx, ...transactions];
    setTransactions(nextTxList);
    recalculateCustomerBalance(customerId, nextTxList);

    // If payment received, record to cashbook
    if (!isCredit) {
      const cashEntry: CashEntry = {
        id: `cash_${Date.now()}`,
        amount,
        type: 'CASH_IN',
        category: 'Udhaar Recovery',
        note: `Payment from ${customerName} (${description || paymentMode})`,
        timestamp: txTimestamp,
      };
      setCashbook((prev) => [cashEntry, ...prev]);
    }

    // Automated sharing & notifications via WhatsApp / SMS
    if (notifyChannel) {
      const cust = customers.find((c) => c.id === customerId);
      const cleanPhone = cust ? cust.phone.replace(/[^0-9+]/g, '') : '';
      const typeLabel = isCredit ? 'Udhaar (Gave)' : 'Jama (Payment Received)';
      const msg = `Namaste ${customerName},\nTransaction recorded at *${storeSettings.storeName}*:\nAmount: *₹ ${amount.toFixed(2)}* (${typeLabel})\nNote: ${description || 'Counter entry'}\nDate: ${new Date(txTimestamp).toLocaleDateString('en-IN')}\n\nThank you!\nUPI: ${storeSettings.upiId}`;

      if (notifyChannel === 'WHATSAPP') {
        const url = cleanPhone.length >= 10
          ? `https://api.whatsapp.com/send?phone=${cleanPhone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(msg)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      } else if (notifyChannel === 'SMS') {
        window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
      }
    }

    setShowAddTxModal(false);
  };

  // Toggle transaction tick box (cancel out)
  const handleToggleCleared = (transactionId: string) => {
    let affectedCustomerId: string | null = null;
    const nextTxList = transactions.map((t) => {
      if (t.id === transactionId) {
        affectedCustomerId = t.customerId;
        return { ...t, isCleared: !t.isCleared };
      }
      return t;
    });
    setTransactions(nextTxList);
    if (affectedCustomerId) {
      recalculateCustomerBalance(affectedCustomerId, nextTxList);
    }
  };

  // Settle all balance for customer
  const handleSettleAll = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust || cust.netBalance === 0) return;

    if (cust.netBalance > 0) {
      handleAddTransaction(
        cust.id,
        cust.name,
        cust.netBalance,
        false,
        'CASH',
        'Full Account Settlement'
      );
    } else {
      handleAddTransaction(
        cust.id,
        cust.name,
        Math.abs(cust.netBalance),
        true,
        'CASH',
        'Advance Settlement / Refund'
      );
    }
  };

  // Update Inventory Stock Stepper
  const handleUpdateStock = (itemId: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, stockQuantity: Math.max(0, item.stockQuantity + delta) }
          : item
      )
    );
  };

  // Add Item to Bill Cart
  const handleAddToCart = (item: InventoryItem, size: string) => {
    const chosenSize = size || item.sizes[0] || 'Standard';
    const existingIndex = cartItems.findIndex(
      (c) => c.itemId === item.id && c.size === chosenSize
    );

    if (existingIndex >= 0) {
      const next = [...cartItems];
      next[existingIndex].quantity += 1;
      setCartItems(next);
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          itemId: item.id,
          itemName: item.name,
          size: chosenSize,
          quantity: 1,
          unitPrice: item.retailPrice,
        },
      ]);
    }
  };

  const handleUpdateCartQty = (index: number, delta: number) => {
    const next = [...cartItems];
    if (index >= 0 && index < next.length) {
      const updatedQty = next[index].quantity + delta;
      if (updatedQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index].quantity = updatedQty;
      }
      setCartItems(next);
    }
  };

  // Create Bill & Save
  const handleSaveBill = (invoiceData: {
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
  }) => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discounted = Math.max(0, subtotal - invoiceData.discountAmount);
    const taxable = discounted + invoiceData.additionalCharges;
    const gstAmt = taxable * (invoiceData.gstPercent / 100);
    const netTotal = taxable + gstAmt;
    const billTimestamp = invoiceData.customDate || Date.now();

    const newInvoice: BillInvoice = {
      invoiceId: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: `GKW-${1051 + invoices.length}`,
      customerId: invoiceData.customerId,
      customerName: invoiceData.customerName,
      customerPhone: invoiceData.customerPhone,
      items: cartItems,
      subtotal,
      discountAmount: invoiceData.discountAmount,
      additionalCharges: invoiceData.additionalCharges,
      gstPercent: invoiceData.gstPercent,
      gstAmount: gstAmt,
      netTotal,
      paymentMode: invoiceData.paymentMode,
      gstinNumber: invoiceData.gstinNumber,
      stateOfSupply: invoiceData.stateOfSupply,
      optionalNotes: invoiceData.optionalNotes,
      privateNote: invoiceData.privateNote,
      designTheme: invoiceData.designTheme,
      photoUrl: invoiceData.photoUrl,
      date: invoiceData.customDate,
      timestamp: billTimestamp,
      engineerName: 'Kirio Ken',
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Deduct stock for items
    cartItems.forEach((ordered) => {
      if (ordered.itemId) {
        handleUpdateStock(ordered.itemId, -ordered.quantity);
      }
    });

    // If Khata credit, record transaction
    if (invoiceData.paymentMode === 'CREDIT' && invoiceData.customerId) {
      handleAddTransaction(
        invoiceData.customerId,
        invoiceData.customerName,
        netTotal,
        true,
        'CREDIT',
        `Bill ${newInvoice.invoiceNumber}: ${cartItems.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}`
      );
    } else {
      // Cash/UPI paid sale
      const cashEntry: CashEntry = {
        id: `cash_${Date.now()}`,
        amount: netTotal,
        type: 'CASH_IN',
        category: 'Counter Sales',
        note: `Bill ${newInvoice.invoiceNumber} (${invoiceData.paymentMode})`,
        timestamp: Date.now(),
      };
      setCashbook((prev) => [cashEntry, ...prev]);
    }

    setCartItems([]);
    setPreviewInvoice(newInvoice);
  };

  // AI Action Execution
  const handleExecuteAiAction = (action: AiAction) => {
    switch (action.actionType) {
      case 'ADD_CUSTOMER': {
        const name = action.customerName || 'New Customer';
        const phone = action.customerPhone || '+91 98000 00000';
        handleAddCustomer(name, phone, 'Main Town', 'RETAIL_PARENT', 0);
        break;
      }
      case 'RECORD_TRANSACTION': {
        const targetName = action.customerName || '';
        let targetCust = customers.find((c) =>
          c.name.toLowerCase().includes(targetName.toLowerCase().split(' ')[0])
        );
        if (!targetCust && targetName) {
          targetCust = {
            id: `c_${Date.now()}`,
            name: targetName,
            phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
            address: 'Main Town',
            type: 'RETAIL_PARENT',
            netBalance: 0,
            lastTransactionDate: Date.now(),
            createdAt: Date.now(),
          };
          setCustomers((prev) => [targetCust!, ...prev]);
        }
        if (targetCust && action.amount) {
          const isCredit = action.transactionType === 'GAVE_CREDIT';
          handleAddTransaction(
            targetCust.id,
            targetCust.name,
            action.amount,
            isCredit,
            'CASH',
            action.note || 'AI Voice Assistant Entry'
          );
        }
        break;
      }
      case 'CANCEL_TRANSACTION': {
        if (action.transactionIdToCancel) {
          handleToggleCleared(action.transactionIdToCancel);
        }
        break;
      }
      case 'CREATE_BILL': {
        if (action.invoice) {
          setInvoices((prev) => [action.invoice!, ...prev]);
          setPreviewInvoice(action.invoice);
        }
        break;
      }
      case 'ADD_INVENTORY': {
        if (action.inventoryItemName && action.inventoryPrice && action.inventoryStock) {
          const newItem: InventoryItem = {
            id: `i_${Date.now()}`,
            name: action.inventoryItemName,
            category: action.inventoryCategory || 'BOYS_CASUAL',
            sizes: ['1-2Y', '2-4Y', '4-6Y'],
            retailPrice: action.inventoryPrice,
            wholesalePrice: action.inventoryPrice * 0.7,
            stockQuantity: action.inventoryStock,
            color: 'Multi',
            itemCode: `GK-${Math.floor(100 + Math.random() * 900)}`,
          };
          setInventory((prev) => [newItem, ...prev]);
        }
        break;
      }
      case 'ADD_CASH': {
        if (action.amount) {
          const entry: CashEntry = {
            id: `cash_${Date.now()}`,
            amount: action.amount,
            type: action.cashType || 'CASH_OUT',
            category:
              action.cashCategory ||
              (action.cashType === 'CASH_IN' ? 'Counter Sales' : 'Shop Expense'),
            note: action.note || 'Cash Entry via AI Store Manager',
            timestamp: Date.now(),
          };
          setCashbook((prev) => [entry, ...prev]);
        }
        break;
      }
      case 'OPEN_PDF_STATEMENT': {
        setPdfReportAction(action);
        break;
      }
      default:
        break;
    }
  };

  const handleLoadDemoData = () => {
    const demo = getSampleDemoData();
    setCustomers(demo.customers);
    setTransactions(demo.transactions);
    setInventory(demo.inventory);
    setInvoices(demo.invoices);
    setCashbook(demo.cashbook);
  };

  const handleClearAllData = () => {
    setCustomers([]);
    setTransactions([]);
    setInventory([]);
    setInvoices([]);
    setCashbook([]);
    setCartItems([]);
    setSelectedCustomerId(null);
  };

  const handleImportKhatabook = (phone: string) => {
    const now = Date.now();
    const cleanPhone = phone.replace(/[^0-9+]/g, '') || '+91 98111 22334';
    const importedCustomers: Customer[] = [
      {
        id: `kb_${Date.now()}_1`,
        name: 'Anil Tailors & Fabrics',
        phone: cleanPhone,
        address: 'Cloth Market Line 2',
        type: 'WHOLESALE_BUYER',
        netBalance: 3200.0,
        lastTransactionDate: now - 86400000,
        createdAt: now - 86400000,
      },
      {
        id: `kb_${Date.now()}_2`,
        name: 'Meena Ben (Kids Uniform)',
        phone: '+91 98222 33445',
        address: 'Near Central School',
        type: 'RETAIL_PARENT',
        netBalance: 1250.0,
        lastTransactionDate: now - 172800000,
        createdAt: now - 172800000,
      },
    ];
    const importedTx: KhataTransaction[] = [
      {
        id: `kb_tx_${Date.now()}_1`,
        customerId: importedCustomers[0].id,
        customerName: importedCustomers[0].name,
        amount: 3200.0,
        type: 'GAVE_CREDIT',
        paymentMode: 'CREDIT',
        description: `Restored Khatabook cloud ledger (Linked: ${phone})`,
        billNumber: 'KB-IMP-401',
        isCleared: false,
        timestamp: now - 86400000,
      },
      {
        id: `kb_tx_${Date.now()}_2`,
        customerId: importedCustomers[1].id,
        customerName: importedCustomers[1].name,
        amount: 1250.0,
        type: 'GAVE_CREDIT',
        paymentMode: 'CREDIT',
        description: `Restored Khatabook cloud ledger (Linked: ${phone})`,
        billNumber: 'KB-IMP-402',
        isCleared: false,
        timestamp: now - 172800000,
      },
    ];
    setCustomers((prev) => [...importedCustomers, ...prev]);
    setTransactions((prev) => [...importedTx, ...prev]);
  };

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentLangObj =
    languageList.find((l) => l.code === storeSettings.language) || languageList[0];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans w-full max-w-full overflow-x-hidden relative">
      {/* 1. ONBOARDING GUIDE ON FIRST START */}
      {!hasCompletedOnboarding && (
        <OnboardingModal onComplete={handleCompleteOnboarding} />
      )}

      {/* 2. TOP APP BAR */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs w-full max-w-full overflow-x-hidden safe-top">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <div
            onClick={() => {
              setSelectedCustomerId(null);
              setCurrentTab('KHATA');
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/25">
              <span className="text-base">👗</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-sm md:text-base text-slate-950 uppercase tracking-tight">
                  {storeSettings.storeName}
                </h1>
              </div>
              <p className="text-[10px] text-indigo-600 font-bold tracking-wide">
                Kirio Ken Edition • Khata & POS
              </p>
            </div>
          </div>

          {/* Action Buttons: GOOGLE BACKUP & CSV, AI VOICE, & LANGUAGE */}
          <div className="flex items-center gap-2">
            {/* GOOGLE DRIVE & CSV BACKUP BUTTON */}
            <button
              onClick={() => setShowGoogleBackupModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs shadow-xs transition transform active:scale-95 cursor-pointer"
              title="Google Drive Backup, Sheets & Finalized CSV"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Backup & CSV</span>
              <span className="sm:hidden">Backup</span>
            </button>

            {/* AI VOICE ASSISTANT BUTTON */}
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-xs shadow-xs transition transform active:scale-95 cursor-pointer"
              title="Open Ghanshyam AI Voice Store Manager"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="hidden xs:inline">AI Voice</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </button>

            {/* UNIVERSAL LANGUAGE BUTTON */}
            <button
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition cursor-pointer"
              title="Change Language"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-600" />
              <span>{currentLangObj.displayName}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN BODY VIEW */}
      <main className="flex-1 p-3 md:p-6 overflow-x-hidden w-full max-w-full pb-28">
        {selectedCustomerId && activeCustomer ? (
          <CustomerDetailView
            customer={activeCustomer}
            transactions={transactions}
            storeSettings={storeSettings}
            onBack={() => setSelectedCustomerId(null)}
            onOpenAddTransaction={(isCredit) => {
              setAddTxIsCredit(isCredit);
              setShowAddTxModal(true);
            }}
            onToggleCleared={handleToggleCleared}
            onSettleAll={() => handleSettleAll(activeCustomer.id)}
            onOpenQr={(amt) => {
              setQrAmount(amt);
              setShowQrModal(true);
            }}
            onOpenReminder={() => setReminderCustomer(activeCustomer)}
          />
        ) : (
          <>
            {currentTab === 'KHATA' && (
              <KhataView
                customers={customers}
                storeSettings={storeSettings}
                onSelectCustomer={(cust) => setSelectedCustomerId(cust.id)}
                onOpenAddCustomer={() => setShowAddCustomerModal(true)}
                onOpenContacts={() => {
                  setContactPickerIsWa(false);
                  setShowContactPicker(true);
                }}
                onOpenWhatsAppContacts={() => {
                  setContactPickerIsWa(true);
                  setShowContactPicker(true);
                }}
                onOpenQr={() => {
                  setQrAmount(0);
                  setShowQrModal(true);
                }}
              />
            )}

            {currentTab === 'INVENTORY' && (
              <InventoryView
                inventory={inventory}
                storeSettings={storeSettings}
                onOpenAddInventory={() => setShowAddInventoryModal(true)}
                onUpdateStock={handleUpdateStock}
                onAddToCart={(item, size) => handleAddToCart(item, size)}
              />
            )}

            {currentTab === 'BILLING' && (
              <BillingView
                storeSettings={storeSettings}
                customers={customers}
                invoices={invoices}
                cartItems={cartItems}
                onUpdateCartQty={handleUpdateCartQty}
                onClearCart={() => setCartItems([])}
                onSaveBill={handleSaveBill}
                onViewInvoice={(inv) => setPreviewInvoice(inv)}
                onApplyTheme={(themeId) =>
                  setStoreSettings((s) => ({ ...s, activeInvoiceTheme: themeId }))
                }
                onBrowseStock={() => setCurrentTab('INVENTORY')}
                onAddCustomItem={(item) => setCartItems((prev) => [...prev, item])}
              />
            )}

            {currentTab === 'CASHBOOK' && (
              <CashbookView
                cashbook={cashbook}
                storeSettings={storeSettings}
                onOpenAddCash={() => setShowAddCashModal(true)}
              />
            )}

            {currentTab === 'PROFILE' && (
              <ProfileView
                storeSettings={storeSettings}
                totalCustomers={customers.length}
                totalTransactions={transactions.length}
                totalInventory={inventory.length}
                totalInvoices={invoices.length}
                onOpenEditStore={() => setShowEditStoreModal(true)}
                onOpenLanguage={() => setShowLanguageModal(true)}
                onOpenQr={() => {
                  setQrAmount(0);
                  setShowQrModal(true);
                }}
                onOpenGoogleBackup={() => setShowGoogleBackupModal(true)}
                onReopenGuide={handleReopenGuide}
                onLoadDemoData={handleLoadDemoData}
                onClearAllData={handleClearAllData}
                onImportKhatabook={handleImportKhatabook}
              />
            )}
          </>
        )}
      </main>

      {/* 
        4. BOTTOM NAVIGATION BAR - Part 1 requirement:
        Strictly fixed to bottom, 100% width, no horizontal pushing
      */}
      {!selectedCustomerId && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-md w-full max-w-full box-border safe-bottom"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div className="max-w-4xl mx-auto grid grid-cols-5 py-1">
            {[
              { id: 'KHATA' as AppTab, label: 'Khata', icon: BookOpen },
              { id: 'INVENTORY' as AppTab, label: 'Stock', icon: Package },
              { id: 'BILLING' as AppTab, label: `Bill (${cartItems.length})`, icon: Receipt },
              { id: 'CASHBOOK' as AppTab, label: 'Cashbook', icon: Wallet },
              { id: 'PROFILE' as AppTab, label: 'Shop', icon: Store },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedCustomerId(null);
                    setCurrentTab(tab.id);
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 transition cursor-pointer select-none active:scale-90 ${
                    isSelected
                      ? 'text-indigo-600 font-extrabold'
                      : 'text-slate-500 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <div
                    className={`p-1 rounded-xl transition ${
                      isSelected ? 'bg-indigo-50 text-indigo-600' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* 5. MODAL DIALOGS */}
      {showAiModal && (
        <AiAssistantModal
          storeSettings={storeSettings}
          customers={customers}
          transactions={transactions}
          inventory={inventory}
          invoices={invoices}
          cashbook={cashbook}
          onDismiss={() => setShowAiModal(false)}
          onExecuteAction={handleExecuteAiAction}
          onViewInvoice={(inv) => setPreviewInvoice(inv)}
          onNavigateTab={(tab) => {
            setSelectedCustomerId(null);
            setCurrentTab(tab);
            setShowAiModal(false);
          }}
          onTriggerReminder={(customerId) => {
            const c = customers.find((x) => x.id === customerId);
            if (c) {
              setShowAiModal(false);
              setReminderCustomer(c);
            }
          }}
          onOpenPdfStatement={(action) => {
            setPdfReportAction(action);
          }}
        />
      )}

      {pdfReportAction && (
        <PdfReportModal
          reportType={pdfReportAction.pdfTargetType || 'STORE_SUMMARY'}
          customer={pdfReportAction.pdfTargetCustomer || null}
          customers={customers}
          transactions={transactions}
          invoices={invoices}
          cashbook={cashbook}
          storeSettings={storeSettings}
          onDismiss={() => setPdfReportAction(null)}
        />
      )}

      {reminderCustomer && (
        <PaymentReminderModal
          customer={reminderCustomer}
          transactions={transactions}
          storeSettings={storeSettings}
          onDismiss={() => setReminderCustomer(null)}
        />
      )}

      {previewInvoice && (
        <InvoiceReceiptModal
          invoice={previewInvoice}
          storeSettings={storeSettings}
          onDismiss={() => setPreviewInvoice(null)}
        />
      )}

      {showLanguageModal && (
        <LanguageDialog
          currentLanguage={storeSettings.language}
          onDismiss={() => setShowLanguageModal(false)}
          onSelect={(lang) => {
            setStoreSettings((s) => ({ ...s, language: lang }));
            setShowLanguageModal(false);
          }}
        />
      )}

      {showEditStoreModal && (
        <EditStoreDialog
          storeSettings={storeSettings}
          onDismiss={() => setShowEditStoreModal(false)}
          onConfirm={(name, phone, address, upiId) => {
            setStoreSettings((s) => ({
              ...s,
              storeName: name,
              phone,
              address,
              upiId,
            }));
            setShowEditStoreModal(false);
          }}
        />
      )}

      {showAddCustomerModal && (
        <AddCustomerDialog
          onDismiss={() => setShowAddCustomerModal(false)}
          onPickContact={() => {
            setShowAddCustomerModal(false);
            setContactPickerIsWa(false);
            setShowContactPicker(true);
          }}
          onPickWhatsApp={() => {
            setShowAddCustomerModal(false);
            setContactPickerIsWa(true);
            setShowContactPicker(true);
          }}
          onConfirm={handleAddCustomer}
        />
      )}

      {showAddTxModal && activeCustomer && (
        <AddTransactionDialog
          customerName={activeCustomer.name}
          isCredit={addTxIsCredit}
          onDismiss={() => setShowAddTxModal(false)}
          onConfirm={(amount, paymentMode, description, photoUrl, customDate, notifyChannel) => {
            handleAddTransaction(
              activeCustomer.id,
              activeCustomer.name,
              amount,
              addTxIsCredit,
              paymentMode,
              description,
              photoUrl,
              customDate,
              notifyChannel
            );
          }}
        />
      )}

      {showAddInventoryModal && (
        <AddInventoryDialog
          onDismiss={() => setShowAddInventoryModal(false)}
          onConfirm={(
            name,
            category,
            sizes,
            retailPrice,
            wholesalePrice,
            stockQuantity,
            color,
            itemCode
          ) => {
            const newItem: InventoryItem = {
              id: `i_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name,
              category,
              sizes,
              retailPrice,
              wholesalePrice,
              stockQuantity,
              color,
              itemCode,
            };
            setInventory((prev) => [newItem, ...prev]);
            setShowAddInventoryModal(false);
          }}
        />
      )}

      {showAddCashModal && (
        <AddCashDialog
          onDismiss={() => setShowAddCashModal(false)}
          onConfirm={(amount, type, category, note) => {
            const entry: CashEntry = {
              id: `cash_${Date.now()}`,
              amount,
              type,
              category,
              note,
              timestamp: Date.now(),
            };
            setCashbook((prev) => [entry, ...prev]);
            setShowAddCashModal(false);
          }}
        />
      )}

      {showQrModal && (
        <UpiQrDialog
          storeSettings={storeSettings}
          amount={qrAmount}
          onDismiss={() => setShowQrModal(false)}
        />
      )}

      {showContactPicker && (
        <ContactPickerModal
          isWhatsApp={contactPickerIsWa}
          onDismiss={() => setShowContactPicker(false)}
          onSelect={(name, phone) => {
            setShowContactPicker(false);
            handleAddCustomer(
              name,
              phone,
              'Direct Contact',
              'RETAIL_PARENT',
              0
            );
          }}
        />
      )}

      {showGoogleBackupModal && (
        <GoogleBackupModal
          isOpen={showGoogleBackupModal}
          onClose={() => setShowGoogleBackupModal(false)}
          storeSettings={storeSettings}
          customers={customers}
          transactions={transactions}
          inventory={inventory}
          invoices={invoices}
          cashbook={cashbook}
          onRestoreData={handleRestoreBackup}
        />
      )}
    </div>
  );
}
