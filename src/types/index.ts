export type AppLanguage = 'hinglish' | 'en' | 'hi' | 'gu';

export type InvoiceDesignThemeId =
  | 'modern_kids'
  | 'classic_gst'
  | 'royal_blue'
  | 'thermal_slip';

export interface InvoiceDesignTheme {
  id: InvoiceDesignThemeId;
  title: string;
  subtitle: string;
  primaryColor: string;
  accentColor: string;
  badgeText: string;
}

export const INVOICE_THEMES: Record<InvoiceDesignThemeId, InvoiceDesignTheme> = {
  modern_kids: {
    id: 'modern_kids',
    title: 'Modern Kids Boutique',
    subtitle: 'Vibrant, Playful & Color Accent',
    primaryColor: '#4338CA',
    accentColor: '#F59E0B',
    badgeText: 'POPULAR',
  },
  classic_gst: {
    id: 'classic_gst',
    title: 'Classic Retail GST',
    subtitle: 'Formal Business & Tax Compliant',
    primaryColor: '#1E293B',
    accentColor: '#059669',
    badgeText: 'STANDARD',
  },
  royal_blue: {
    id: 'royal_blue',
    title: 'Royal Garments Letterhead',
    subtitle: 'Premium Blue & Gold Crest',
    primaryColor: '#1D4ED8',
    accentColor: '#D97706',
    badgeText: 'PREMIUM',
  },
  thermal_slip: {
    id: 'thermal_slip',
    title: 'Compact Thermal Slip',
    subtitle: 'Fast Thermal POS (58/80mm)',
    primaryColor: '#334155',
    accentColor: '#475569',
    badgeText: 'FAST PRINT',
  },
};

export interface StoreSettings {
  storeName: string;
  phone: string;
  address: string;
  upiId: string;
  language: AppLanguage;
  activeInvoiceTheme: InvoiceDesignThemeId;
}

export type CustomerType = 'RETAIL_PARENT' | 'WHOLESALE_BUYER' | 'SUPPLIER';
export type TransactionType = 'GAVE_CREDIT' | 'GOT_PAYMENT';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CREDIT';

export interface OrderItem {
  itemId: string;
  itemName: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  type: CustomerType;
  netBalance: number; // > 0: Store will receive (Customer owes); < 0: Store will pay/advance
  lastTransactionDate: number;
  createdAt: number;
}

export interface KhataTransaction {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  type: TransactionType;
  paymentMode: PaymentMode;
  description: string;
  itemDetails?: OrderItem[];
  billNumber?: string;
  isCleared: boolean; // When ticked by user, entry is canceled out / settled and balance adjusts instantly
  photoUrl?: string; // Bill or receipt photo attachment
  date?: number; // Custom backdated timestamp
  timestamp: number;
}

export type KidsWearCategory =
  | 'ALL'
  | 'BABY_INFANT'
  | 'BOYS_CASUAL'
  | 'BOYS_ETHNIC'
  | 'GIRLS_FROCKS'
  | 'GIRLS_PARTY'
  | 'NIGHTWEAR'
  | 'FOOTWEAR';

export interface CategoryInfo {
  id: KidsWearCategory;
  displayName: string;
  emoji: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'ALL', displayName: 'All Items', emoji: '✨' },
  { id: 'BABY_INFANT', displayName: 'Baby & Infant (0-1Y)', emoji: '🍼' },
  { id: 'BOYS_CASUAL', displayName: 'Boys Casual (2-14Y)', emoji: '👕' },
  { id: 'BOYS_ETHNIC', displayName: 'Boys Ethnic & Kurtas', emoji: '👑' },
  { id: 'GIRLS_FROCKS', displayName: 'Girls Frocks & Dresses', emoji: '👗' },
  { id: 'GIRLS_PARTY', displayName: 'Girls Partywear', emoji: '🎀' },
  { id: 'NIGHTWEAR', displayName: 'Night Suits & Pajamas', emoji: '🌙' },
  { id: 'FOOTWEAR', displayName: 'Shoes & Accessories', emoji: '👟' },
];

export interface InventoryItem {
  id: string;
  name: string;
  category: KidsWearCategory;
  sizes: string[];
  retailPrice: number;
  wholesalePrice: number;
  stockQuantity: number;
  color: string;
  itemCode: string;
}

export interface BillInvoice {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  additionalCharges: number;
  gstPercent: number;
  gstAmount: number;
  netTotal: number;
  paymentMode: string;
  gstinNumber: string;
  stateOfSupply: string;
  optionalNotes: string;
  privateNote: string;
  designTheme: InvoiceDesignThemeId;
  photoUrl?: string; // Bill or receipt photo attachment
  date?: number; // Custom backdated timestamp
  timestamp: number;
  engineerName: string;
}

export type CashFlowType = 'CASH_IN' | 'CASH_OUT';

export interface CashEntry {
  id: string;
  amount: number;
  type: CashFlowType;
  category: string;
  note: string;
  timestamp: number;
}

export type AppTab = 'KHATA' | 'INVENTORY' | 'BILLING' | 'CASHBOOK' | 'PROFILE';

export interface AiAction {
  actionType:
    | 'ADD_CUSTOMER'
    | 'RECORD_TRANSACTION'
    | 'CANCEL_TRANSACTION'
    | 'ADD_INVENTORY'
    | 'ADD_CASH'
    | 'CREATE_BILL'
    | 'VERIFY_BILL'
    | 'REPORT'
    | 'NAVIGATE'
    | 'TRIGGER_REMINDER'
    | 'OPEN_PDF_STATEMENT'
    | 'NONE';
  customerName?: string;
  customerPhone?: string;
  amount?: number;
  transactionType?: TransactionType;
  note?: string;
  targetTab?: AppTab;
  invoice?: BillInvoice;
  reportText?: string;
  inventoryItemName?: string;
  inventoryCategory?: KidsWearCategory;
  inventoryPrice?: number;
  inventoryStock?: number;
  transactionIdToCancel?: string;
  reminderCustomerId?: string;
  reminderCustomerName?: string;
  pdfTargetType?: 'CUSTOMER' | 'STORE_OWNER' | 'STORE_SUMMARY';
  pdfTargetCustomer?: Customer;
  pdfReportTitle?: string;
  cashType?: CashFlowType;
  cashCategory?: string;
  needsDescription?: boolean;
  needsVerification?: boolean;
  extractedDescription?: string;
}

export interface AiMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  action?: AiAction | null;
  timestamp: number;
}

export interface StoreBackupPayload {
  version: string;
  exportedAt: string;
  appName: string;
  storeSettings: StoreSettings;
  customers: Customer[];
  transactions: KhataTransaction[];
  inventory: InventoryItem[];
  invoices: BillInvoice[];
  cashbook: CashEntry[];
}

export interface DriveBackupItem {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}
