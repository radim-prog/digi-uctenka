import { GoogleGenerativeAI } from '@google/generative-ai';
import { BankStatementData } from './types';
import { validateAndFormatDate } from './validation';

export async function extractBankStatementData(pdfBase64: string): Promise<BankStatementData> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY není nastavený v environment variables');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Analyzuj tento bankovní výpis v PDF formátu a vytěž z něj VŠECHNY bankovní transakce.

KRITICKÉ PRAVIDLA:
1. Vrať POUZE validní JSON, žádný jiný text
2. Vytěž KAŽDOU transakci z výpisu (příchozí i odchozí platby)
3. Datum ve formátu YYYY-MM-DD
4. Částka jako číslo (kladné pro příchozí, záporné pro odchozí)
5. Variabilní/konstantní/specifický symbol - pokud jsou uvedené
6. Číslo účtu protistrany - pokud je uvedené
7. Název protistrany (plátce/příjemce)
8. Popis transakce (zpráva pro příjemce, účel platby)

TYPY TRANSAKCÍ:
- "incoming" = příchozí platba (kredit, připsáno na účet)
- "outgoing" = odchozí platba (debet, odepsáno z účtu)

JSON STRUKTURA:
{
  "transactions": [
    {
      "datum": "2025-01-15",
      "castka": 15000.50,
      "typ": "incoming",
      "variabilni_symbol": "2025001",
      "konstantni_symbol": "0308",
      "specificke_symbol": null,
      "nazev_protiuctu": "ACME s.r.o.",
      "cislo_protiuctu": "123456789/0100",
      "popis": "Úhrada faktury č. 2025001"
    },
    {
      "datum": "2025-01-16",
      "castka": -5000.00,
      "typ": "outgoing",
      "variabilni_symbol": "202500123",
      "konstantni_symbol": null,
      "specificke_symbol": null,
      "nazev_protiuctu": "Dodavatel XYZ",
      "cislo_protiuctu": "987654321/0800",
      "popis": "Úhrada faktury"
    }
  ],
  "confidence": 0.95
}

DŮLEŽITÉ POZNÁMKY:
- Ignoruj souhrnné řádky (počáteční zůstatek, konečný zůstatek, součty)
- Zpracuj POUZE jednotlivé transakce
- Pokud není VS/KS/SS, dej null (ne prázdný string)
- Pokud není číslo účtu, dej null
- confidence: 0-1, jak si jsi jistý extrakcí

PŘÍKLADY RŮZNÝCH FORMÁTŮ VÝPISŮ:
- Komerční banka, Česká spořitelna, ČSOB, Fio banka, Air Bank, atd.
- Datum může být DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD
- Částky mohou být "1 500,50 Kč" nebo "1.500,50" nebo "1500.50"
- Odstraň formátování (mezery, Kč, atd.) a převeď na číslo

Vrať POUZE validní JSON, začínající { a končící }.`;

  try {
    const pdfPart = {
      inlineData: {
        data: pdfBase64,
        mimeType: 'application/pdf',
      },
    };

    const result = await model.generateContent([prompt, pdfPart]);
    const response = await result.response;
    const responseText = response.text();

    // Extrahuj JSON z odpovědi
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI nevrátila validní JSON odpověď');
    }

    const parsedData = JSON.parse(jsonMatch[0]) as BankStatementData;

    // Validace a čištění dat
    return cleanAndValidateBankData(parsedData);

  } catch (error: any) {
    if (error.message?.includes('quota')) {
      throw new Error('Překročen limit API volání. Zkus to za chvíli.');
    }
    if (error.message?.includes('API_KEY')) {
      throw new Error('Neplatný Gemini API klíč. Zkontroluj nastavení.');
    }
    throw new Error(`Chyba při OCR bankovního výpisu: ${error.message}`);
  }
}

// Validace a čištění dat
function cleanAndValidateBankData(data: any): BankStatementData {
  const transactions = (data.transactions || []).map((t: any) => {
    // Čištění částky - odstraň formátování
    let castka = t.castka;
    if (typeof castka === 'string') {
      castka = castka
        .replace(/\s/g, '') // Odstraň mezery
        .replace(/Kč/g, '') // Odstraň "Kč"
        .replace(/,/g, '.'); // Nahraď čárku tečkou
      castka = parseFloat(castka);
    }

    return {
      datum: validateAndFormatDate(t.datum),
      castka: parseFloat(castka) || 0,
      typ: t.typ === 'incoming' ? 'incoming' : 'outgoing',
      variabilni_symbol: t.variabilni_symbol ? String(t.variabilni_symbol).trim() : undefined,
      konstantni_symbol: t.konstantni_symbol ? String(t.konstantni_symbol).trim() : undefined,
      specificke_symbol: t.specificke_symbol ? String(t.specificke_symbol).trim() : undefined,
      nazev_protiuctu: t.nazev_protiuctu || 'Neznámý',
      cislo_protiuctu: t.cislo_protiuctu || undefined,
      popis: t.popis || '',
    };
  });

  return {
    transactions,
    confidence: data.confidence || 0.8,
  };
}
