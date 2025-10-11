import { google } from 'googleapis';
import { ExportResult } from './types';

export async function exportToGoogleSheets(doklad: any): Promise<ExportResult> {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY není nastaven');
    }

    if (!process.env.GOOGLE_SHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID není nastaven');
    }

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Nejdřív zkontroluj jestli existuje sheet "Doklady", jinak ho vytvoř
    await ensureSheetExists(sheets, spreadsheetId);

    // Připrav řádek dat (v pořadí dle Pohoda importu)
    const row = [
      doklad.id, // ID záznamu
      new Date().toISOString(), // Datum vložení
      doklad.userId, // Email uživatele
      doklad.typ_dokladu, // Typ dokladu

      // Odběratel
      doklad.odberatel_nazev,
      doklad.odberatel_ico,
      doklad.odberatel_dic,
      doklad.odberatel_adresa,

      // Dodavatel
      doklad.dodavatel_nazev,
      doklad.dodavatel_ico,
      doklad.dodavatel_dic,
      doklad.dodavatel_adresa || '',

      // Čísla a symboly
      doklad.cislo_dokladu,
      doklad.variabilni_symbol,
      doklad.konstantni_symbol || '',
      doklad.specificke_symbol || '',

      // Data
      doklad.datum_vystaveni,
      doklad.datum_zdanitelneho_plneni,
      doklad.datum_splatnosti || '',

      // Částky
      doklad.celkova_castka,
      doklad.mena,
      doklad.zaklad_dane_21 || '',
      doklad.dph_21 || '',
      doklad.zaklad_dane_12 || '',
      doklad.dph_12 || '',
      doklad.zaklad_dane_0 || '',

      // Platba
      doklad.forma_uhrady || '',
      doklad.bankovni_ucet_dodavatele || '',

      // Metadata
      doklad.originalImageUrl,
      doklad.status,
      doklad.aiConfidence || '',
    ];

    // Append řádku do sheetu
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Doklady!A:AF',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });

    // Zjisti číslo řádku
    const updatedRange = response.data.updates?.updatedRange;
    const rowNumber = updatedRange ? parseInt(updatedRange.split('!A')[1].split(':')[0]) : undefined;

    return { success: true, rowNumber };

  } catch (error: any) {
    console.error('Google Sheets export error:', error);
    return { success: false, error: error.message };
  }
}

// Zajisti že existuje sheet "Doklady" s hlavičkou
async function ensureSheetExists(sheets: any, spreadsheetId: string) {
  try {
    // Zkus získat metadata sheetu
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheet.data.sheets?.some(
      (sheet: any) => sheet.properties.title === 'Doklady'
    );

    if (!sheetExists) {
      // Vytvoř nový sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Doklady',
                  gridProperties: {
                    frozenRowCount: 1, // Zamkni hlavičku
                  },
                },
              },
            },
          ],
        },
      });

      // Přidej hlavičku
      const header = [
        'ID', 'Datum vložení', 'Uživatel', 'Typ dokladu',
        'Odběratel název', 'Odběratel IČO', 'Odběratel DIČ', 'Odběratel adresa',
        'Dodavatel název', 'Dodavatel IČO', 'Dodavatel DIČ', 'Dodavatel adresa',
        'Číslo dokladu', 'Variabilní symbol', 'Konstantní symbol', 'Specifický symbol',
        'Datum vystavení', 'Datum zdanit. plnění', 'Datum splatnosti',
        'Celková částka', 'Měna',
        'Základ 21%', 'DPH 21%', 'Základ 12%', 'DPH 12%', 'Základ 0%',
        'Forma úhrady', 'Bankovní účet dodavatele',
        'Link na doklad', 'Status', 'AI Confidence'
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Doklady!A1:AF1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [header],
        },
      });

      // Naformátuj hlavičku (tučně, modrá)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring sheet exists:', error);
    throw error;
  }
}

// Funkce pro export všech dokladů (pro backup)
export async function exportAllDokladyToSheets(doklady: any[]): Promise<{ success: boolean; count: number }> {
  let successCount = 0;

  for (const doklad of doklady) {
    const result = await exportToGoogleSheets(doklad);
    if (result.success) successCount++;

    // Rate limiting - pauza mezi requesty
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success: true, count: successCount };
}
