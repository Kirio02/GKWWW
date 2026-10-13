import { StoreBackupPayload } from '../types';

export interface SheetExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Creates and populates a comprehensive Google Spreadsheet containing:
 * 1. Customer Khata Balances
 * 2. Khata Ledger Transactions (with settled/tick status)
 * 3. Invoices & Billing Register
 * 4. Cashbook (Rokad - Daily Cash In & Cash Out)
 * 5. Garment Inventory & Stock Levels
 */
export async function exportStoreToGoogleSheets(
  data: StoreBackupPayload,
  accessToken: string
): Promise<SheetExportResult> {
  const dateFormatted = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const sheetTitle = `${data.storeSettings.storeName || 'Ghanshyam Kids Wear'} - Store Ledger & Accounts (${dateFormatted})`;

  // 1. Create Spreadsheet with predefined sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle,
      },
      sheets: [
        {
          properties: {
            title: 'Customer Khata',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Khata Transactions',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Invoices & Bills',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Cashbook (Rokad)',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Garment Inventory',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Spreadsheet: ${createRes.status} - ${errText}`);
  }

  const createdSheet = await createRes.json();
  const spreadsheetId = createdSheet.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare tabular data for each sheet
  // Sheet 1: Customer Khata
  const customerRows: any[][] = [
    ['Customer Name', 'Phone Number', 'Address / Area', 'Customer Category', 'Net Udhaar Balance (₹)', 'Khata Status', 'Created Date'],
    ...data.customers.map((c) => [
      c.name,
      c.phone || '-',
      c.address || '-',
      c.type === 'RETAIL_PARENT' ? 'Retail Parent' : c.type === 'WHOLESALE_BUYER' ? 'Wholesale Buyer' : 'Supplier',
      c.netBalance,
      c.netBalance > 0 ? 'Pending Udhaar (Store will receive)' : c.netBalance < 0 ? 'Advance / Store will pay' : 'All Settled (Nil)',
      new Date(c.createdAt || Date.now()).toLocaleDateString('en-IN'),
    ]),
  ];

  // Sheet 2: Khata Transactions
  const txRows: any[][] = [
    ['Transaction Date', 'Customer Name', 'Type (Gave Credit / Received Payment)', 'Amount (₹)', 'Payment Mode', 'Notes & Descriptions', 'Settled Status', 'Bill / Receipt #'],
    ...data.transactions.map((tx) => [
      new Date(tx.date || tx.timestamp).toLocaleString('en-IN'),
      tx.customerName || '-',
      tx.type === 'GAVE_CREDIT' ? 'Udhaar Diya (Credit Given)' : 'Jama Kiya (Payment Received)',
      tx.amount,
      tx.paymentMode || 'CASH',
      tx.description || '-',
      tx.isCleared ? 'SETTLED / CLEARED' : 'ACTIVE / OPEN',
      tx.billNumber || '-',
    ]),
  ];

  // Sheet 3: Invoices & Bills
  const invoiceRows: any[][] = [
    ['Invoice #', 'Invoice Date', 'Customer Name', 'Customer Phone', 'Items Count', 'Subtotal (₹)', 'Discount (₹)', 'Net Total (₹)', 'Payment Mode', 'State of Supply', 'Invoice Design Theme'],
    ...data.invoices.map((inv) => [
      inv.invoiceNumber,
      new Date(inv.date || inv.timestamp).toLocaleDateString('en-IN'),
      inv.customerName || 'Cash Walk-in',
      inv.customerPhone || '-',
      inv.items.length,
      inv.subtotal,
      inv.discountAmount || 0,
      inv.netTotal,
      inv.paymentMode || 'CASH',
      inv.stateOfSupply || 'Gujarat',
      inv.designTheme || 'modern_kids',
    ]),
  ];

  // Sheet 4: Cashbook (Rokad)
  const cashbookRows: any[][] = [
    ['Entry Date & Time', 'Flow Type', 'Category', 'Amount (₹)', 'Note / Remarks'],
    ...data.cashbook.map((e) => [
      new Date(e.timestamp).toLocaleString('en-IN'),
      e.type === 'CASH_IN' ? 'CASH IN (Income / Jama)' : 'CASH OUT (Expense / Nikala)',
      e.category || 'General',
      e.amount,
      e.note || '-',
    ]),
  ];

  // Sheet 5: Garment Inventory
  const inventoryRows: any[][] = [
    ['Garment Item Name', 'Item Code', 'Category', 'Available Sizes', 'Retail Price (₹)', 'Wholesale Price (₹)', 'Stock Quantity', 'Stock Status'],
    ...data.inventory.map((item) => [
      item.name,
      item.itemCode || '-',
      item.category,
      item.sizes.join(', '),
      item.retailPrice,
      item.wholesalePrice || item.retailPrice,
      item.stockQuantity,
      item.stockQuantity === 0 ? 'Out of Stock' : item.stockQuantity <= 3 ? 'Low Stock' : 'In Stock',
    ]),
  ];

  // 3. Batch Update Values into Spreadsheet
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Customer Khata'!A1",
            values: customerRows,
          },
          {
            range: "'Khata Transactions'!A1",
            values: txRows,
          },
          {
            range: "'Invoices & Bills'!A1",
            values: invoiceRows,
          },
          {
            range: "'Cashbook (Rokad)'!A1",
            values: cashbookRows,
          },
          {
            range: "'Garment Inventory'!A1",
            values: inventoryRows,
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.warn(`Data population warning: ${updateRes.status} - ${errText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: sheetTitle,
  };
}
