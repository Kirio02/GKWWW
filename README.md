# Ghanshyam Kids Wear

Smart Digital Khata, Boutique POS, Kids Wear Inventory Catalog, and AI Voice Store Manager.
Engineered by Kirio Ken.

## Features
- **Smart Digital Khata Ledger**: Customer balances, credit/debit entries, manual tick to cancel out, payment reminders with isolated statement sharing via WhatsApp and SMS.
- **Kids Wear Inventory Catalog**: Garment sizing (0-6M, 1-2Y, 2-4Y, 6-8Y, etc.), low stock alerts, stock quantity steppers.
- **POS Billing & Invoicing**: Fast counter checkout with 4 signature invoice themes (Modern Kids Boutique, Classic Retail GST, Royal Blue Letterhead, and Compact Thermal 80mm slip).
- **Daily Cashbook (Rokad)**: Daily cash in / cash out drawer balance tracking.
- **Google Cloud Backup & Sheets**: Drive backups and direct export to formatted Google Sheets.
- **AI Voice Store Manager**: Hinglish and Hindi speech recognition to record entries and query statements.

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server
npm run dev

# 3. Build for production
npm run build
```

## Android App with Capacitor

This project is configured with Capacitor Android (App ID: `com.ghanshyam.kidswear`).

```bash
# Build web assets and sync to native Android
npm run cap:build

# Open native Android project in Android Studio
npm run cap:android
```

## Automated APK Builds (GitHub Actions)
The workflow at `.github/workflows/build-apk.yml` automatically builds the debug APK (`app-debug.apk`) on pushes or via manual trigger (`workflow_dispatch`).
