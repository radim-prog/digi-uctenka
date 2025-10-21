import { GoogleGenerativeAI } from '@google/generative-ai';
import { DokladData } from './types';
import { cleanICO, cleanDIC, validateAndFormatDate } from './validation';

export async function extractDokladData(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<DokladData> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY není nastavený v environment variables');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Použij nejnovější dostupný model
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Analyzuj tento český účetní doklad (fakturu, účtenku nebo daňový doklad) a vytěž z něj strukturovaná data.

KRITICKÉ PRAVIDLA:
1. Vrať POUZE validní JSON, žádný jiný text
2. Pokud pole nenajdeš na dokladu, vrať null (ne prázdný string)
3. Částky vrať jako čísla bez měnového symbolu (použij tečku jako oddělovač desetinných míst)
4. Data ve formátu YYYY-MM-DD:
   - Hledej VŠECHNY možné formáty na dokladu: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY, D.M.YYYY, D. M. YYYY
   - Převeď VŽDY na YYYY-MM-DD
   - Příklady: "21.10.2025" → "2025-10-21", "15/11/25" → "2025-11-15", "1. 12. 2024" → "2024-12-01"
   - DŮLEŽITÉ: Rok 25 = 2025, rok 24 = 2024 (ne 1925!)
   - Hledej klíčová slova: "Datum vystavení", "Vystaveno dne", "Splatnost", "DUZP", "Datum zdanitelného plnění"
5. IČO musí být 8 číslic (string)
6. DIČ formát: CZ + 8-10 číslic (string)
7. Pokud není DUZP (datum zdanitelného plnění), použij datum vystavení
8. Pokud není variabilní symbol, použij číslo dokladu
9. Rozpoznej typ dokladu podle obsahu:
   - "faktura_prijata" = má IČO dodavatele, číslo faktury, datum splatnosti
   - "uctenka" = běžná účtenka z obchodu/benzinky
   - "danovy_doklad" = zjednodušený daňový doklad
   - "zalohova_faktura" = obsahuje slovo "záloha" nebo "zálohová faktura"

10. Sumy DPH MUSÍ souhlasit: zaklad_21 + dph_21 + zaklad_12 + dph_12 + zaklad_0 = celkova_castka

11. **DŮLEŽITÉ**: Vytěž VŠECHNY řádkové položky z dokladu! Například:
    - Na benzince: nafta, sušenky, káva (každá může mít jinou sazbu DPH)
    - Na faktuře: služby, zboží (každá položka zvlášť)
    - Každá položka MUSÍ mít správnou sazbu DPH (21%, 12%, nebo 0%)

JSON STRUKTURA (zkopíruj přesně):
{
  "dodavatel_nazev": "název firmy dodavatele nebo obchodu",
  "dodavatel_ico": "12345678",
  "dodavatel_dic": "CZ12345678",
  "dodavatel_adresa": "ulice, město, PSČ",
  "cislo_dokladu": "číslo faktury/účtenky/dokladu",
  "variabilni_symbol": "VS nebo číslo dokladu",
  "konstantni_symbol": "0308",
  "specificke_symbol": null,
  "datum_vystaveni": "2025-01-15",
  "datum_zdanitelneho_plneni": "2025-01-15",
  "datum_splatnosti": "2025-01-29",
  "celkova_castka": 1500.50,
  "mena": "CZK",
  "zaklad_dane_21": 1239.67,
  "dph_21": 260.33,
  "zaklad_dane_12": 0,
  "dph_12": 0,
  "zaklad_dane_0": 0,
  "polozky": [
    {
      "nazev": "Nafta Natural 95",
      "mnozstvi": 45.5,
      "jednotka": "l",
      "cena_za_jednotku": 35.90,
      "zaklad_dane": 1350.00,
      "sazba_dph": 21,
      "dph": 283.50,
      "celkem_s_dph": 1633.50
    },
    {
      "nazev": "Sušenky Opavia",
      "mnozstvi": 1,
      "jednotka": "ks",
      "cena_za_jednotku": 45.00,
      "zaklad_dane": 40.18,
      "sazba_dph": 12,
      "dph": 4.82,
      "celkem_s_dph": 45.00
    }
  ],
  "typ_dokladu": "uctenka",
  "forma_uhrady": "hotove",
  "bankovni_ucet_dodavatele": null,
  "confidence": 0.95
}

POZNÁMKY:
- confidence: 0-1, jak si jsi jistý extrakcí (0.9+ = vysoká jistota)
- Pokud je účtenka v angličtině, překládej názvy do češtiny
- U účtenek z benzinek/obchodů často chybí IČO/DIČ - dej null
- VŽDY zkontroluj že součet základů + DPH = celková částka
- VŽDY vytěž VŠECHNY položky z dokladu do pole "polozky"
- Pokud na dokladu nejsou žádné položky rozepsané, vrať prázdné pole []
- Sumy položek MUSÍ dávat dohromady celkovou částku
- **FORMA ÚHRADY**: Hledej na dokladu slova jako "HOTOVĚ", "V HOTOVOSTI", "KARTA", "PLATEBNÍ KARTA", "BANKOVNÍ PŘEVOD", "PŘÍKAZ K ÚHRADĚ"
  - Pokud vidíš "HOTOVĚ" nebo "V HOTOVOSTI" → "hotove"
  - Pokud vidíš "KARTA" nebo "PLATEBNÍ KARTA" → "karta"
  - Pokud vidíš číslo účtu nebo "BANKOVNÍ PŘEVOD" → "prevod"
  - Pokud není uvedeno, ale je číslo účtu dodavatele → "prevod"
  - Pokud není nic uvedeno → null

Vrať POUZE validní JSON, začínající { a končící }.`;

  try {
    // Převeď base64 na Gemini formát (podporuje PDF i obrázky)
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const responseText = response.text();

    // Extrahuj JSON z odpovědi
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI nevrátila validní JSON odpověď');
    }

    const parsedData = JSON.parse(jsonMatch[0]) as DokladData;

    // Validace a čištění dat
    return cleanAndValidateData(parsedData);

  } catch (error: any) {
    if (error.message?.includes('quota')) {
      throw new Error('Překročen limit API volání. Zkus to za chvíli.');
    }
    if (error.message?.includes('API_KEY')) {
      throw new Error('Neplatný Gemini API klíč. Zkontroluj nastavení.');
    }
    throw new Error(`Chyba při OCR: ${error.message}`);
  }
}

// Validace a čištění dat
function cleanAndValidateData(data: any): DokladData {
  const cleaned: DokladData = {
    dodavatel_nazev: data.dodavatel_nazev || '',
    dodavatel_ico: cleanICO(data.dodavatel_ico),
    dodavatel_dic: cleanDIC(data.dodavatel_dic),
    dodavatel_adresa: data.dodavatel_adresa || undefined,
    cislo_dokladu: data.cislo_dokladu || 'N/A',
    variabilni_symbol: data.variabilni_symbol || data.cislo_dokladu || '',
    konstantni_symbol: data.konstantni_symbol || undefined,
    specificke_symbol: data.specificke_symbol || undefined,
    datum_vystaveni: validateAndFormatDate(data.datum_vystaveni),
    datum_zdanitelneho_plneni: validateAndFormatDate(data.datum_zdanitelneho_plneni) || validateAndFormatDate(data.datum_vystaveni),
    datum_splatnosti: data.datum_splatnosti ? validateAndFormatDate(data.datum_splatnosti) : undefined,
    celkova_castka: parseFloat(data.celkova_castka) || 0,
    mena: data.mena || 'CZK',
    zaklad_dane_21: data.zaklad_dane_21 ? parseFloat(data.zaklad_dane_21) : undefined,
    dph_21: data.dph_21 ? parseFloat(data.dph_21) : undefined,
    zaklad_dane_12: data.zaklad_dane_12 ? parseFloat(data.zaklad_dane_12) : undefined,
    dph_12: data.dph_12 ? parseFloat(data.dph_12) : undefined,
    zaklad_dane_0: data.zaklad_dane_0 ? parseFloat(data.zaklad_dane_0) : undefined,
    polozky: data.polozky && Array.isArray(data.polozky)
      ? data.polozky.map((p: any) => ({
          nazev: p.nazev || '',
          mnozstvi: parseFloat(p.mnozstvi) || 0,
          jednotka: p.jednotka || 'ks',
          cena_za_jednotku: parseFloat(p.cena_za_jednotku) || 0,
          zaklad_dane: parseFloat(p.zaklad_dane) || 0,
          sazba_dph: p.sazba_dph === 12 ? 12 : p.sazba_dph === 0 ? 0 : 21,
          dph: parseFloat(p.dph) || 0,
          celkem_s_dph: parseFloat(p.celkem_s_dph) || 0,
        }))
      : undefined,
    typ_dokladu: data.typ_dokladu || 'uctenka',
    forma_uhrady: data.forma_uhrady || undefined,
    bankovni_ucet_dodavatele: data.bankovni_ucet_dodavatele || undefined,
    confidence: data.confidence || 0.8,
  };

  return cleaned;
}

// Retry OCR pro chybějící pole
export async function retryMissingFields(
  imageBase64: string,
  mimeType: string,
  missingFields: string[]
): Promise<Partial<DokladData>> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY není nastavený v environment variables');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Mapování polí na jejich popisky
  const fieldDescriptions: Record<string, string> = {
    datum_vystaveni: 'Datum vystavení, Vystaveno dne, Datum vytvoření, Date',
    datum_splatnosti: 'Splatnost, Datum splatnosti, Splatno dne, Due date',
    datum_zdanitelneho_plneni: 'DUZP, Datum zdanitelného plnění, Datum plnění, Tax point date',
    cislo_dokladu: 'Číslo dokladu, Faktura č., Číslo faktury, Invoice no., Doklad č.',
    dodavatel_ico: 'IČO, IČ, Identifikační číslo, IC, Company ID',
    dodavatel_dic: 'DIČ, DIC, Daňové identifikační číslo, VAT ID, Tax ID',
    variabilni_symbol: 'Variabilní symbol, VS, Variable symbol',
  };

  const prompt = `Analyzuj tento doklad a NAJDI POUZE TYTO CHYBĚJÍCÍ HODNOTY:

${missingFields.map(field => `- ${field}: Hledej "${fieldDescriptions[field]}"`).join('\n')}

DŮLEŽITÁ PRAVIDLA PRO DATUMY:
- Hledej datum ve VŠECH možných formátech: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY, D.M.YYYY, D. M. YYYY
- Převeď VŽDY na formát YYYY-MM-DD
- Příklady: "21.10.2025" → "2025-10-21", "15/11/25" → "2025-11-15"
- Rok 25 = 2025, rok 24 = 2024 (ne 1925!)
- Pokud datum nenajdeš, vrať null

DŮLEŽITÁ PRAVIDLA PRO IČO/DIČ:
- IČO = přesně 8 číslic (string)
- DIČ = CZ + 8-10 číslic (string)
- Pokud nenajdeš, vrať null

Vrať POUZE validní JSON s těmito poli. Příklad:
{
  ${missingFields.map(f => `"${f}": ${f.includes('datum') ? '"2025-10-21"' : f.includes('ico') || f.includes('dic') ? '"12345678"' : '"hodnota"'}`).join(',\n  ')}
}`;

  try {
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const responseText = response.text();

    console.log('🔄 Retry OCR response:', responseText.substring(0, 200));

    // Extrahuj JSON z odpovědi
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ Retry OCR nevrátila validní JSON');
      return {};
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Validace dat
    const validated: Partial<DokladData> = {};
    for (const field of missingFields) {
      if (parsedData[field]) {
        if (field.includes('datum')) {
          validated[field as keyof DokladData] = validateAndFormatDate(parsedData[field]) as any;
        } else if (field === 'dodavatel_ico') {
          validated.dodavatel_ico = cleanICO(parsedData[field]);
        } else if (field === 'dodavatel_dic') {
          validated.dodavatel_dic = cleanDIC(parsedData[field]);
        } else {
          validated[field as keyof DokladData] = parsedData[field];
        }
      }
    }

    console.log('✅ Retry OCR validated data:', validated);
    return validated;

  } catch (error: any) {
    console.error('❌ Retry OCR error:', error.message);
    throw new Error(`Chyba při retry OCR: ${error.message}`);
  }
}
