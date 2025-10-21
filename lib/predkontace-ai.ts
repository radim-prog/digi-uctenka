import { GoogleGenerativeAI } from '@google/generative-ai';
import { Doklad } from './types';

interface PredkontaceResult {
  predkontace: string;
  predkontace_md: string;
  predkontace_d: string;
}

/**
 * Použije AI k automatickému určení předkontace na základě dat dokladu
 */
export async function generatePredkontace(doklad: Partial<Doklad>): Promise<PredkontaceResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY není nastavený');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Jsi expert na české podvojné účetnictví a účtovou osnovu. Analyzuj tento účetní doklad a urči SPRÁVNOU předkontaci podle českých účetních pravidel.

INFORMACE O DOKLADU:
- Typ dokladu: ${doklad.typ_dokladu || 'neznámý'}
- Dodavatel: ${doklad.dodavatel_nazev || 'neznámý'}
- Celková částka: ${doklad.celkova_castka || 0} ${doklad.mena || 'CZK'}
- Forma úhrady: ${doklad.forma_uhrady || 'neznámá'}
- Datum splatnosti: ${doklad.datum_splatnosti || 'není'}
- Položky: ${doklad.polozky?.map(p => p.nazev).join(', ') || 'žádné'}

═══════════════════════════════════════════════════════════════════
ZÁKLADNÍ PRAVIDLA PODVOJNÉHO ÚČETNICTVÍ (ČESKÁ ÚČTOVÁ OSNOVA)
═══════════════════════════════════════════════════════════════════

1. **predkontace** (Číselná řada v Pohodě):
   - Přijatá faktura = "3Fv"
   - Vydaná faktura = "1Fv"
   - Účtenka/pokladní doklad = "UD"
   - Daňový doklad = "DD"
   - Opravný daňový doklad = "ODD"
   - Zálohová faktura přijatá = "3ZF"
   - Zálohová faktura vydaná = "1ZF"
   - Dobropis = "DB"

2. **MD (MÁ DÁTI)** - Co nabývá hodnoty / jaký náklad/majetek vzniká:

   **A) PŘIJATÉ FAKTURY (ještě nezaplacené):**
   Podle OBSAHU NÁKUPU (co je předmětem faktury):
   - Zboží na sklad = "131" (materiál na skladě)
   - Pohonné hmoty = "501" (spotřeba materiálu)
   - Kancelářské potřeby = "501" (spotřeba materiálu)
   - Energie (elektřina, plyn, voda) = "502" (spotřeba energie)
   - Prodané zboží (obchod) = "504" (prodané zboží)
   - Cestovné (jízdenky, dálnice, parkování) = "512" (cestovné)
   - Reprezentace (občerstvení klientů, dárky) = "513" (reprezentace)
   - Nájemné = "518" (ostatní služby)
   - Opravy a udržování = "511" (opravy a udržování)
   - Telekomunikace (telefon, internet) = "518" (ostatní služby)
   - Poradenství, právní služby = "518" (ostatní služby)
   - Marketing, reklama = "518" (ostatní služby)
   - Software, licence = "518" (ostatní služby)
   - Školení, vzdělávání = "518" (ostatní služby)
   - Dlouhodobý majetek (stroje, auta) = "042" (pořízení DHM)
   - Drobný hmotný majetek = "501" (spotřeba materiálu)

   **B) VYDANÉ FAKTURY:**
   - VŽDY = "311" (pohledávky - odběratelé)

   **C) ÚČTENKY/OKAMŽITÁ ÚHRADA:**
   - Stejné jako u přijatých faktur (podle obsahu)

3. **D (DAL)** - Co ztrácí hodnotu / odkud se to hradí:

   **A) PŘIJATÉ FAKTURY (má datum splatnosti, ještě není zaplaceno):**
   - VŽDY = "321" (závazky - dodavatelé)
   - DŮLEŽITÉ: Úhrada faktury se účtuje POZDĚJI při platbě!

   **B) ÚČTENKY / OKAMŽITÁ ÚHRADA (bez data splatnosti, zaplaceno na místě):**
   - "hotove" = "211" (pokladna)
   - "karta" = "261" (peníze na cestě - bankovní den +1)
   - "prevod" = "221" (bankovní účet)

   **C) VYDANÉ FAKTURY:**
   - Tržby za zboží = "604" (tržby za zboží)
   - Tržby za služby = "602" (tržby za služby)
   - Tržby za vlastní výrobky = "601" (tržby za vlastní výrobky)

   **D) ÚHRADA PŘIJATÉ FAKTURY (samostatný účetní případ):**
   MD: "321" (dodavatelé - snižujeme závazek)
   D: "221" (bankovní účet - odchází peníze)

   **E) ÚHRADA VYDANÉ FAKTURY (příjem peněz):**
   MD: "221" (bankovní účet) nebo "211" (pokladna)
   D: "311" (odběratelé - snižujeme pohledávku)

═══════════════════════════════════════════════════════════════════
KRITICKÁ PRAVIDLA (ČASTO CHYBUJÍ):
═══════════════════════════════════════════════════════════════════

1. **PENÍZE NA CESTĚ (261)**:
   - Používej POUZE pro platby kartou!
   - Karta znamená peníze dorazí na účet za 1-2 dny
   - NEpoužívej pro hotovost nebo přímý bankovní převod!

2. **PŘIJATÁ FAKTURA s datem splatnosti**:
   - MD: (nákladový účet podle obsahu)
   - D: "321" (dodavatelé - vzniká závazek)
   - ❌ NEPOUŽÍVEJ 211/221/261 pokud má datum splatnosti!

3. **ÚČTENKA bez data splatnosti**:
   - MD: (nákladový účet podle obsahu)
   - D: "211" (hotově) / "261" (kartou) / "221" (převodem)
   - ✅ Tady ANO používej platební účty!

4. **REPREZENTACE vs CESTOVNÉ**:
   - Reprezentace (513): občerstvení KLIENTŮ, dárky pro partnery
   - Cestovné (512): jízdenky, dálnice, parkování, ubytování
   - ❌ Jídlo pro zaměstnance na cestě = 512 (ne 513)!

Vrať POUZE validní JSON ve formátu:

PŘÍKLAD 1 (přijatá faktura):
{
  "predkontace": "3Fv",
  "predkontace_md": "518",
  "predkontace_d": "321"
}

PŘÍKLAD 2 (vydaná faktura):
{
  "predkontace": "1Fv",
  "predkontace_md": "311",
  "predkontace_d": "602"
}

PŘÍKLAD 3 (účtenka kartou):
{
  "predkontace": "UD",
  "predkontace_md": "501",
  "predkontace_d": "261"
}

PŘÍKLAD 4 (účtenka hotově):
{
  "predkontace": "UD",
  "predkontace_md": "512",
  "predkontace_d": "211"
}

PŘÍKLAD 5 (dobropis):
{
  "predkontace": "DB",
  "predkontace_md": "321",
  "predkontace_d": "518"
}

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
