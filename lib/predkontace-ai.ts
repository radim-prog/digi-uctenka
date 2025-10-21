import { GoogleGenerativeAI } from '@google/generative-ai';
import { Doklad } from './types';

interface PredkontaceResult {
  predkontace: string;
  predkontace_md: string;
  predkontace_d: string;
}

/**
 * Použije AI k automatickému určení předkontace na základě dat dokladu
 *
 * Kompletní pravidla jsou v: docs/UCETNI-PRAVIDLA.md
 * Právní rámec: Vyhláška č. 500/2002 Sb. a Zákon o účetnictví č. 563/1991 Sb.
 */
export async function generatePredkontace(doklad: Partial<Doklad>): Promise<PredkontaceResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY není nastavený');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Jsi expert na české podvojné účetnictví podle vyhlášky č. 500/2002 Sb.

📋 INFORMACE O DOKLADU:
- Typ dokladu: ${doklad.typ_dokladu || 'neznámý'}
- Dodavatel: ${doklad.dodavatel_nazev || 'neznámý'}
- Částka: ${doklad.celkova_castka || 0} ${doklad.mena || 'CZK'}
- Forma úhrady: ${doklad.forma_uhrady || 'neznámá'}
- Datum splatnosti: ${doklad.datum_splatnosti || 'NENÍ'}
- Položky: ${doklad.polozky?.map(p => p.nazev).join(', ') || 'žádné'}

═══════════════════════════════════════════════════════════════════════
🎯 ROZHODOVACÍ PROCES (postupuj krok za krokem):
═══════════════════════════════════════════════════════════════════════

KROK 1: Určení PŘEDKONTACE (číselná řada)
├─ Má doklad DATUM SPLATNOSTI?
│  ├─ ANO → predkontace: "3Fv" (přijatá faktura)
│  └─ NE → predkontace: "UD" (účtenka/okamžitá úhrada)

KROK 2: Určení MD (MÁ DÁTI) podle OBSAHU nákupu
├─ Pohonné hmoty (benzín, nafta, oleje) → "501"
├─ Kancelářské potřeby (papír, tonery) → "501"
├─ Elektřina, plyn, voda → "502"
├─ Prodané zboží (obchod) → "504"
├─ Oprava auta, stroje → "511"
├─ Jízdenky, dálnice, parkování, ubytování → "512"
├─ Oběd s klientem, dárky partnerům → "513"
├─ Nájemné, telefon, internet, software, právní služby, marketing → "518"
├─ Auto, stroj (> 40 000 Kč) → "042"
└─ Ostatní materiál → "501"

KROK 3: Určení D (DAL) podle SPLATNOSTI a FORMY ÚHRADY
├─ Má datum splatnosti (krok 1)?
│  ├─ ANO → "321" (Dodavatelé - závazek)
│  └─ NE → Podle formy úhrady:
│         ├─ "hotove" → "211" (Pokladna)
│         ├─ "karta" → "261" (Peníze na cestě)
│         └─ "prevod" → "221" (Bankovní účet)

═══════════════════════════════════════════════════════════════════════
⚠️ KRITICKÁ PRAVIDLA (dodržuj VŽDY):
═══════════════════════════════════════════════════════════════════════

1. **DATUM SPLATNOSTI je klíčové:**
   - Má datum splatnosti → D: "321" (Dodavatelé)
   - Nemá datum splatnosti → D: "211/221/261" (podle formy úhrady)

   ❌ NIKDY 211/221/261 pokud má datum splatnosti!
   ✅ VŽDY 321 pokud má datum splatnosti!

2. **PENÍZE NA CESTĚ (261) POUZE pro karty:**
   - ✅ forma_uhrady: "karta" → D: "261"
   - ❌ forma_uhrady: "hotove" → D: "211" (ne 261!)
   - ❌ forma_uhrady: "prevod" → D: "221" (ne 261!)

3. **REPREZENTACE vs CESTOVNÉ:**
   - Jídlo s klientem → "513" (Reprezentace)
   - Jídlo zaměstnance na cestě → "512" (Cestovné)
   - Jízdenky, parkování → "512" (Cestovné)

4. **POHONNÉ HMOTY = MATERIÁL:**
   - Benzín, nafta → "501" (ne 518!)

═══════════════════════════════════════════════════════════════════════
📚 ÚČTOVÁ OSNOVA (hlavní účty):
═══════════════════════════════════════════════════════════════════════

MAJETEK (aktivní):
- 211: Pokladna (hotovost)
- 221: Bankovní účet
- 261: Peníze na cestě (POUZE karty!)
- 311: Odběratelé (pohledávky)

ZÁVAZKY (pasivní):
- 321: Dodavatelé (závazky)

NÁKLADY:
- 501: Spotřeba materiálu (pohonné hmoty, kancelář, DHM)
- 502: Spotřeba energie (elektřina, plyn, voda)
- 504: Prodané zboží
- 511: Opravy a udržování
- 512: Cestovné (jízdenky, parkování, ubytování)
- 513: Reprezentace (občerstvení klientů, dárky)
- 518: Ostatní služby (nájemné, telefon, software, právní služby)

VÝNOSY:
- 601: Tržby za vlastní výrobky
- 602: Tržby za služby
- 604: Tržby za zboží

═══════════════════════════════════════════════════════════════════════
📋 FORMÁT ODPOVĚDI:
═══════════════════════════════════════════════════════════════════════

Vrať POUZE validní JSON ve formátu:

PŘÍKLAD 1 (přijatá faktura):
{
  "predkontace": "3Fv",
  "predkontace_md": "518",
  "predkontace_d": "321"
}

PŘÍKLAD 2 (účtenka kartou):
{
  "predkontace": "UD",
  "predkontace_md": "501",
  "predkontace_d": "261"
}

PŘÍKLAD 3 (účtenka hotově):
{
  "predkontace": "UD",
  "predkontace_md": "512",
  "predkontace_d": "211"
}

PŘÍKLAD 4 (nejasný případ):
{
  "predkontace": "NEVIM",
  "predkontace_md": "",
  "predkontace_d": ""
}

⚠️ DŮLEŽITÉ: Pokud si NEJSI JISTÝ správnou předkontací, vrať:
- predkontace: "NEVIM"
- predkontace_md: ""
- predkontace_d: ""

Lepší je přiznat nejistotu než zaúčtovat ŠPATNĚ!

Začni { a skonči }.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Extrahuj JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI nevrátila validní JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]) as PredkontaceResult;

    return {
      predkontace: parsed.predkontace || '3Fv',
      predkontace_md: parsed.predkontace_md || '',
      predkontace_d: parsed.predkontace_d || '',
    };
  } catch (error: any) {
    console.error('Chyba při generování předkontace:', error);
    // Fallback na výchozí hodnoty
    return {
      predkontace: '3Fv',
      predkontace_md: '',
      predkontace_d: '',
    };
  }
}
