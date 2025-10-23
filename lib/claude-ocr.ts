import Anthropic from '@anthropic-ai/sdk';
import { DokladData } from './types';
import { cleanICO, cleanDIC, validateAndFormatDate } from './validation';

export async function extractDokladData(imageBase64: string): Promise<DokladData> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY není nastavený v environment variables');
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Analyzuj tento český účetní doklad (fakturu, účtenku nebo daňový doklad) a vytěž z něj strukturovaná data.

KRITICKÉ PRAVIDLA:
1. Vrať POUZE validní JSON, žádný jiný text
2. Pokud pole nenajdeš na dokladu, vrať null (ne prázdný string)
3. Částky vrať jako čísla bez měnového symbolu (použij tečku jako oddělovač desetinných míst)
4. Data ve formátu YYYY-MM-DD
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
  "datum_duzp": "2025-01-15",
  "datum_splatnosti": "2025-01-29",
  "celkova_castka": 1500.50,
  "mena": "CZK",
  "zaklad_dane_21": 1239.67,
  "dph_21": 260.33,
  "zaklad_dane_12": 0,
  "dph_12": 0,
  "zaklad_dane_0": 0,
  "typ_dokladu": "faktura_prijata",
  "forma_uhrady": "prevod",
  "bankovni_ucet_dodavatele": "123456789/0100",
  "confidence": 0.95
}

POZNÁMKY:
- confidence: 0-1, jak si jsi jistý extrakcí (0.9+ = vysoká jistota)
- Pokud je účtenka v angličtině, překládej názvy do češtiny
- U účtenek z benzinek/obchodů často chybí IČO/DIČ - dej null
- VŽDY zkontroluj že součet základů + DPH = celková částka

Vrať POUZE validní JSON, začínající { a končící }.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.2, // Nízká teplota pro konzistentní výsledky
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Extrahuj JSON z odpovědi (i když je tam nějaký extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI nevrátila validní JSON odpověď');
    }

    const parsedData = JSON.parse(jsonMatch[0]) as DokladData;

    // Validace a čištění dat
    return cleanAndValidateData(parsedData);

  } catch (error: any) {
    if (error.message?.includes('rate_limit')) {
      throw new Error('Překročen limit API volání. Zkus to za chvíli.');
    }
    if (error.message?.includes('invalid_api_key')) {
      throw new Error('Neplatný Anthropic API klíč. Zkontroluj nastavení.');
    }
    throw new Error(`Chyba při OCR: ${error.message}`);
  }
}

// Validace a čištění dat
function cleanAndValidateData(data: any): DokladData {
  // Výchozí hodnoty
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
    datum_duzp: validateAndFormatDate(data.datum_duzp) || validateAndFormatDate(data.datum_vystaveni),
    datum_splatnosti: data.datum_splatnosti ? validateAndFormatDate(data.datum_splatnosti) : undefined,
    celkova_castka: parseFloat(data.celkova_castka) || 0,
    mena: data.mena || 'CZK',
    zaklad_dane_21: data.zaklad_dane_21 ? parseFloat(data.zaklad_dane_21) : undefined,
    dph_21: data.dph_21 ? parseFloat(data.dph_21) : undefined,
    zaklad_dane_12: data.zaklad_dane_12 ? parseFloat(data.zaklad_dane_12) : undefined,
    dph_12: data.dph_12 ? parseFloat(data.dph_12) : undefined,
    zaklad_dane_0: data.zaklad_dane_0 ? parseFloat(data.zaklad_dane_0) : undefined,
    typ_dokladu: data.typ_dokladu || 'uctenka',
    forma_uhrady: data.forma_uhrady || undefined,
    bankovni_ucet_dodavatele: data.bankovni_ucet_dodavatele || undefined,
    confidence: data.confidence || 0.8,
  };

  return cleaned;
}
