import {
  AiAction,
  BillInvoice,
  CashEntry,
  Customer,
  InventoryItem,
  KhataTransaction,
  OrderItem,
  StoreSettings,
} from '../types';
import {
  isClothingOrKidsItem,
  extractYearsOrSize,
} from '../utils/clothingUtils';

export function buildStoreSummaryContext(
  storeSettings: StoreSettings,
  customers: Customer[],
  transactions: KhataTransaction[],
  inventory: InventoryItem[],
  invoices: BillInvoice[],
  cashbook: CashEntry[]
): string {
  const totalReceivable = customers
    .filter((c) => c.netBalance > 0)
    .reduce((sum, c) => sum + c.netBalance, 0);
  const totalPayable = customers
    .filter((c) => c.netBalance < 0)
    .reduce((sum, c) => sum + Math.abs(c.netBalance), 0);
  const totalCashIn = cashbook
    .filter((c) => c.type === 'CASH_IN')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalCashOut = cashbook
    .filter((c) => c.type === 'CASH_OUT')
    .reduce((sum, c) => sum + c.amount, 0);
  const netCash = totalCashIn - totalCashOut;
  const totalSales = invoices.reduce((sum, inv) => sum + inv.netTotal, 0);
  const totalStock = inventory.reduce((sum, i) => sum + i.stockQuantity, 0);
  const debtorSummary = customers
    .filter((c) => c.netBalance > 0)
    .map((c) => `${c.name}: ₹${c.netBalance.toFixed(0)} (${c.phone})`)
    .slice(0, 5)
    .join('; ');

  return `
[STORE METRICS - GHANSHYAM KIDS WEAR]
Store: ${storeSettings.storeName} | City: Jetpur / Gujarat | UPI: ${storeSettings.upiId}
Total Customers: ${customers.length}
Total Market Udhaar (Receivable): ₹${totalReceivable.toFixed(2)}
Total Supplier / Advance (Payable): ₹${totalPayable.toFixed(2)}
Net Cash In Hand / Drawer: ₹${netCash.toFixed(2)} (Cash In: ₹${totalCashIn}, Cash Out: ₹${totalCashOut})
Total POS Bills Generated: ${invoices.length} | Gross Sales: ₹${totalSales.toFixed(2)}
Inventory Stock: ${totalStock} garments across ${inventory.length} designs
Top Debtors: ${debtorSummary || 'No pending debtors'}
`.trim();
}

/**
 * Normalizes utility and common non-apparel billing requests
 */
function matchKnownUtilityItem(input: string): string | null {
  const lower = input.toLowerCase();
  if (
    lower.includes('water') ||
    lower.includes('pani') ||
    lower.includes('drinking water')
  ) {
    return 'Water Bill';
  }
  if (
    lower.includes('bijali') ||
    lower.includes('bijli') ||
    lower.includes('light') ||
    lower.includes('electricity') ||
    lower.includes('power')
  ) {
    return 'Electricity Bill';
  }
  if (
    lower.includes('repair') ||
    lower.includes('maintenance') ||
    lower.includes('silai') ||
    lower.includes('tailoring')
  ) {
    return 'Tailoring & Alteration Service';
  }
  if (
    lower.includes('packaging') ||
    lower.includes('box') ||
    lower.includes('packing')
  ) {
    return 'Garment Packaging Box';
  }
  if (
    lower.includes('uniform') ||
    lower.includes('school')
  ) {
    return 'School Uniform Set';
  }
  return null;
}

export interface ExtractedLineItemResult {
  itemName: string;
  size: string;
  quantity: number;
  hasExplicitDescription: boolean;
}

/**
 * Intelligently extracts the line-item description from a bill command.
 * CRITICAL RULE: If the user did NOT write an explicit description,
 * hasExplicitDescription is FALSE and itemName is EMPTY.
 * If the item is for anything OTHER than clothes/kapda/kids, size is '' (empty).
 * If the item IS clothes/kapda/kids, size allows specifying/typing the age/years!
 */
export function extractLineItemDescription(
  prompt: string,
  inventory: InventoryItem[],
  extractedCustomerName?: string
): ExtractedLineItemResult {
  const lower = prompt.toLowerCase();

  // 1. Look for explicit item directives e.g. "and likho water ka bill", "likho party frock", "item: baba suit"
  const directiveRegex =
    /(?:and\s+|aur\s+)?(?:likho|likh\s*do|likh\s*dena|likh|likhna|write|note|item|description|desc)\s+([a-zA-Z0-9\s\u0900-\u097F]{2,})/i;
  const match = prompt.match(directiveRegex);
  if (match && match[1]) {
    const rawCandidate = match[1].trim();
    const qtyMatch = prompt.match(/(\d+)\s*(?:piece|pcs|x|piece\s*of)\b/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    // Check utility dictionary
    const utilityName = matchKnownUtilityItem(rawCandidate);
    if (utilityName) {
      const isCloth = isClothingOrKidsItem(utilityName);
      const sizeVal = isCloth ? (extractYearsOrSize(prompt) || '2-4 Yrs') : '';
      return { itemName: utilityName, size: sizeVal, quantity, hasExplicitDescription: true };
    }

    // Check if directive matches existing inventory
    const matchedInv = inventory.find((i) =>
      rawCandidate.toLowerCase().includes(i.name.toLowerCase())
    );
    if (matchedInv) {
      return {
        itemName: matchedInv.name,
        size: matchedInv.sizes[0] || '2-4 Yrs',
        quantity,
        hasExplicitDescription: true,
      };
    }

    // Clean conversational noise and filler words from rawCandidate
    let cleanedCandidate = rawCandidate
      .replace(
        /(?:bill\s*banawo|bill\s*banao|banawo\s*bill|banao\s*bill|banado|banayein|banawo|banao|generate\s*karo|make\s*bill|parchi\s*banao|invoice)/gi,
        ''
      )
      .replace(/(?:₹|rs\.?|amount|total)?\s*\d+(?:\.\d+)?\s*(?:rupaye|rs|₹|ka)?/gi, '')
      .replace(/(?:ke\s*naam\s*(?:par|se|pe)|ke\s*liye|ko\s*de)/gi, '')
      .replace(/\b(?:ka\s*bill|ki\s*parchi|ka|ki|ke|hai|karo|bana|dena|de|do|please|and|aur|tatha|bhi)\b/gi, '')
      .replace(/[^a-zA-Z0-9\s\u0900-\u097F]/g, ' ')
      .trim();

    cleanedCandidate = cleanedCandidate.replace(/\s+/g, ' ').trim();

    if (cleanedCandidate.length >= 2 && !KHATA_NOISE_WORDS.has(cleanedCandidate.toLowerCase())) {
      const formatted = cleanedCandidate
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      const isCloth = isClothingOrKidsItem(formatted);
      const sizeVal = isCloth ? (extractYearsOrSize(prompt) || '2-4 Yrs') : '';
      return { itemName: formatted, size: sizeVal, quantity, hasExplicitDescription: true };
    }
  }

  // 2. Check if entire prompt mentions a known utility explicitly
  const utilityFromPrompt = matchKnownUtilityItem(prompt);
  if (utilityFromPrompt) {
    const isCloth = isClothingOrKidsItem(utilityFromPrompt);
    const sizeVal = isCloth ? (extractYearsOrSize(prompt) || '2-4 Yrs') : '';
    return { itemName: utilityFromPrompt, size: sizeVal, quantity: 1, hasExplicitDescription: true };
  }

  // 3. Check if prompt explicitly mentions an existing inventory item name
  const matchedInv = inventory.find((i) => lower.includes(i.name.toLowerCase()));
  if (matchedInv) {
    const qtyMatch = prompt.match(/(\d+)\s*(?:piece|pcs|x|piece\s*of)\b/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
    return {
      itemName: matchedInv.name,
      size: matchedInv.sizes[0] || '2-4 Yrs',
      quantity,
      hasExplicitDescription: true,
    };
  }

  // 4. Extract quantity if mentioned
  const qtyMatch = prompt.match(/(\d+)\s*(?:piece|pcs|x|piece\s*of)\b/i);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

  // 5. Clean out known action/filler keywords and customer names
  let cleaned = prompt;
  if (extractedCustomerName && extractedCustomerName.length >= 3) {
    const custRegex = new RegExp(`\\b${extractedCustomerName}\\b`, 'gi');
    cleaned = cleaned.replace(custRegex, '');
  }

  cleaned = cleaned
    .replace(
      /(?:bill\s*banawo|bill\s*banao|banawo\s*bill|banao\s*bill|banado|banayein|banawo|banao|generate\s*bill|invoice\s*banao|naya\s*bill|make\s*bill|create\s*bill|bill\s*generate\s*karo|parchi\s*banao|parchi\s*banawo|parchi|invoice)/gi,
      ''
    )
    .replace(/(?:₹|rs\.?|amount|total)?\s*\d+(?:\.\d+)?\s*(?:rupaye|rs|₹|ka)?/gi, '')
    .replace(/(?:mere\s*naam\s*(?:par|se|pe)|apne\s*naam\s*(?:par|se|pe))/gi, '')
    .replace(/(?:ke\s*naam\s*(?:par|se|pe)|ke\s*naam|ke\s*liye|ko\s*de|for\s+[a-zA-Z]+)/gi, '')
    .replace(/(?:and\s+|aur\s+)?(?:likho|likh\s*do|likh\s*dena|likh|likhna|write|note|item|description|desc)/gi, '')
    .replace(
      /\b(?:ka\s*bill|ki\s*parchi|ka|ki|ke|hai|karo|bana|dena|de|do|please|and|aur|tatha|bhi|ek|do|teen|par|pe|se|ko|mein|me)\b/gi,
      ''
    )
    .replace(/[^a-zA-Z0-9\s\u0900-\u097F]/g, ' ')
    .trim();

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (cleaned.length >= 2 && !KHATA_NOISE_WORDS.has(cleaned.toLowerCase())) {
    const formattedItem = cleaned
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    const isCloth = isClothingOrKidsItem(formattedItem);
    const sizeVal = isCloth ? (extractYearsOrSize(prompt) || '2-4 Yrs') : '';
    return { itemName: formattedItem, size: sizeVal, quantity, hasExplicitDescription: true };
  }

  // No description was provided in prompt
  return { itemName: '', size: '', quantity: 1, hasExplicitDescription: false };
}

const KHATA_NOISE_WORDS = new Set([
  'udhar',
  'udhaar',
  'jama',
  'diye',
  'mile',
  'baki',
  'baaki',
  'likho',
  'likh',
  'lagawo',
  'lagao',
  'dal',
  'do',
  'de',
  'dena',
  'diya',
  'rupaye',
  'rupayee',
  'rupees',
  'rs',
  'inr',
  'paisa',
  'paise',
  'total',
  'market',
  'khata',
  'ledger',
  'bill',
  'parchi',
  'report',
  'pdf',
  'dukan',
  'shop',
  'store',
  'item',
  'saman',
  'mere',
  'mera',
  'apne',
  'apna',
  'naya',
  'new',
  'customer',
  'naam',
  'account',
  'mein',
  'me',
  'par',
  'pe',
  'se',
  'ko',
  'ka',
  'ke',
  'ki',
  'ne',
  'hai',
  'hain',
  'karo',
  'kar',
  'liye',
  'for',
  'and',
  'aur',
  'banao',
  'banawo',
  'banado',
  'banayein',
  'cash',
  'rokad',
  'khatabook',
]);

/**
 * Extracts customer name from natural language prompt for billing
 */
export function extractCustomerName(
  prompt: string,
  customers: Customer[],
  storeSettings: StoreSettings
): { customerName: string; matchedCust: Customer | null } {
  const lower = prompt.toLowerCase();

  // 1. "Mere naam par", "apne naam par", etc. -> Store Owner's Name
  if (
    lower.includes('mere naam') ||
    lower.includes('apne naam') ||
    lower.includes('mera bill') ||
    lower.includes('for myself') ||
    lower.includes('apna bill')
  ) {
    const ownerName = storeSettings.storeName.split(' ')[0] || 'Ghanshyam';
    const foundCust = customers.find(
      (c) => c.name.toLowerCase() === ownerName.toLowerCase()
    );
    return {
      customerName: foundCust ? foundCust.name : ownerName,
      matchedCust: foundCust || null,
    };
  }

  // 2. Check if an existing customer name is mentioned
  const sortedCustomers = [...customers].sort(
    (a, b) => b.name.length - a.name.length
  );
  for (const c of sortedCustomers) {
    const firstName = c.name.split(' ')[0].toLowerCase();
    if (firstName.length >= 3 && lower.includes(firstName)) {
      return { customerName: c.name, matchedCust: c };
    }
  }

  // 3. Regex for pattern: "[Name] ke naam se / par / pe"
  const keNaamMatch = prompt.match(
    /([a-zA-Z\u0900-\u097F]{3,}(?:\s+[a-zA-Z\u0900-\u097F]{3,})?)\s*(?:ke\s*naam\s*(?:se|par|pe)|ke\s*naam)\b/i
  );
  if (keNaamMatch && keNaamMatch[1]) {
    const rawName = keNaamMatch[1].trim();
    if (!KHATA_NOISE_WORDS.has(rawName.toLowerCase())) {
      const formatted = rawName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      return { customerName: formatted, matchedCust: null };
    }
  }

  // 4. Regex for pattern: "[Name] ka bill" or "[Name] ko bill"
  const kaBillMatch = prompt.match(
    /([a-zA-Z\u0900-\u097F]{3,}(?:\s+[a-zA-Z\u0900-\u097F]{3,})?)\s+(?:ka|ko|se)\s+(?:bill|parchi|invoice)\b/i
  );
  if (kaBillMatch && kaBillMatch[1]) {
    const rawName = kaBillMatch[1].trim();
    if (!KHATA_NOISE_WORDS.has(rawName.toLowerCase())) {
      const formatted = rawName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      return { customerName: formatted, matchedCust: null };
    }
  }

  // 5. Regex for pattern: "bill banawo [Name] ke liye / [Name] ka"
  const billForMatch = prompt.match(
    /(?:bill|parchi|invoice)\s+(?:banawo|banao|generate\s*karo|banado)?\s*(?:for\s+|ke\s*liye\s+|ka\s+)?([a-zA-Z\u0900-\u097F]{3,})\b/i
  );
  if (billForMatch && billForMatch[1]) {
    const rawName = billForMatch[1].trim();
    if (!KHATA_NOISE_WORDS.has(rawName.toLowerCase())) {
      const formatted = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
      return { customerName: formatted, matchedCust: null };
    }
  }

  // Default fallback
  return { customerName: 'Counter Retail Customer', matchedCust: null };
}

/**
 * Extracts target customer entity specifically for Khata operations
 */
export function extractKhataTargetCustomer(
  prompt: string,
  customers: Customer[]
): { name: string; matchedCust: Customer | null } | null {
  const lower = prompt.toLowerCase();

  // 1. Check existing customer exact / first-name matches first
  const sorted = [...customers].sort((a, b) => b.name.length - a.name.length);
  for (const c of sorted) {
    const fullName = c.name.toLowerCase();
    const firstName = c.name.split(' ')[0].toLowerCase();
    if (firstName.length >= 3 && (lower.includes(fullName) || lower.includes(firstName))) {
      return { name: c.name, matchedCust: c };
    }
  }

  // 2. Pattern: "[Name] ne [amount] ..."
  const m1 = prompt.match(
    /([a-zA-Z\u0900-\u097F]{3,}(?:\s+[a-zA-Z\u0900-\u097F]{3,})?)\s+ne\b/i
  );
  if (m1 && m1[1] && !KHATA_NOISE_WORDS.has(m1[1].toLowerCase().trim())) {
    const raw = m1[1].trim();
    const formatted = raw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    const found = customers.find((c) => c.name.toLowerCase() === formatted.toLowerCase());
    return { name: formatted, matchedCust: found || null };
  }

  // 3. Pattern: "[Name] se [amount] ..."
  const m2 = prompt.match(
    /([a-zA-Z\u0900-\u097F]{3,}(?:\s+[a-zA-Z\u0900-\u097F]{3,})?)\s+se\b/i
  );
  if (m2 && m2[1] && !KHATA_NOISE_WORDS.has(m2[1].toLowerCase().trim())) {
    const raw = m2[1].trim();
    const formatted = raw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    const found = customers.find((c) => c.name.toLowerCase() === formatted.toLowerCase());
    return { name: formatted, matchedCust: found || null };
  }

  // 4. Pattern: "[Name] ke naam par / se / pe" or "[Name] ke khate me"
  const m3 = prompt.match(
    /([a-zA-Z\u0900-\u097F]{3,}(?:\s+[a-zA-Z\u0900-\u097F]{3,})?)\s*(?:ke\s*naam\s*(?:par|pe|se)|ke\s*khate\s*(?:me|mein))/i
  );
  if (m3 && m3[1] && !KHATA_NOISE_WORDS.has(m3[1].toLowerCase().trim())) {
    const raw = m3[1].trim();
    const formatted = raw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    const found = customers.find((c) => c.name.toLowerCase() === formatted.toLowerCase());
    return { name: formatted, matchedCust: found || null };
  }

  // 5. Pattern: "[Name] ko [amount] udhar diya"
  const m4 = prompt.match(
    /([a-zA-Z\u0900-\u097F]{3,}(?:\s+[a-zA-Z\u0900-\u097F]{3,})?)\s+ko\b/i
  );
  if (m4 && m4[1] && !KHATA_NOISE_WORDS.has(m4[1].toLowerCase().trim())) {
    const raw = m4[1].trim();
    const formatted = raw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    const found = customers.find((c) => c.name.toLowerCase() === formatted.toLowerCase());
    return { name: formatted, matchedCust: found || null };
  }

  // 6. Pattern: "[Name] ka / ke kitna baki hai / hisab / balance"
  const m5 = prompt.match(
    /([a-zA-Z\u0900-\u097F]{3,}(?:\s+[a-zA-Z\u0900-\u097F]{3,})?)\s+(?:ka|ke|ki)\b/i
  );
  if (m5 && m5[1] && !KHATA_NOISE_WORDS.has(m5[1].toLowerCase().trim())) {
    const raw = m5[1].trim();
    const formatted = raw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    const found = customers.find((c) => c.name.toLowerCase() === formatted.toLowerCase());
    return { name: formatted, matchedCust: found || null };
  }

  // 7. Pattern: "... baki mein dal do [Name] ke" or "... likho [Name] ke naam"
  const m6 = prompt.match(
    /(?:dal\s*do|likh\s*lo|likho|lagawo|lagao|ke\s*naam)\s+([a-zA-Z\u0900-\u097F]{3,})\s*(?:ke|ko)?/i
  );
  if (m6 && m6[1] && !KHATA_NOISE_WORDS.has(m6[1].toLowerCase().trim())) {
    const raw = m6[1].trim();
    const formatted = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    const found = customers.find((c) => c.name.toLowerCase() === formatted.toLowerCase());
    return { name: formatted, matchedCust: found || null };
  }

  // 8. Pattern: trailing name
  const m7 = prompt.match(/\b([a-zA-Z\u0900-\u097F]{3,})\s*(?:ke|ko|se)$/i);
  if (m7 && m7[1] && !KHATA_NOISE_WORDS.has(m7[1].toLowerCase().trim())) {
    const raw = m7[1].trim();
    const formatted = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    const found = customers.find((c) => c.name.toLowerCase() === formatted.toLowerCase());
    return { name: formatted, matchedCust: found || null };
  }

  return null;
}

export interface ExtractedCashOutResult {
  isCashOut: boolean;
  amount: number | null;
  category: string;
  note: string;
}

/**
 * Recognizes Hinglish commands related to shop expenses / cash payouts and maps
 * them directly to the Cashbook's "Cash Out" function, rather than confusing them
 * with customer Udhaar or bill creation.
 * e.g. "500 ka bijali bill bhara", "Raju supplier ko 2000 cash diya", "chay nashte ka 50 nikala"
 */
export function extractCashOutIntent(prompt: string): ExtractedCashOutResult | null {
  const lower = prompt.toLowerCase();

  // Guard against questions / inquiries e.g. "kitna kharcha hua?", "total cash out kitna hai?"
  const isInquiry =
    (lower.includes('kitna') ||
      lower.includes('kitne') ||
      lower.includes('kya') ||
      lower.includes('status') ||
      lower.includes('batao') ||
      lower.includes('batawo') ||
      prompt.endsWith('?')) &&
    !lower.includes('bhara') &&
    !lower.includes('diya') &&
    !lower.includes('nikala');

  if (isInquiry) return null;

  // Extract amount
  const amtMatch = prompt.match(
    /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:rupaye|rupayee|rupees|rs|₹|ka)?/i
  );
  const amount = amtMatch ? parseFloat(amtMatch[1]) : null;

  // 1. Utility Bills / Payouts (Electricity, Water, Phone, Rent, Wifi)
  const isUtility =
    lower.includes('bijali') ||
    lower.includes('bijli') ||
    lower.includes('light bill') ||
    lower.includes('electricity') ||
    lower.includes('water bill') ||
    lower.includes('pani ka bill') ||
    lower.includes('pani bill') ||
    lower.includes('telephone') ||
    lower.includes('phone bill') ||
    lower.includes('recharge') ||
    lower.includes('wifi') ||
    lower.includes('internet') ||
    (lower.includes('bill') &&
      (lower.includes('bhara') ||
        lower.includes('bhar diya') ||
        lower.includes('bhari') ||
        lower.includes('bharo') ||
        lower.includes('pay kiya') ||
        lower.includes('chukaya')));

  if (isUtility) {
    let cat = 'Utility Bill';
    let note = 'Bijali Bill Bhara';
    if (lower.includes('bijali') || lower.includes('bijli') || lower.includes('light')) {
      note = 'Bijali Bill (Electricity)';
    } else if (lower.includes('water') || lower.includes('pani')) {
      note = 'Water / Pani Bill Paid';
    } else if (lower.includes('phone') || lower.includes('recharge') || lower.includes('wifi')) {
      note = 'Phone / Internet Bill Paid';
    } else if (lower.includes('rent') || lower.includes('kiraya')) {
      cat = 'Shop Rent';
      note = 'Shop Rent Payout';
    } else {
      note = 'Utility Bill Paid';
    }
    return { isCashOut: true, amount, category: cat, note };
  }

  // 2. Rent payout
  if (
    (lower.includes('rent') || lower.includes('kiraya')) &&
    (lower.includes('diya') || lower.includes('bhara') || lower.includes('pay') || lower.includes('nikala'))
  ) {
    return {
      isCashOut: true,
      amount,
      category: 'Shop Rent',
      note: 'Dukan Rent / Kiraya',
    };
  }

  // 3. Supplier / Vendor / Wholesaler Payments
  // e.g. "Raju supplier ko 2000 cash diya", "supplier ko 1500 diye"
  const isSupplier =
    lower.includes('supplier') ||
    lower.includes('vendor') ||
    lower.includes('wholesaler') ||
    lower.includes('karigar') ||
    lower.includes('dealer') ||
    lower.includes('factory');

  if (
    isSupplier &&
    (lower.includes('diya') ||
      lower.includes('diye') ||
      lower.includes('cash') ||
      lower.includes('pay') ||
      lower.includes('payment') ||
      lower.includes('nikala') ||
      lower.includes('advance'))
  ) {
    const suppMatch = prompt.match(
      /([a-zA-Z\u0900-\u097F]{3,})\s*(?:supplier|vendor|wholesaler|karigar)/i
    );
    const suppName = suppMatch && suppMatch[1] ? suppMatch[1].trim() : '';
    const note = suppName
      ? `${suppName.charAt(0).toUpperCase() + suppName.slice(1)} Supplier ko Cash Diya`
      : 'Supplier Payment (Cash Payout)';
    return {
      isCashOut: true,
      amount,
      category: 'Supplier Payment',
      note,
    };
  }

  // 4. Chai / Nashta / Refreshment / Snacks
  // e.g. "chay nashte ka 50 nikala", "chai nashta 40", "samosa 60"
  const isRefreshment =
    lower.includes('chay') ||
    lower.includes('chai') ||
    lower.includes('nashta') ||
    lower.includes('nashte') ||
    lower.includes('samosa') ||
    lower.includes('snacks') ||
    lower.includes('tea') ||
    lower.includes('coffee');

  if (
    isRefreshment &&
    (lower.includes('nikala') ||
      lower.includes('nikale') ||
      lower.includes('diya') ||
      lower.includes('diye') ||
      lower.includes('kharch') ||
      lower.includes('kharcha') ||
      lower.includes('ka') ||
      amount)
  ) {
    return {
      isCashOut: true,
      amount,
      category: 'Shop Expense',
      note: 'Chay Nashta / Refreshment',
    };
  }

  // 5. Drawer / Galle / Cash withdrawals for expenses
  // e.g. "galle se 100 nikala", "drawer se 200 nikale"
  const isDrawerWithdrawal =
    (lower.includes('galle se') ||
      lower.includes('drawer se') ||
      lower.includes('tijori se') ||
      lower.includes('cash se')) &&
    (lower.includes('nikala') || lower.includes('nikale') || lower.includes('diya'));

  if (isDrawerWithdrawal) {
    return {
      isCashOut: true,
      amount,
      category: 'Shop Expense',
      note: 'Galle / Drawer se Cash Expense',
    };
  }

  // 6. Transport / Auto / Delivery
  // e.g. "auto bhada 50 diya", "petrol ka 100"
  if (
    (lower.includes('auto') ||
      lower.includes('tempo') ||
      lower.includes('bhada') ||
      lower.includes('petrol') ||
      lower.includes('transport') ||
      lower.includes('courier')) &&
    (lower.includes('diya') || lower.includes('nikala') || lower.includes('bhara') || lower.includes('kharcha'))
  ) {
    return {
      isCashOut: true,
      amount,
      category: 'Transport',
      note: 'Transport / Auto Bhada Expense',
    };
  }

  // 7. Staff Salary / Advance
  if (
    (lower.includes('staff') || lower.includes('salary') || lower.includes('advance')) &&
    (lower.includes('diya') || lower.includes('nikala') || lower.includes('pay')) &&
    !lower.includes('customer')
  ) {
    return {
      isCashOut: true,
      amount,
      category: 'Staff Advance',
      note: 'Staff Salary / Advance Payout',
    };
  }

  // 8. Explicit Cash Out / Shop Expense keywords
  if (
    lower.includes('cash out') ||
    lower.includes('cashout') ||
    lower.includes('shop expense') ||
    lower.includes('dukan kharcha') ||
    lower.includes('dukan ka kharcha') ||
    (lower.includes('kharcha') && (lower.includes('nikala') || lower.includes('hua') || lower.includes('likho') || lower.includes('kiya')))
  ) {
    return {
      isCashOut: true,
      amount,
      category: 'Shop Expense',
      note: 'Shop Expense (Cash Out)',
    };
  }

  return null;
}

export interface PendingBillDraft {
  customerName: string;
  customerId: string | null;
  customerPhone: string;
  amount: number;
  extractedDescription?: string;
  needsDescription?: boolean;
  needsVerification?: boolean;
}

export function processAiCommand(
  rawInput: string,
  storeSettings: StoreSettings,
  customers: Customer[],
  transactions: KhataTransaction[],
  inventory: InventoryItem[],
  invoices: BillInvoice[],
  cashbook: CashEntry[],
  pendingDraft?: PendingBillDraft | null
): { response: string; action: AiAction | null } {
  const prompt = rawInput.trim();
  const lower = prompt.toLowerCase();

  // 1. OUT OF SCOPE CHECK
  const outOfScopeKeywords = [
    'prime minister',
    'president',
    'weather in',
    'cricket',
    'ipl',
    'football',
    'score',
    'movie',
    'cinema',
    'recipe for',
    'tell me a joke',
    'who is elon',
    'who won',
    'capital of',
    'astronomy',
    'write an essay',
    'sing a song',
    'solve equation',
    'code in python',
    'translate to spanish',
  ];
  if (outOfScopeKeywords.some((keyword) => lower.includes(keyword))) {
    return {
      response:
        'Yeh request mere capability ke bahar hai (Outside of scope).\n\nMain *Ghanshyam kids wear* ka dedicated AI Store Manager hoon. Main aapke store ke Khata ledger, kids wear stock, counter bills, payments aur financial reports ko operate kar sakta hoon. Store se related koi bhi kaam boliye!',
      action: null,
    };
  }

  // 1.5. CHECK CONVERSATIONAL FOLLOW-UP FOR PENDING BILL VERIFICATION / DESCRIPTION
  if (pendingDraft && (pendingDraft.needsDescription || pendingDraft.needsVerification)) {
    const isConfirmation =
      lower === 'ha' ||
      lower === 'haan' ||
      lower === 'yes' ||
      lower === 'ok' ||
      lower === 'okay' ||
      lower === 'confirm' ||
      lower === 'sahi hai' ||
      lower === 'theek hai' ||
      lower === 'thik hai' ||
      lower === 'generate' ||
      lower === 'banao' ||
      lower === 'bana do' ||
      lower === 'kar do' ||
      lower.includes('verify') ||
      lower.includes('confirm');

    // Case A: User confirms the existing verified description
    if (isConfirmation && pendingDraft.extractedDescription) {
      const finalItem = pendingDraft.extractedDescription;
      const isClothA = isClothingOrKidsItem(finalItem);
      const sizeA = isClothA ? (extractYearsOrSize(prompt) || '2-4 Yrs') : '';
      const newInvNumber = `GKW-${1050 + invoices.length + 1}`;
      const invoice: BillInvoice = {
        invoiceId: `inv_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        invoiceNumber: newInvNumber,
        customerId: pendingDraft.customerId,
        customerName: pendingDraft.customerName,
        customerPhone: pendingDraft.customerPhone,
        items: [
          {
            itemId: pendingDraft.customerId ? `item_${Date.now()}` : '',
            itemName: finalItem,
            size: sizeA,
            quantity: 1,
            unitPrice: pendingDraft.amount,
          },
        ],
        subtotal: pendingDraft.amount,
        discountAmount: 0.0,
        additionalCharges: 0.0,
        gstPercent: 0.0,
        gstAmount: 0.0,
        netTotal: pendingDraft.amount,
        paymentMode: pendingDraft.customerId ? 'CREDIT' : 'CASH',
        gstinNumber: '24AAACG1234F1Z5',
        stateOfSupply: 'Gujarat (24)',
        optionalNotes: '',
        privateNote: '',
        designTheme: storeSettings.activeInvoiceTheme,
        timestamp: Date.now(),
        engineerName: 'Kirio Ken',
      };
      return {
        response: `✅ *BILL GENERATED!*\n🧾 Invoice No: *${newInvNumber}*\n👤 Customer: *${pendingDraft.customerName}*\n📦 Item: *${finalItem}*${sizeA ? ` (Size: ${sizeA})` : ''}\n💰 Net Total: *₹${pendingDraft.amount.toFixed(0)}*\n\nBill receipt screen par preview kar di gayi hai!`,
        action: {
          actionType: 'CREATE_BILL',
          invoice,
        },
      };
    }

    // Case B: User types the description in response to our prompt
    const { itemName: typedItem, hasExplicitDescription } = extractLineItemDescription(
      prompt,
      inventory,
      pendingDraft.customerName
    );
    const chosenDescription = hasExplicitDescription ? typedItem : prompt.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (chosenDescription.length >= 2 && !KHATA_NOISE_WORDS.has(chosenDescription.toLowerCase())) {
      const formattedItem = chosenDescription
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      const isClothB = isClothingOrKidsItem(formattedItem);
      const sizeB = isClothB ? (extractYearsOrSize(prompt) || '2-4 Yrs') : '';
      const newInvNumber = `GKW-${1050 + invoices.length + 1}`;
      const invoice: BillInvoice = {
        invoiceId: `inv_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        invoiceNumber: newInvNumber,
        customerId: pendingDraft.customerId,
        customerName: pendingDraft.customerName,
        customerPhone: pendingDraft.customerPhone,
        items: [
          {
            itemId: pendingDraft.customerId ? `item_${Date.now()}` : '',
            itemName: formattedItem,
            size: sizeB,
            quantity: 1,
            unitPrice: pendingDraft.amount,
          },
        ],
        subtotal: pendingDraft.amount,
        discountAmount: 0.0,
        additionalCharges: 0.0,
        gstPercent: 0.0,
        gstAmount: 0.0,
        netTotal: pendingDraft.amount,
        paymentMode: pendingDraft.customerId ? 'CREDIT' : 'CASH',
        gstinNumber: '24AAACG1234F1Z5',
        stateOfSupply: 'Gujarat (24)',
        optionalNotes: '',
        privateNote: '',
        designTheme: storeSettings.activeInvoiceTheme,
        timestamp: Date.now(),
        engineerName: 'Kirio Ken',
      };
      return {
        response: `✅ *DESCRIPTION APPLIED & BILL GENERATED!*\n🧾 Invoice No: *${newInvNumber}*\n👤 Customer: *${pendingDraft.customerName}*\n📦 Item: *${formattedItem}*${sizeB ? ` (Size: ${sizeB})` : ''}\n💰 Net Total: *₹${pendingDraft.amount.toFixed(0)}*\n\nBill receipt screen par preview kar di gayi hai!`,
        action: {
          actionType: 'CREATE_BILL',
          invoice,
        },
      };
    }
  }

  // 2. PAYMENT REMINDER TRIGGERING
  if (
    lower.includes('reminder') ||
    lower.includes('yaad dilao') ||
    lower.includes('payment reminder')
  ) {
    const matchedCust = customers.find((c) =>
      lower.includes(c.name.toLowerCase().split(' ')[0])
    );
    if (matchedCust) {
      const pendingStr = Math.abs(matchedCust.netBalance).toFixed(0);
      return {
        response: `Maine *${matchedCust.name}* (Pending Balance: ₹${pendingStr}) ke liye Payment Reminder & Statement flow trigger kar diya hai!\n\nAap WhatsApp ya SMS select karke unka isolated statement aur reminder turant share kar sakte hain.`,
        action: {
          actionType: 'TRIGGER_REMINDER',
          reminderCustomerId: matchedCust.id,
          reminderCustomerName: matchedCust.name,
        },
      };
    } else {
      const topDebtors = customers.filter((c) => c.netBalance > 0);
      if (topDebtors.length > 0) {
        const debtorList = topDebtors
          .slice(0, 3)
          .map((d) => `• ${d.name} (₹${d.netBalance.toFixed(0)})`)
          .join('\n');
        return {
          response: `Kisko payment reminder bhejna hai? Aapke top pending customers hain:\n${debtorList}\n\nBoliye jaise: "${topDebtors[0].name.split(' ')[0]} ko reminder bhejo"`,
          action: null,
        };
      } else {
        return {
          response:
            'Currently kisi bhi customer ka udhaar pending nahi hai! Sabhi accounts clear hain.',
          action: null,
        };
      }
    }
  }

  // 3. PDF & SPECIFIC REPORT ROUTING
  const isPdfRequested =
    lower.includes('pdf') ||
    lower.includes('download pdf') ||
    lower.includes('print pdf') ||
    lower.includes('pdf format');
  const isReportOrHistoryRequest =
    lower.includes('report') ||
    lower.includes('hisaab') ||
    lower.includes('hisab') ||
    lower.includes('statement') ||
    lower.includes('summary') ||
    lower.includes('ledger') ||
    lower.includes('history') ||
    lower.includes('historical') ||
    isPdfRequested;

  if (isReportOrHistoryRequest) {
    const isOwnerQuery =
      lower.includes('meri') ||
      lower.includes('mera') ||
      lower.includes('mere') ||
      lower.includes('owner') ||
      lower.includes('apna') ||
      lower.includes('dukan') ||
      lower.includes('shop') ||
      lower.includes('store');
    const matchedCustomer = customers.find((c) =>
      lower.includes(c.name.toLowerCase().split(' ')[0])
    );

    if (isPdfRequested) {
      if (matchedCustomer && !isOwnerQuery) {
        return {
          response: `Maine *${matchedCustomer.name}* ka isolated Khata Account Statement PDF generate kar diya hai!\n\nIs statement me unka sabse pehla pending bill sabse upar dikhaya gaya hai, aur uske baad chronological historical entries hain.`,
          action: {
            actionType: 'OPEN_PDF_STATEMENT',
            pdfTargetType: 'CUSTOMER',
            pdfTargetCustomer: matchedCustomer,
            pdfReportTitle: `${matchedCustomer.name} - Statement of Account`,
          },
        };
      } else {
        return {
          response:
            'Maine Ghanshyam kids wear ka Official Store & Business Ledger Statement PDF generate kar diya hai! Aap ise download ya print kar sakte hain.',
          action: {
            actionType: 'OPEN_PDF_STATEMENT',
            pdfTargetType: 'STORE_OWNER',
            pdfReportTitle: 'Ghanshyam kids wear - Master Store Ledger Statement',
          },
        };
      }
    }

    if (matchedCustomer && !isOwnerQuery) {
      const custTx = transactions.filter((t) => t.customerId === matchedCustomer.id);
      const debits = custTx
        .filter((t) => t.type === 'GAVE_CREDIT')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits = custTx
        .filter((t) => t.type === 'GOT_PAYMENT')
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = matchedCustomer.netBalance;
      const recentLines = custTx
        .slice(0, 5)
        .map(
          (t) =>
            `• ${new Date(t.timestamp).toLocaleDateString('en-IN')}: ₹${t.amount.toFixed(0)} (${t.type === 'GAVE_CREDIT' ? 'Diye / Udhaar' : 'Mile / Jama'}) - ${t.description || 'Entry'}`
        )
        .join('\n');
      return {
        response: `📋 *CUSTOMER STATEMENT - ${matchedCustomer.name.toUpperCase()}*\n📱 Mobile: ${matchedCustomer.phone}\n🔺 Total Udhaar (Diye): ₹${debits.toFixed(0)}\n🔻 Total Payment (Mile): ₹${credits.toFixed(0)}\n⚖️ *Current Net Balance: ₹${balance.toFixed(0)}* (${balance > 0 ? 'Aapko lene hain' : 'Advance'})\n\nRecent Entries:\n${recentLines || 'No transactions yet.'}\n\n_PDF me dekhne ke liye boliye: "${matchedCustomer.name.split(' ')[0]} ka statement PDF mein dikhao"_`,
        action: {
          actionType: 'NAVIGATE',
          targetTab: 'KHATA',
        },
      };
    }

    const totalReceivable = customers
      .filter((c) => c.netBalance > 0)
      .reduce((sum, c) => sum + c.netBalance, 0);
    const totalPayable = customers
      .filter((c) => c.netBalance < 0)
      .reduce((sum, c) => sum + Math.abs(c.netBalance), 0);
    const totalCashIn = cashbook
      .filter((c) => c.type === 'CASH_IN')
      .reduce((sum, c) => sum + c.amount, 0);
    const totalCashOut = cashbook
      .filter((c) => c.type === 'CASH_OUT')
      .reduce((sum, c) => sum + c.amount, 0);
    const netCash = totalCashIn - totalCashOut;
    const totalSales = invoices.reduce((sum, inv) => sum + inv.netTotal, 0);
    const totalStockPcs = inventory.reduce((sum, i) => sum + i.stockQuantity, 0);
    const inventoryValuation = inventory.reduce(
      (sum, i) => sum + i.stockQuantity * i.retailPrice,
      0
    );
    const topDebtors = customers
      .filter((c) => c.netBalance > 0)
      .sort((a, b) => b.netBalance - a.netBalance)
      .slice(0, 3);
    const debtorSection =
      topDebtors.length === 0
        ? '• Koi pending udhaar nahi hai (All Clear).'
        : topDebtors
            .map((c) => `  • ${c.name}: ₹${c.netBalance.toFixed(0)}`)
            .join('\n');

    const lowStockItems = inventory.filter((i) => i.stockQuantity < 10);
    const stockAlert =
      lowStockItems.length > 0
        ? '\n⚠️ Low Stock Alert:\n' +
          lowStockItems
            .map((i) => `  • ${i.name}: ${i.stockQuantity} pcs bache hain`)
            .join('\n')
        : '\n✅ All kids wear stock is healthy.';

    const reportText = `📊 *GHANSHYAM KIDS WEAR - BUSINESS REPORT*
🏪 *Store:* ${storeSettings.storeName}
📍 *Address:* ${storeSettings.address}
💳 *UPI ID:* ${storeSettings.upiId}

💰 *FINANCIAL & KHATA SUMMARY:*
👥 Total Customers: ${customers.length}
🔺 Pending Udhaar (Aapko Milenge): ₹${totalReceivable.toFixed(2)}
🔻 Supplier / Advance Payable: ₹${totalPayable.toFixed(2)}
💵 Cash in Hand: ₹${netCash.toFixed(2)}

🧾 *POS BILLING & SALES:*
📦 Total Bills: ${invoices.length}
💎 Gross Sales Revenue: ₹${totalSales.toFixed(2)}

👗 *KIDS WEAR INVENTORY:*
📦 Total Stock: ${totalStockPcs} Pieces across ${inventory.length} items
🏷️ Estimated Stock Valuation: ₹${inventoryValuation.toFixed(2)}
${stockAlert}

👥 *TOP PENDING KHATA CUSTOMERS:*
${debtorSection}

Engineered by Kirio Ken | Ghanshyam kids wear`;

    return {
      response:
        'Maine Ghanshyam kids wear ka full store business report generate kar diya hai! Aap ise copy ya WhatsApp par share kar sakte hain.',
      action: {
        actionType: 'REPORT',
        reportText,
      },
    };
  }

  // 4. CASH OUT INTENT (SHOP EXPENSES & CASH PAYOUTS)
  const cashOutData = extractCashOutIntent(prompt);
  if (cashOutData && cashOutData.isCashOut && cashOutData.amount && cashOutData.amount > 0) {
    const amt = cashOutData.amount;
    const cat = cashOutData.category;
    const note = cashOutData.note;
    return {
      response: `💸 *CASH OUT (EXPENSE / PAYOUT) RECORDED IN CASHBOOK*\nAmount: *-₹${amt.toFixed(2)}*\nCategory: *${cat}*\nNote / Reason: *${note}*\nNet Impact: Net Daily Drawer Balance se ₹${amt.toFixed(2)} minus ho gaye hain.\n_Yeh transaction customer udhaar ke bajaye Cashbook ke Cash Out register me log kiya gaya hai._`,
      action: {
        actionType: 'ADD_CASH',
        amount: amt,
        cashType: 'CASH_OUT',
        cashCategory: cat,
        note,
      },
    };
  }

  // 4.5. CANCEL OUT / TICK OFF TRANSACTION
  if (
    lower.includes('cancel') ||
    lower.includes('tick') ||
    lower.includes('hatao') ||
    lower.includes('cancel out')
  ) {
    const amtRegex = /(?:₹|rs)?\s*(\d+)/i;
    const match = lower.match(amtRegex);
    const targetAmt = match ? parseFloat(match[1]) : null;
    const matchedTx = targetAmt
      ? transactions.find((t) => t.amount === targetAmt && !t.isCleared)
      : transactions.find((t) => !t.isCleared);

    if (matchedTx) {
      return {
        response: `Maine ${matchedTx.customerName} ka ₹${matchedTx.amount.toFixed(0)} entry manual tick karke CANCEL OUT kar diya hai! Net customer balance update ho gaya hai.`,
        action: {
          actionType: 'CANCEL_TRANSACTION',
          transactionIdToCancel: matchedTx.id,
        },
      };
    } else {
      return {
        response:
          'Mujhe cancel karne ke liye koi active uncleared transaction nahi mila. Customer detail screen me jakar aap manual checkbox se bhi entry cancel kar sakte hain.',
        action: {
          actionType: 'NAVIGATE',
          targetTab: 'KHATA',
        },
      };
    }
  }

  // 5. READ ACCESS FOR TOTAL & AGGREGATE UDHAAR
  const isAggregateUdharQuery =
    lower.includes('total udhar') ||
    lower.includes('total udhaar') ||
    lower.includes('kul udhar') ||
    lower.includes('kul udhaar') ||
    lower.includes('paisa fasa') ||
    lower.includes('paise fase') ||
    lower.includes('fasa hua paisa') ||
    lower.includes('fasa hai') ||
    lower.includes('market udhar') ||
    lower.includes('market udhaar') ||
    lower.includes('total baki') ||
    lower.includes('total baaki') ||
    lower.includes('kul baki') ||
    lower.includes('baki kitna') ||
    lower.includes('baaki kitna') ||
    lower.includes('kitna baki') ||
    lower.includes('kitna baaki') ||
    lower.includes('udhar kitna') ||
    lower.includes('udhaar kitna') ||
    lower.includes('kitna udhar') ||
    lower.includes('kitna udhaar') ||
    lower.includes('kitna lena hai') ||
    lower.includes('kitne lene hain') ||
    lower.includes('kitna paisa lena') ||
    lower.includes('total pending') ||
    lower.includes('pending udhar') ||
    lower.includes('pending udhaar') ||
    (lower.includes('udhar') &&
      !lower.includes('diya') &&
      !lower.includes('lagawo') &&
      !lower.includes('likho') &&
      !lower.includes('laga') &&
      !lower.includes('jama') &&
      (lower.includes('kitna') ||
        lower.includes('total') ||
        lower.includes('batao') ||
        lower.includes('batawo') ||
        lower.includes('check') ||
        lower.includes('hai'))) ||
    (lower.includes('udhaar') &&
      !lower.includes('diya') &&
      !lower.includes('lagawo') &&
      !lower.includes('likho') &&
      !lower.includes('laga') &&
      !lower.includes('jama') &&
      (lower.includes('kitna') ||
        lower.includes('total') ||
        lower.includes('batao') ||
        lower.includes('batawo') ||
        lower.includes('check') ||
        lower.includes('hai')));

  const namedCustForBalance = extractKhataTargetCustomer(prompt, customers);
  const isIndividualTarget =
    namedCustForBalance &&
    namedCustForBalance.matchedCust &&
    (lower.includes('ka') || lower.includes('ke') || lower.includes('ki')) &&
    !lower.includes('total') &&
    !lower.includes('market') &&
    !lower.includes('sabka');

  if (isAggregateUdharQuery && !isIndividualTarget) {
    const debtors = customers
      .filter((c) => c.netBalance > 0)
      .sort((a, b) => b.netBalance - a.netBalance);
    const totalReceivable = debtors.reduce((sum, c) => sum + c.netBalance, 0);
    const totalPayable = customers
      .filter((c) => c.netBalance < 0)
      .reduce((sum, c) => sum + Math.abs(c.netBalance), 0);
    const breakdownList =
      debtors.length === 0
        ? '• Sabhi accounts clear hain! Market me koi udhaar pending nahi hai.'
        : debtors
            .map((c) => `• *${c.name}*: ₹${c.netBalance.toFixed(0)} (Phone: ${c.phone})`)
            .join('\n');
    const payableNote =
      totalPayable > 0
        ? `\n\n_Note: Store ne suppliers/advance me ₹${totalPayable.toFixed(0)} dene hain._`
        : '';
    return {
      response: `📊 *TOTAL MARKET UDHAAR (Aapko Lene Hain):* *₹${totalReceivable.toFixed(0)}*\n\nGhanshyam kids wear ke kul *${debtors.length}* customers ke paas market mein udhaar / fasa hua paisa baaki hai:\n\n*Pending Khata Customers:*\n${breakdownList}${payableNote}\n\n_Kisi specific customer ka balance dekhne ke liye boliye: "${debtors[0] ? debtors[0].name.split(' ')[0] : 'Ramesh'} ka kitna baki hai?"_`,
      action: {
        actionType: 'NAVIGATE',
        targetTab: 'KHATA',
      },
    };
  }

  // 6. READ ACCESS FOR INDIVIDUAL CUSTOMER BALANCE
  const isCustomerBalanceInquiry =
    (lower.includes('kitna') ||
      lower.includes('kitne') ||
      lower.includes('balance') ||
      lower.includes('hisaab') ||
      lower.includes('hisab') ||
      lower.includes('check') ||
      lower.includes('status') ||
      lower.includes('batao') ||
      lower.includes('batawo') ||
      prompt.endsWith('?')) &&
    (lower.includes('baki') ||
      lower.includes('baaki') ||
      lower.includes('udhar') ||
      lower.includes('udhaar') ||
      lower.includes('balance') ||
      lower.includes('lena hai') ||
      lower.includes('dena hai'));

  if (isCustomerBalanceInquiry && namedCustForBalance) {
    const cust = namedCustForBalance.matchedCust;
    if (cust) {
      const bal = cust.netBalance;
      const statusText =
        bal > 0
          ? `*₹${bal.toFixed(0)}* Udhaar baaki hai (Aapko lene hain)`
          : bal < 0
            ? `*₹${Math.abs(bal).toFixed(0)}* Advance jama hai (Aapko dene hain)`
            : '*₹0* (Khata poora chukta hai / All Clear)';
      const custTxList = transactions.filter((t) => t.customerId === cust.id);
      const lastTx = custTxList[0];
      const lastTxText = lastTx
        ? `\n• Aakhri entry: ₹${lastTx.amount.toFixed(0)} (${lastTx.type === 'GAVE_CREDIT' ? 'Udhaar' : 'Jama'}) on ${new Date(lastTx.timestamp).toLocaleDateString('en-IN')}`
        : '';
      return {
        response: `👤 *${cust.name}* ka Account Status:\nNet Balance: ${statusText}\nMobile: ${cust.phone}\nTotal Khata Entries: ${custTxList.length}${lastTxText}\n\n_Entry karne ke liye boliye: "${cust.name.split(' ')[0]} ne 500 diye" ya "${cust.name.split(' ')[0]} ke naam par 200 udhar likho"_`,
        action: {
          actionType: 'NAVIGATE',
          targetTab: 'KHATA',
        },
      };
    } else if (namedCustForBalance.name) {
      const candidateName = namedCustForBalance.name;
      return {
        response: `⚠️ *${candidateName}* naam ka koi customer filhal Ghanshyam kids wear khata ledger me registered nahi hai.\n\nAap naya khata open karne ke liye bol sakte hain:\n• "${candidateName} ke naam par 100 udhar lagawo"\n• "${candidateName} ne 500 jama kiye"\n• "Naya customer ${candidateName} jodo"`,
        action: {
          actionType: 'NAVIGATE',
          targetTab: 'KHATA',
        },
      };
    }
  }

  // 7. KHATA ENTITY EXTRACTION: JAMA / MILE / DIYE (PAYMENT RECEIVED)
  const isPaymentIntent =
    lower.includes('jama') ||
    lower.includes('mile') ||
    lower.includes('aagaye') ||
    lower.includes('aa gaye') ||
    lower.includes('payment received') ||
    lower.includes('received payment') ||
    lower.includes('got payment') ||
    lower.includes('pay kiye') ||
    lower.includes('pay kiya') ||
    (lower.includes('diye') &&
      (lower.includes('ne') ||
        lower.includes('se') ||
        lower.includes('customer') ||
        !lower.includes('udhar')));

  const amtMatch = prompt.match(
    /(?:₹|rs\.?|inr|amount)?\s*(\d+(?:\.\d+)?)\s*(?:rupaye|rupayee|rupees|rs|₹)?/i
  );
  const detectedAmount = amtMatch ? parseFloat(amtMatch[1]) : null;

  if (
    isPaymentIntent &&
    detectedAmount &&
    detectedAmount > 0 &&
    !lower.includes('bill banawo') &&
    !lower.includes('bill banao')
  ) {
    const custEntity = extractKhataTargetCustomer(prompt, customers);
    const targetName = custEntity ? custEntity.name : 'Counter Customer';
    const existingCust = custEntity?.matchedCust || customers.find((c) =>
      c.name.toLowerCase().includes(targetName.toLowerCase().split(' ')[0])
    );
    const prevBal = existingCust ? existingCust.netBalance : 0;
    const newBal = prevBal - detectedAmount;
    let balanceImpactText = '';
    if (existingCust) {
      if (prevBal > 0) {
        if (newBal > 0) {
          balanceImpactText = `• Net Pending Udhaar: ₹${prevBal.toFixed(0)} se ghat kar *₹${newBal.toFixed(0)}* reh gaya hai.`;
        } else if (newBal === 0) {
          balanceImpactText = `• Khata Status: *Poora udhaar chukta ho gaya hai (₹0 / All Clear)!*`;
        } else {
          balanceImpactText = `• Khata Status: Udhaar clear hokar *₹${Math.abs(newBal).toFixed(0)}* Advance jama ho gaya hai.`;
        }
      } else {
        balanceImpactText = `• Khata Status: Advance balance badhkar *₹${Math.abs(newBal).toFixed(0)}* ho gaya hai.`;
      }
    } else {
      balanceImpactText = `• Khata Status: Naya customer *${targetName}* register hokar ₹${detectedAmount.toFixed(0)} payment jama ho gayi hai.`;
    }
    return {
      response: `📥 *JAMA ENTRY RECORDED (PAYMENT RECEIVED)*\n👤 Customer: *${targetName}*\n💵 Amount: *₹${detectedAmount.toFixed(0)}* (Jama / Credit)\n${balanceImpactText}\n\nTransaction store ledger aur cashbook me live record kar diya gaya hai!`,
      action: {
        actionType: 'RECORD_TRANSACTION',
        customerName: targetName,
        amount: detectedAmount,
        transactionType: 'GOT_PAYMENT',
        note: `Payment Received (Jama / Diye) via AI Store Manager`,
      },
    };
  }

  // 8. KHATA ENTITY EXTRACTION: UDHAR / BAKI / LIKH LO (DEBT / DEBIT)
  const isUdharDebitIntent =
    lower.includes('udhar') ||
    lower.includes('udhaar') ||
    lower.includes('baki') ||
    lower.includes('baaki') ||
    lower.includes('likh lo') ||
    lower.includes('likh do') ||
    lower.includes('likh lena') ||
    lower.includes('lagawo') ||
    lower.includes('lagao') ||
    lower.includes('laga do') ||
    lower.includes('dal do') ||
    lower.includes('debit') ||
    lower.includes('udhar diya');

  if (
    isUdharDebitIntent &&
    detectedAmount &&
    detectedAmount > 0 &&
    !lower.includes('bill banawo') &&
    !lower.includes('bill banao') &&
    !lower.includes('parchi banao')
  ) {
    const custEntity = extractKhataTargetCustomer(prompt, customers);
    if (!custEntity && (lower.includes('dal do') || lower.includes('likh lo'))) {
      return {
        response: `⚠️ *Kiske khate mein dalna hai?*\nMaine amount *₹${detectedAmount.toFixed(0)}* Udhaar/Baki detect kiya hai, par customer ka naam nahi mila.\n\nBoliye jaise: *"Suresh ke naam par ${detectedAmount} udhar lagawo"* ya *"Ramesh ka ${detectedAmount} baki mein dal do"*`,
        action: null,
      };
    }
    const targetName = custEntity ? custEntity.name : 'Counter Customer';
    const existingCust = custEntity?.matchedCust || customers.find((c) =>
      c.name.toLowerCase().includes(targetName.toLowerCase().split(' ')[0])
    );
    const prevBal = existingCust ? existingCust.netBalance : 0;
    const newBal = prevBal + detectedAmount;
    let balanceImpactText = '';
    if (existingCust) {
      if (prevBal >= 0) {
        balanceImpactText = `• Net Pending Udhaar: ₹${prevBal.toFixed(0)} se badhkar *₹${newBal.toFixed(0)}* ho gaya hai (Aapko lene hain).`;
      } else {
        if (newBal > 0) {
          balanceImpactText = `• Advance adjust hokar ab *₹${newBal.toFixed(0)}* Udhaar baaki hai (Aapko lene hain).`;
        } else {
          balanceImpactText = `• Advance balance adjust hokar ab *₹${Math.abs(newBal).toFixed(0)}* bacha hai.`;
        }
      }
    } else {
      balanceImpactText = `• Khata Status: Naya customer *${targetName}* register hokar ₹${detectedAmount.toFixed(0)} pending udhaar create ho gaya hai.`;
    }
    return {
      response: `📤 *UDHAAR ENTRY RECORDED (DEBIT)*\n👤 Customer: *${targetName}*\n💳 Amount: *₹${detectedAmount.toFixed(0)}* (Udhaar / Debit)\n${balanceImpactText}\n\nTransaction customer ke khate me live record ho gaya hai!`,
      action: {
        actionType: 'RECORD_TRANSACTION',
        customerName: targetName,
        amount: detectedAmount,
        transactionType: 'GAVE_CREDIT',
        note: `Udhaar entry (Debit / Baki) via AI Store Manager`,
      },
    };
  }

  // 9. GENERAL TOTAL SALES & INVOICE INQUIRY
  if (
    lower.includes('total sales') ||
    lower.includes('sales kitni') ||
    lower.includes('kitne bill bane') ||
    lower.includes('aaj ki bikri') ||
    lower.includes('last invoice') ||
    lower.includes('aakhri bill') ||
    lower.includes('kitni bikri')
  ) {
    const totalSales = invoices.reduce((sum, inv) => sum + inv.netTotal, 0);
    const lastInv = invoices[0];
    let lastInvSummary = '';
    if (lastInv) {
      lastInvSummary = `\n\nAakhri bill:\n• No: *${lastInv.invoiceNumber}*\n• Customer: *${lastInv.customerName}*\n• Amount: *₹${lastInv.netTotal.toFixed(2)}*\n• Item: ${lastInv.items[0]?.itemName || 'Garment'} (${lastInv.paymentMode})`;
    }
    return {
      response: `🧾 *POS Billing & Sales Summary:*\nTotal Bills Generated: *${invoices.length}*\nGross Sales Revenue: *₹${totalSales.toFixed(2)}*${lastInvSummary}`,
      action: {
        actionType: 'NAVIGATE',
        targetTab: 'BILLING',
      },
    };
  }

  // 10. GENERATE INVOICE / BILL
  if (
    lower.includes('bill') ||
    lower.includes('invoice') ||
    lower.includes('parchi')
  ) {
    const amtRegex = /(?:₹|rs\.?|amount|total)?\s*(\d+(?:\.\d+)?)/i;
    const match = lower.match(amtRegex);
    const billAmt = match ? parseFloat(match[1]) : 850.0;

    const { customerName, matchedCust } = extractCustomerName(
      prompt,
      customers,
      storeSettings
    );
    const custPhone = matchedCust ? matchedCust.phone : '+91 98000 00000';

    const { itemName, size, quantity, hasExplicitDescription } = extractLineItemDescription(
      prompt,
      inventory,
      customerName
    );
    const newInvNumber = `GKW-${1050 + invoices.length + 1}`;

    if (!hasExplicitDescription || !itemName) {
      return {
        response: `🧾 *BILL DETAILS DETECTED (DESCRIPTION REQUIRED)*\n👤 Customer: *${customerName}*\n💰 Bill Amount: *₹${billAmt.toFixed(0)}*\n\n⚠️ **Item Description Chahiye:** Kripya is bill ke liye **Item Description / Details** type karein (e.g. *'School Uniform Set'*, *'Party Baba Suit'*, *'Water Bill'*, *'Princess Frock'*).\n_Maine automatically koi description use nahi ki hai._\n\nNiche diye gaye box me description type karke bill generate karein:`,
        action: {
          actionType: 'VERIFY_BILL',
          customerName,
          customerPhone: custPhone,
          amount: billAmt,
          needsDescription: true,
          needsVerification: false,
          extractedDescription: '',
        },
      };
    }

    const draftInvoice: BillInvoice = {
      invoiceId: `inv_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: newInvNumber,
      customerId: matchedCust ? matchedCust.id : null,
      customerName,
      customerPhone: custPhone,
      items: [
        {
          itemId: matchedCust ? `item_${Date.now()}` : '',
          itemName,
          size,
          quantity,
          unitPrice: billAmt / quantity,
        },
      ],
      subtotal: billAmt,
      discountAmount: 0.0,
      additionalCharges: 0.0,
      gstPercent: 0.0,
      gstAmount: 0.0,
      netTotal: billAmt,
      paymentMode: matchedCust ? 'CREDIT' : 'CASH',
      gstinNumber: '24AAACG1234F1Z5',
      stateOfSupply: 'Gujarat (24)',
      optionalNotes: '',
      privateNote: '',
      designTheme: storeSettings.activeInvoiceTheme,
      timestamp: Date.now(),
      engineerName: 'Kirio Ken',
    };

    return {
      response: `🧾 *BILL DETAILS DETECTED (VERIFICATION REQUIRED)*\n👤 Customer: *${customerName}*\n💰 Bill Amount: *₹${billAmt.toFixed(0)}*\n📦 Detected Description: *${itemName}* (Qty: ${quantity})\n\n🔍 **Kripya Description Verify Karein:** Kya aap *"${itemName}"* description ke sath bill generate karna chahte hain? Niche diye gaye card me verify karein ya edit karke naya description type karein.`,
      action: {
        actionType: 'VERIFY_BILL',
        customerName,
        customerPhone: custPhone,
        amount: billAmt,
        needsDescription: false,
        needsVerification: true,
        extractedDescription: itemName,
        invoice: draftInvoice,
      },
    };
  }

  // 11. ADD CUSTOMER COMMAND
  if (
    lower.includes('add customer') ||
    lower.includes('naya customer') ||
    lower.includes('customer jodo') ||
    lower.includes('customer add')
  ) {
    const raw = prompt
      .replace(
        /add customer|naya customer|customer jodo|customer add|jodo|add/gi,
        ''
      )
      .trim();
    const phoneMatch = raw.match(/\b\d{10}\b|\+91\s*\d{10}/);
    const phone =
      phoneMatch ? phoneMatch[0] : `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const cleanName = raw.replace(phone, '').replace(/[^a-zA-Z\s\u0900-\u097F]/g, '').trim();
    const finalName =
      cleanName.length > 0
        ? cleanName
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : 'Retail Parent';
    return {
      response: `Naya customer '${finalName}' (${phone}) successfully Ghanshyam kids wear khata ledger me register kar diya gaya hai!`,
      action: {
        actionType: 'ADD_CUSTOMER',
        customerName: finalName,
        customerPhone: phone,
        amount: 0.0,
      },
    };
  }

  // 12. ADD INVENTORY GARMENT
  if (
    lower.includes('garment') ||
    lower.includes('item add') ||
    lower.includes('stock add') ||
    lower.includes('naya dress')
  ) {
    const amtMatchItem = lower.match(/(?:price|rate|rs|₹)\s*(\d+)/i);
    const price = amtMatchItem ? parseFloat(amtMatchItem[1]) : 550.0;
    const stockMatch = lower.match(/(?:stock|quantity|qty|pcs)\s*(\d+)/i);
    const stockQty = stockMatch ? parseInt(stockMatch[1], 10) : 20;
    const itemName = lower.includes('frock')
      ? 'Fairy Princess Frock'
      : lower.includes('kurta')
        ? 'Festive Kurta Pajama Set'
        : lower.includes('suit') || lower.includes('baba')
          ? 'Cotton Baba Suit'
          : 'Kids Designer Wear';
    return {
      response: `Naya garment '${itemName}' (Price: ₹${price}, Stock: ${stockQty} pcs) catalog me add kar diya gaya hai!`,
      action: {
        actionType: 'ADD_INVENTORY',
        inventoryItemName: itemName,
        inventoryCategory: 'BOYS_CASUAL',
        inventoryPrice: price,
        inventoryStock: stockQty,
      },
    };
  }

  // 13. CASH IN HAND / DRAWER BALANCE
  if (
    lower.includes('cash in hand') ||
    lower.includes('drawer') ||
    lower.includes('galla') ||
    lower.includes('rokad') ||
    lower.includes('cash kitna')
  ) {
    const totalCashIn = cashbook
      .filter((c) => c.type === 'CASH_IN')
      .reduce((sum, c) => sum + c.amount, 0);
    const totalCashOut = cashbook
      .filter((c) => c.type === 'CASH_OUT')
      .reduce((sum, c) => sum + c.amount, 0);
    const netCash = totalCashIn - totalCashOut;
    return {
      response: `💵 *CASH IN DRAWER (GALLE ME ROKAD):* *₹${netCash.toFixed(2)}*\nTotal Cash In (+): ₹${totalCashIn.toFixed(2)}\nTotal Cash Out (-) / Expenses: ₹${totalCashOut.toFixed(2)}\nTotal Cashbook Entries: ${cashbook.length}`,
      action: {
        actionType: 'NAVIGATE',
        targetTab: 'CASHBOOK',
      },
    };
  }

  // 14. STOCK INQUIRY
  if (
    lower.includes('stock') ||
    lower.includes('garment') ||
    lower.includes('kapde')
  ) {
    const totalStock = inventory.reduce((sum, i) => sum + i.stockQuantity, 0);
    return {
      response: `Ghanshyam kids wear me currently *${totalStock}* pieces garments stock me uplabdh hain across ${inventory.length} designs.`,
      action: {
        actionType: 'NAVIGATE',
        targetTab: 'INVENTORY',
      },
    };
  }

  // 15. STORE & UPI INQUIRY
  if (
    lower.includes('upi') ||
    lower.includes('address') ||
    lower.includes('dukan') ||
    lower.includes('shop')
  ) {
    return {
      response: `🏪 *${storeSettings.storeName}*\nAddress: ${storeSettings.address}\nUPI ID: ${storeSettings.upiId}\nPhone: ${storeSettings.phone}`,
      action: {
        actionType: 'NAVIGATE',
        targetTab: 'PROFILE',
      },
    };
  }

  // 16. DIRECT ANSWERING OVER MENUS
  const totalReceivable = customers
    .filter((c) => c.netBalance > 0)
    .reduce((sum, c) => sum + c.netBalance, 0);
  const debtorCount = customers.filter((c) => c.netBalance > 0).length;
  const totalCashIn = cashbook
    .filter((c) => c.type === 'CASH_IN')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalCashOut = cashbook
    .filter((c) => c.type === 'CASH_OUT')
    .reduce((sum, c) => sum + c.amount, 0);
  const netCash = totalCashIn - totalCashOut;
  const totalSales = invoices.reduce((sum, inv) => sum + inv.netTotal, 0);

  const isQuestionOrInterrogative =
    lower.includes('kitna') ||
    lower.includes('kitne') ||
    lower.includes('kya') ||
    lower.includes('batao') ||
    lower.includes('batawo') ||
    lower.includes('check') ||
    lower.includes('status') ||
    prompt.endsWith('?');

  if (isQuestionOrInterrogative) {
    return {
      response: `📊 *${storeSettings.storeName} - Live Financial Summary:*\nTotal Market Udhaar (Baki): *₹${totalReceivable.toFixed(0)}* (${debtorCount} customers)\nDrawer Cash: *₹${netCash.toFixed(2)}*\nGross Sales: *₹${totalSales.toFixed(2)}* (${invoices.length} bills)\n\nAap specific query puch sakte hain:\n• "Udhar kitna baki hai?"\n• "500 ka bijali bill bhara"\n• "Raju supplier ko 2000 cash diya"\n• "chay nashte ka 50 nikala"\n• "Ramesh ne 500 diye"\n• "Ghanshyam ke naam se 1500rs ka bill banawo and likho water ka bill"`,
      action: null,
    };
  }

  return {
    response: `Ready. What do you need to record? Store related operations:\n• "500 ka bijali bill bhara" (Cash Out / Expense)\n• "Raju supplier ko 2000 cash diya" (Supplier Payout)\n• "chay nashte ka 50 nikala" (Shop Expense)\n• "Udhar kitna baki hai?"\n• "Ramesh ne 500 diye" (Jama / Payment received)\n• "Suresh ke naam par 100 udhar lagawo" (Udhar / Debit)\n• "Ghanshyam ke naam se 1500rs ka bill banawo and likho water ka bill"`,
    action: null,
  };
}
