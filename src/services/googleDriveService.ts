import { DriveBackupItem, StoreBackupPayload } from '../types';

/**
 * Upload JSON backup directly to Google Drive via Drive v3 API
 */
export async function uploadBackupToDrive(
  data: StoreBackupPayload,
  accessToken: string,
  customName?: string
): Promise<{ id: string; name: string }> {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = customName || `ghanshyam_kids_wear_backup_${dateStr}.json`;
  const fileContent = JSON.stringify(data, null, 2);

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `Ghanshyam Kids Wear Cloud Backup - ${new Date().toLocaleString()}`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive backup upload failed: ${res.status} - ${errorText}`);
  }

  const result = await res.json();
  return { id: result.id, name: result.name };
}

/**
 * Upload a CSV file directly to Google Drive
 */
export async function uploadCsvToDrive(
  fileName: string,
  csvContent: string,
  accessToken: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const metadata = {
    name: fileName,
    mimeType: 'text/csv',
    description: `Ghanshyam Kids Wear CSV Export - Generated on ${new Date().toLocaleString()}`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/csv; charset=UTF-8\r\n\r\n' +
    csvContent +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive CSV upload failed: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Fetch list of backups created for Ghanshyam Kids Wear in Google Drive
 */
export async function listDriveBackups(
  accessToken: string
): Promise<DriveBackupItem[]> {
  const query = encodeURIComponent("trashed = false and (name contains 'ghanshyam' or name contains 'backup')");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=20`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list Google Drive files: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    createdTime: f.createdTime,
    modifiedTime: f.modifiedTime,
    size: f.size,
  }));
}

/**
 * Download and parse backup JSON file from Google Drive
 */
export async function downloadDriveBackup(
  fileId: string,
  accessToken: string
): Promise<StoreBackupPayload> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to download backup file: ${res.status} - ${errorText}`);
  }

  const json = await res.json();
  return json as StoreBackupPayload;
}

/**
 * Delete a backup file from Google Drive (Requires explicit confirmation beforehand)
 */
export async function deleteDriveFile(
  fileId: string,
  accessToken: string
): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`Failed to delete file from Google Drive: ${res.status} - ${errorText}`);
  }
}
