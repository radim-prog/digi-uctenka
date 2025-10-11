import { google } from 'googleapis';
import { UploadResult } from './types';

export async function uploadToGoogleDrive(
  imageBase64: string,
  fileName: string,
  firmaNazev: string,
  year: string
): Promise<UploadResult> {
  try {
    // Validace environment variable
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY není nastaven');
    }

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata',
      ],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Vytvoř strukturu složek: /Digi-Uctenka/FirmaNazev/2025/
    const rootFolderId = await getOrCreateFolder(drive, 'Digi-Uctenka', null);
    const firmaFolderId = await getOrCreateFolder(drive, sanitizeFolderName(firmaNazev), rootFolderId);
    const yearFolderId = await getOrCreateFolder(drive, year, firmaFolderId);

    // Převeď base64 na buffer
    const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    // Upload souboru
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [yearFolderId],
        description: `Doklad nahraný přes Digi-Účtenka aplikaci`,
      },
      media: {
        mimeType: 'image/jpeg',
        body: Buffer.from(imageBuffer),
      },
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = response.data.id!;

    // Nastav oprávnění na "anyone with link can view"
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Získej view link
    const file = await drive.files.get({
      fileId,
      fields: 'webViewLink',
    });

    return {
      success: true,
      fileId,
      webViewLink: file.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    };

  } catch (error: any) {
    console.error('Google Drive upload error:', error);
    return {
      success: false,
      fileId: '',
      webViewLink: '',
      error: error.message,
    };
  }
}

// Pomocná funkce pro vytvoření nebo nalezení složky
async function getOrCreateFolder(
  drive: any,
  folderName: string,
  parentId: string | null
): Promise<string> {
  try {
    // Zkus najít existující složku
    const query = parentId
      ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const existing = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (existing.data.files && existing.data.files.length > 0) {
      return existing.data.files[0].id;
    }

    // Vytvoř novou složku
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : [],
      },
      fields: 'id',
    });

    return folder.data.id!;

  } catch (error) {
    throw new Error(`Chyba při vytváření složky ${folderName}: ${error}`);
  }
}

// Sanitize názvu složky (odstraň nebezpečné znaky)
function sanitizeFolderName(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '-') // Nahraď nebezpečné znaky
    .replace(/\s+/g, '_') // Mezery na podtržítka
    .substring(0, 100); // Max délka 100 znaků
}
