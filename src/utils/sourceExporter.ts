import JSZip from 'jszip';
import { PROJECT_SOURCE_FILES } from './projectFilesSnapshot';

export interface ExportProgress {
  percent: number;
  message: string;
}

/**
 * Packages the entire Ghanshyam Kids Wear codebase into a client-side ZIP
 * archive using JSZip and triggers a download as 'ghanshyam-kids-wear-source.zip'.
 */
export async function downloadProjectSourceZip(
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  try {
    if (onProgress) {
      onProgress({ percent: 10, message: 'Preparing project source tree...' });
    }

    const zip = new JSZip();

    // 1. Bundle all project source files from the codebase snapshot
    const fileEntries = Object.entries(PROJECT_SOURCE_FILES);
    const totalFiles = fileEntries.length;

    let addedCount = 0;
    for (const [filePath, content] of fileEntries) {
      zip.file(filePath, content);
      addedCount++;
      if (onProgress && addedCount % 5 === 0) {
        const filePercent = 10 + Math.floor((addedCount / totalFiles) * 40);
        onProgress({
          percent: filePercent,
          message: `Archiving ${filePath}...`,
        });
      }
    }

    // 2. Ensure critical Capacitor and GitHub Action files are always guaranteed
    if (!zip.file('capacitor.config.json')) {
      zip.file(
        'capacitor.config.json',
        JSON.stringify(
          {
            appId: 'com.ghanshyam.kidswear',
            appName: 'Ghanshyam Kids Wear',
            webDir: 'dist',
            server: {
              androidScheme: 'https',
            },
          },
          null,
          2
        )
      );
    }

    if (!zip.file('.github/workflows/build-apk.yml')) {
      zip.file(
        '.github/workflows/build-apk.yml',
        `name: Build Android APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Build Android Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'gradle'

      - name: Install dependencies
        run: npm install

      - name: Build web app
        run: npm run build

      - name: Setup Capacitor Android & Sync Assets
        run: |
          npx cap add android || true
          npx cap sync android

      - name: Grant execute permission for Gradlew
        run: |
          if [ -f android/gradlew ]; then
            chmod +x android/gradlew
          fi

      - name: Assemble Debug APK
        run: |
          cd android
          ./gradlew assembleDebug

      - name: Upload Debug APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error
`
      );
    }

    if (onProgress) {
      onProgress({ percent: 60, message: 'Compressing zip package...' });
    }

    // 3. Generate the ZIP blob with Deflate compression
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6,
        },
      },
      (metadata) => {
        if (onProgress) {
          const zipPercent = 60 + Math.floor(metadata.percent * 0.38);
          onProgress({
            percent: Math.min(98, zipPercent),
            message: `Compressing package (${Math.round(metadata.percent)}%)...`,
          });
        }
      }
    );

    if (onProgress) {
      onProgress({ percent: 100, message: 'Starting download...' });
    }

    // 4. Trigger download as ghanshyam-kids-wear-source.zip
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'ghanshyam-kids-wear-source.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 2000);
  } catch (error) {
    console.error('Failed to generate and download project ZIP archive:', error);
    throw error;
  }
}
