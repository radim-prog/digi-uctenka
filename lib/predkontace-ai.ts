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

  const prompt = `Analyzuj tento český účetní doklad a urči správnou předkontaci pro účetní software Pohoda.

INFORMACE O DOKLADU:
- Typ dokladu: ${doklad.typ_dokladu || 'neznámý'}
- Dodavatel: ${doklad.dodavatel_nazev || 'neznámý'}
- Celková částka: ${doklad.celkova_castka || 0} ${doklad.mena || 'CZK'}
- Forma úhrady: ${doklad.forma_uhrady || 'neznámá'}
- Položky: ${doklad.polozky?.map(p => p.nazev).join(', ') || 'žádné'}

PRAVIDLA PRO PŘEDKONTACI:

1. **predkontace** (Číselná řada):
   - Přijatá faktura (má IČO dodavatele, datum splatnosti) = "3Fv"
   - Účtenka/běžný nákup = "UD"
   - Daňový doklad = "DD"
   - Zálohová faktura = "ZF"

2. **predkontace_md** (Účet MD - má dáti):
   Podle TYPU NÁKUPU/SLUŽBY:
   - Pohonné hmoty (benzin, nafta, CNG) = "501"
   - Spotřební materiál (kancelářské potřeby, drobný materiál) = "501"
   - Nájemné = "518"
   - Služby (opravy, servis, údržba) = "518"
   - Drobný majetek, nábytek, vybavení = "501"
   - Energie (elektřina, plyn, voda) = "502"
   - Telekomunikace (telefon, internet, mobil) = "518"
   - Cestovné = "512"
   - Reprezentace (občerstvení, restaurant pro klienty) = "513"
   - Poradenství, konzultace, právní služby = "518"
   - Marketing, reklama, propagace = "518"
   - Software, licence = "518"
   - Pokud nevíš = "321"

3. **predkontace_d** (Účet D - dal):
   Podle FORMY ÚHRADY:
   - Pokud "hotove" = "211" (pokladna)
   - Pokud "karta" nebo "prevod" = "221" (bankovní účet)
   - Pokud neznámá forma = "321"

Vrať POUZE validní JSON ve formátu:
{
  "predkontace": "3Fv",
  "predkontace_md": "501",
  "predkontace_d": "221"
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
