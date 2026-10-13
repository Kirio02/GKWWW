import {
  BillInvoice,
  CashEntry,
  Customer,
  InventoryItem,
  KhataTransaction,
  StoreBackupPayload,
} from '../types';

/**
 * Escapes a cell value for standard RFC 4180 CSV compliance
 */
export function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Triggers client-side browser download of a finalized CSV with UTF-8 BOM
 */
export function downloadCsvFile(filename: string, csvContent: string) {
  // UTF-8 BOM ensures Excel displays Indian rupee symbols, Hindi and Gujarati text correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Generate Khata Transactions CSV
 */
export function generateKhataTransactionsCsv(
  transactions: KhataTransaction[],
  customers: Customer[]
): string {
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const headers = [
    'Date & Time',
    'Customer Name',
    'Phone',
    'Type',
    'Amount (INR)',
    'Payment Mode',
    'Settled Status',
    'Bill / Receipt No',
    'Item Details / Sizes',
    'Description / Notes',
  ];

  const rows = transactions.map((tx) => {
    const cust = customerMap.get(tx.customerId);
    const dateStr = new Date(tx.date || tx.timestamp).toLocaleString('en-IN');
    const itemsSummary = tx.itemDetails?.length
      ? tx.itemDetails.map((it) => `${it.itemName} (${it.size}) x${it.quantity}`).join('; ')
      : '';

    return [
      escapeCsvCell(dateStr),
      escapeCsvCell(tx.customerName || cust?.name || 'Walk-in'),
      escapeCsvCell(cust?.phone || '-'),
      escapeCsvCell(tx.type === 'GAVE_CREDIT' ? 'Udhaar Diya (Credit Given)' : 'Jama Kiya (Payment Received)'),
      escapeCsvCell(tx.amount.toFixed(2)),
      escapeCsvCell(tx.paymentMode || 'CASH'),
      escapeCsvCell(tx.isCleared ? 'SETTLED / CLEARED' : 'ACTIVE / OPEN'),
      escapeCsvCell(tx.billNumber || '-'),
      escapeCsvCell(itemsSummary || '-'),
      escapeCsvCell(tx.description || '-'),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * 2. Generate Customer Khata Summary CSV
 */
export function generateCustomersCsv(customers: Customer[]): string {
  const headers = [
    'Customer ID',
    'Customer Name',
    'Mobile Number',
    'Address / City',
    'Customer Type',
    'Net Balance (INR)',
    'Status',
    'Last Transaction Date',
    'Account Created Date',
  ];

  const rows = customers.map((c) => {
    const typeLabel =
      c.type === 'RETAIL_PARENT'
        ? 'Retail Parent'
        : c.type === 'WHOLESALE_BUYER'
        ? 'Wholesale Buyer'
        : 'Supplier';

    const statusLabel =
      c.netBalance > 0
        ? 'Pending Udhaar (Owes Store)'
        : c.netBalance < 0
        ? 'Advance / Store Owes'
        : 'Nil Balance (All Cleared)';

    const lastTx = c.lastTransactionDate
      ? new Date(c.lastTransactionDate).toLocaleDateString('en-IN')
      : 'No activity';

    const created = c.createdAt
      ? new Date(c.createdAt).toLocaleDateString('en-IN')
      : '-';

    return [
      escapeCsvCell(c.id),
      escapeCsvCell(c.name),
      escapeCsvCell(c.phone || '-'),
      escapeCsvCell(c.address || '-'),
      escapeCsvCell(typeLabel),
      escapeCsvCell(c.netBalance.toFixed(2)),
      escapeCsvCell(statusLabel),
      escapeCsvCell(lastTx),
      escapeCsvCell(created),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * 3. Generate Invoices & Bills CSV
 */
export function generateInvoicesCsv(invoices: BillInvoice[]): string {
  const headers = [
    'Invoice Number',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Items Summary',
    'Subtotal (INR)',
    'Discount (INR)',
    'GST %',
    'GST Amount (INR)',
    'Net Total (INR)',
    'Payment Mode',
    'State of Supply',
    'Notes',
    'Theme',
  ];

  const rows = invoices.map((inv) => {
    const dateStr = new Date(inv.date || inv.timestamp).toLocaleString('en-IN');
    const itemsStr = inv.items
      .map((i) => `${i.itemName} [Size: ${i.size}] x${i.quantity} @ Rs.${i.unitPrice}`)
      .join(' | ');

    return [
      escapeCsvCell(inv.invoiceNumber),
      escapeCsvCell(dateStr),
      escapeCsvCell(inv.customerName || 'Cash Customer'),
      escapeCsvCell(inv.customerPhone || '-'),
      escapeCsvCell(itemsStr),
      escapeCsvCell(inv.subtotal.toFixed(2)),
      escapeCsvCell((inv.discountAmount || 0).toFixed(2)),
      escapeCsvCell(inv.gstPercent || 0),
      escapeCsvCell((inv.gstAmount || 0).toFixed(2)),
      escapeCsvCell(inv.netTotal.toFixed(2)),
      escapeCsvCell(inv.paymentMode || 'CASH'),
      escapeCsvCell(inv.stateOfSupply || 'Gujarat'),
      escapeCsvCell(inv.optionalNotes || '-'),
      escapeCsvCell(inv.designTheme || 'modern_kids'),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * 4. Generate Cashbook (Rokad) Daily Register CSV
 */
export function generateCashbookCsv(cashbook: CashEntry[]): string {
  const headers = [
    'Date & Time',
    'Flow Type',
    'Category',
    'Amount (INR)',
    'Notes / Remarks',
  ];

  const rows = cashbook.map((e) => {
    const dateStr = new Date(e.timestamp).toLocaleString('en-IN');
    return [
      escapeCsvCell(dateStr),
      escapeCsvCell(e.type === 'CASH_IN' ? 'CASH IN (Income / Jama)' : 'CASH OUT (Expense / Nikala)'),
      escapeCsvCell(e.category || 'General Expense'),
      escapeCsvCell(e.amount.toFixed(2)),
      escapeCsvCell(e.note || '-'),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * 5. Generate Inventory Stock Master CSV
 */
export function generateInventoryCsv(inventory: InventoryItem[]): string {
  const headers = [
    'Item Code',
    'Item Name',
    'Category',
    'Sizes Available',
    'Color',
    'Retail Price (INR)',
    'Wholesale Price (INR)',
    'Stock In Hand',
    'Total Stock Valuation (INR)',
    'Stock Status',
  ];

  const rows = inventory.map((item) => {
    const totalValuation = item.stockQuantity * item.retailPrice;
    const status =
      item.stockQuantity === 0
        ? 'OUT OF STOCK'
        : item.stockQuantity <= 3
        ? 'LOW STOCK'
        : 'IN STOCK';

    return [
      escapeCsvCell(item.itemCode || '-'),
      escapeCsvCell(item.name),
      escapeCsvCell(item.category),
      escapeCsvCell(item.sizes.join('; ')),
      escapeCsvCell(item.color || '-'),
      escapeCsvCell(item.retailPrice.toFixed(2)),
      escapeCsvCell(item.wholesalePrice.toFixed(2)),
      escapeCsvCell(item.stockQuantity),
      escapeCsvCell(totalValuation.toFixed(2)),
      escapeCsvCell(status),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * 6. Generate Master Finalized Multi-Section Store CSV
 * Combines Executive Summary + Customers + Transactions + Invoices + Cashbook + Inventory
 */
export function generateMasterStoreCsv(data: StoreBackupPayload): string {
  const timestamp = new Date().toLocaleString('en-IN');
  const store = data.storeSettings;
  const totalUdhaarReceivable = data.customers
    .filter((c) => c.netBalance > 0)
    .reduce((sum, c) => sum + c.netBalance, 0);
  const totalAdvancePayable = data.customers
    .filter((c) => c.netBalance < 0)
    .reduce((sum, c) => sum + Math.abs(c.netBalance), 0);
  const totalCashIn = data.cashbook
    .filter((e) => e.type === 'CASH_IN')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCashOut = data.cashbook
    .filter((e) => e.type === 'CASH_OUT')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalBilledSales = data.invoices.reduce((sum, inv) => sum + inv.netTotal, 0);

  const lines: string[] = [];

  // Business Header
  lines.push(`"GHANSHYAM KIDS WEAR - MASTER BUSINESS LEDGER & ACCOUNTS"`);
  lines.push(`"Store Name:",${escapeCsvCell(store.storeName)},"Phone:",${escapeCsvCell(store.phone)}`);
  lines.push(`"Address:",${escapeCsvCell(store.address)},"UPI ID:",${escapeCsvCell(store.upiId)}`);
  lines.push(`"Export Timestamp:",${escapeCsvCell(timestamp)},"Format:","Finalized Master CSV (RFC 4180)"`);
  lines.push(`""`);

  // Key Financial Metrics
  lines.push(`"--- EXECUTIVE FINANCIAL AUDIT SUMMARY ---"`);
  lines.push(`"Metric","Value"`);
  lines.push(`"Total Customers / Accounts",${escapeCsvCell(data.customers.length)}`);
  lines.push(`"Total Udhaar Receivable (Pending from Customers)",${escapeCsvCell(`Rs. ${totalUdhaarReceivable.toFixed(2)}`)}`);
  lines.push(`"Total Advance Payable",${escapeCsvCell(`Rs. ${totalAdvancePayable.toFixed(2)}`)}`);
  lines.push(`"Net Cashbook Drawer Balance",${escapeCsvCell(`Rs. ${(totalCashIn - totalCashOut).toFixed(2)}`)}`);
  lines.push(`"Total Invoiced Revenue",${escapeCsvCell(`Rs. ${totalBilledSales.toFixed(2)}`)}`);
  lines.push(`"Total Invoices Issued",${escapeCsvCell(data.invoices.length)}`);
  lines.push(`"Total Inventory SKUs",${escapeCsvCell(data.inventory.length)}`);
  lines.push(`""`);

  // Section 1: Customer Khata Accounts
  lines.push(`"--- SECTION 1: CUSTOMER KHATA ACCOUNTS ---"`);
  lines.push(generateCustomersCsv(data.customers));
  lines.push(`""`);

  // Section 2: Khata Transactions
  lines.push(`"--- SECTION 2: KHATA TRANSACTIONS LEDGER ---"`);
  lines.push(generateKhataTransactionsCsv(data.transactions, data.customers));
  lines.push(`""`);

  // Section 3: Invoices & Bills
  lines.push(`"--- SECTION 3: INVOICES & BILLS REGISTER ---"`);
  lines.push(generateInvoicesCsv(data.invoices));
  lines.push(`""`);

  // Section 4: Cashbook
  lines.push(`"--- SECTION 4: CASHBOOK DAILY REGISTER ---"`);
  lines.push(generateCashbookCsv(data.cashbook));
  lines.push(`""`);

  // Section 5: Garment Inventory
  lines.push(`"--- SECTION 5: GARMENT INVENTORY MASTER ---"`);
  lines.push(generateInventoryCsv(data.inventory));

  return lines.join('\r\n');
}
