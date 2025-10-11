# Digi-Účtenka - Dokumentace projektu

**Datum poslední aktualizace:** 11.10.2025

## 📋 O projektu

Česká aplikace pro skenování a zpracování účtenek/faktur s AI pomocí Google Gemini 2.5 Flash. Aplikace umožňuje:
- Nahrání dokladů (obrázky + PDF)
- Automatické OCR zpracování pomocí Gemini AI
- Manuální ověření a editaci dat
- Export do účetního software Pohoda (XML)
- Sledování účtování včetně pozdních účtování (>30 dní)

## 🏗️ Technologie

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Firebase Firestore (databáze), Firebase Auth (Google OAuth)
- **AI:** Google Gemini 2.5 Flash API pro OCR
- **Storage:** Google Drive API (primární), Firebase (fallback base64)
- **Komprese:** browser-image-compression

## 📁 Struktura projektu

```
/app
  /(dashboard)
    /page.tsx              # Hlavní dashboard s frontou a archivem
    /nahrat/page.tsx       # Multi-upload stránka
    /overit/[id]/page.tsx  # Verification formulář s náhledem
    /firmy/page.tsx        # Správa firem
  /api
    /ocr/route.ts          # Gemini OCR endpoint
    /upload-drive/route.ts # Google Drive upload

/lib
  /types.ts              # TypeScript typy (Doklad, Firma, Polozka, atd.)
  /gemini-ocr.ts         # Gemini API logika
  /pohoda-export.ts      # Generování Pohoda XML
  /firebase.ts           # Firebase konfigurace
  /validation.ts         # Validace IČO, DIČ, částek

/hooks
  /useDoklady.ts         # Firestore hook pro načítání dokladů
  /useFirmy.ts           # Firestore hook pro správu firem
  /useAuth.ts            # Firebase auth hook
```

## 🔄 Workflow aplikace

### 1. Výběr firmy
- Uživatel si vytvoří/vybere firmu v `/firmy`
- Firma se uloží jako `activeFirmaId` v user dokumentu

### 2. Nahrání dokladů (`/nahrat`)
- Multi-file upload (obrázky + PDF)
- Sekvenční zpracování fronty:
  - Komprese: max 0.8MB, 1600px (pro Gemini API limit)
  - **DŮLEŽITÉ:** Ukládají se DVĚ verze:
    - `base64ForOCR` - komprimovaná pro AI
    - `base64Original` - originál pro náhled (vždy se ukládá do Firestore)
  - OCR pomocí Gemini (extrakce dodavatele, částek, položek)
  - Upload na Google Drive (volitelné, může selhat)
  - Uložení do Firestore se statusem `draft`
- **Fallback:** Pokud OCR selže → uloží se doklad s prázdnými daty pro ruční zadání

### 3. Ověření dokladu (`/overit/[id]`)
- **Layout:** Side-by-side (60% náhled / 40% formulář)
- **Náhled obrázku (levá strana):**
  - Priorita: `imageBase64` (vždy dostupné)
  - Fallback: `originalImageUrl` (Drive)
  - PDF: zobrazení v iframe
  - Obrázek: s rotací a zoom kontrolami
  - Sticky pozice pro pohodlné procházení
- **Formulář (pravá strana) - Pohoda-style layout:**
  - Levý sloupec: Faktura (typ, číslo, var.sym., součet položek s DPH rozpadem)
  - Pravý sloupec: Dodavatel (NAHOŘE!), datumy, předkontace, forma úhrady
- **Navigace mezi doklady:**
  - Šipky ← → na krajích stránky (objeví se při najetí myší)
  - Automatické přepínání mezi doklady ve frontě
- **Tlačítka:**
  - "💾 Uložit" - uloží a zůstane na stránce
  - "Uložit a další →" - uloží a přejde na další doklad
  - "← Zpět" - vrátí na dashboard
- **Uložení:** Změní status na `verified`, NEEXPORTUJE

### 4. Dashboard (`/`)

#### Dva režimy zobrazení:
1. **📋 Pracovní fronta** - doklady se statusem: `draft`, `verified`, `exported`
2. **📁 Archiv** - doklady se statusem: `accounted`

#### Filtry:
- Vše / Koncepty / Ověřené / Exportované

#### Akce na vybrané doklady (checkbox):
- **📥 Export do Pohody** (jen fronta):
  - Generuje Pohoda XML s položkami a různými DPH
  - Stáhne XML soubor
  - Změní status na `exported`

- **✓ Potvrdit zaúčtování** (jen fronta):
  - Prompt na měsíc účtování (YYYY-MM)
  - Automaticky vypočítá zda je účtování pozdě (>30 dní od vystavení)
  - Nastaví: `datum_uctovani`, `mesic_uctovani`, `pozde_uctovano`
  - Změní status na `accounted`
  - Přesune do archivu

- **🗑️ Smazat** (oboje):
  - Hromadné mazání vybraných
  - Potvrzovací dialog

#### Akce na jednotlivé doklady:
- **Upravit** - přejde na `/overit/[id]`
- **Zobrazit** - otevře obrázek/PDF v novém okně (stažení)
- **Smazat** - smaže jeden doklad s potvrzením

## 📊 Datový model

### Doklad (Firestore collection: `doklady`)

```typescript
{
  id: string;
  userId: string;
  firmaId: string;

  // Odběratel (z vybrané firmy)
  odberatel_nazev: string;
  odberatel_ico: string;
  odberatel_dic: string;
  odberatel_adresa: string;

  // Dodavatel (z AI)
  dodavatel_nazev: string;
  dodavatel_ico: string;
  dodavatel_dic: string;
  dodavatel_adresa?: string;

  // Doklad
  typ_dokladu: 'faktura_prijata' | 'uctenka' | 'danovy_doklad' | 'zalohova_faktura';
  cislo_dokladu: string;
  variabilni_symbol: string;
  datum_vystaveni: string; // YYYY-MM-DD
  datum_zdanitelneho_plneni: string; // DUZP
  datum_splatnosti?: string;

  // Částky
  celkova_castka: number;
  mena: string; // "CZK"

  // DPH (české sazby: 21%, 12%, 0%)
  zaklad_dane_21?: number;
  dph_21?: number;
  zaklad_dane_12?: number;
  dph_12?: number;
  zaklad_dane_0?: number;

  // Položky (array)
  polozky?: [
    {
      nazev: string;
      mnozstvi: number;
      jednotka: string;
      cena_za_jednotku: number;
      zaklad_dane: number;
      sazba_dph: 21 | 12 | 0;
      dph: number;
      celkem_s_dph: number;
    }
  ];

  // Soubory
  imageBase64: string;          // VŽDY ULOŽENO - originální obrázek
  imageMimeType: string;        // 'image/jpeg' nebo 'application/pdf'
  originalImageUrl: string;     // Drive URL (může být prázdné)
  driveFileId: string;          // Drive file ID (může být prázdné)

  // Status lifecycle
  status: 'draft' | 'verified' | 'exported' | 'accounted';

  // Účtování (KRITICKÉ pro české účetnictví!)
  datum_uctovani?: string;      // Datum zaúčtování (YYYY-MM-DD)
  mesic_uctovani?: string;      // Měsíc účtování (YYYY-MM)
  pozde_uctovano?: boolean;     // true pokud rozdíl > 30 dní

  // Timestamps
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  exportedAt?: Timestamp;
  accountedAt?: Timestamp;

  // AI metadata
  aiConfidence?: number;
  aiRawResponse?: string;
}
```

### Firma (Firestore collection: `firmy`)

```typescript
{
  id: string;
  userId: string;
  nazev: string;
  ico: string;      // 8 číslic
  dic: string;      // CZ12345678
  adresa: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🤖 Gemini AI Prompt

Gemini 2.5 Flash se používá pro extrakci dat. Klíčové instrukce:

1. **Vytěž VŠECHNY řádkové položky** - na jednom dokladu může být více položek s různým DPH (např. benzin 21% + sušenky 12%)
2. Vždy vrať validní JSON
3. Formát data: YYYY-MM-DD
4. České DPH sazby: 21%, 12%, 0%
5. Pokud něco nejde přečíst → `null`

## ⚠️ Kritické problémy a jejich řešení

### 1. ✅ VYŘEŠENO: Náhled obrázků nefungoval
**Problém:** Když Drive upload uspěl, `imageBase64` byl `null` → žádný náhled
**Řešení:** Vždy ukládat `base64Original` do Firestore (i když je Drive upload úspěšný)
**Soubory:** `app/(dashboard)/nahrat/page.tsx:213`, `app/(dashboard)/overit/[id]/page.tsx:167-211`

### 2. ✅ VYŘEŠENO: Large files (>450KB) selhávaly
**Problém:** Gemini API limit 1048487 bytes
**Řešení:** Komprese na 0.8MB, 1600px rozlišení
**Soubor:** `app/(dashboard)/nahrat/page.tsx:140-153`

### 3. ✅ VYŘEŠENO: Save a Export byly spojené
**Problém:** Po uložení se doklad rovnou exportoval
**Řešení:** Oddělené akce - Save jen změní status na `verified`, Export je samostatné tlačítko na dashboardu
**Soubor:** `app/(dashboard)/overit/[id]/page.tsx:87-113`

### 4. ⚠️ DŮLEŽITÉ: Účtování může být až za 3 roky
**Řešení:** Oddělené pole `datum_vystaveni` vs `datum_uctovani`, automatická detekce `pozde_uctovano` (>30 dní)
**Soubor:** `app/(dashboard)/page.tsx:52-93`

## 🔑 API Keys a Konfigurace

### Gemini API
- Model: `gemini-2.5-flash`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Key: nastaveno v `.env.local` jako `GEMINI_API_KEY`

### Firebase
- Auth: Google OAuth
- Firestore: databáze dokladů a firem
- Konfigurace: `lib/firebase.ts`

### Google Drive
- Upload do struktury: `/[Rok]/[Název firmy]/[soubory]`
- API: `app/api/upload-drive/route.ts`

## 📝 TODO / Možná vylepšení

- [ ] Bulk edit (upravit více dokladů najednou)
- [ ] Filtr podle dodavatele
- [ ] Export do jiných formátů (CSV, Excel)
- [ ] Statistiky (grafy měsíčních výdajů)
- [ ] Notifikace pro blížící se splatnosti
- [ ] Mobile app (React Native)
- [ ] Automatické párování plateb z banky

## 🐛 Známé problémy

- PDF preview nefunguje v Safari (omezení prohlížeče)
- Velmi velké PDF (>5MB) mohou být pomalé
- Gemini někdy špatně rozpozná ručně psané účtenky

## 🚀 Jak pokračovat

### Spuštění projektu:
```bash
cd "/Users/Radim/Library/CloudStorage/GoogleDrive-radim@wikiporadce.cz/Můj disk/claude code/Aplikace skenování účtenek"
npm install
npm run dev
```

### Pro přidání nové funkce:
1. Přečti si tento dokument
2. Najdi relevantní soubor ve struktuře výše
3. Zkontroluj datový model v `lib/types.ts`
4. Testuj workflow: nahrát → ověřit → exportovat → zaúčtovat

### Pokud něco nefunguje:
1. Zkontroluj konzoli prohlížeče (F12)
2. Zkontroluj Firebase Firestore data
3. Ověř že jsou všechny API klíče nastavené
4. Pro OCR problémy: zkontroluj `app/api/ocr/route.ts` a response

## 📞 Kontakt a závislosti

**Správce projektu:** Radim
**Email:** radim@wikiporadce.cz
**Lokace:** Google Drive → Můj disk → claude code → Aplikace skenování účtenek

**Package.json dependencies:**
- next: ^14.x
- react: ^18.x
- firebase: ^10.x
- browser-image-compression: ^2.x
- tailwindcss: ^3.x

---

**Poslední změny (11.10.2025):**
- ✅ Verification form: Pohoda-style layout se dvěma sloupci
- ✅ Dodavatel přesunut nahoru (první co se kontroluje)
- ✅ Přidána navigace mezi doklady (šipky na krajích při najetí myší)
- ✅ Rozdělení tlačítka: "Uložit" vs "Uložit a další →"
- ✅ Přidáno pole předkontace pro budoucí AI suggestions

**Předchozí změny (10.10.2025):**
- ✅ Opraven náhled obrázků (base64 vždy uloženo)
- ✅ Přidáno tlačítko "Zpět" ve verification form
- ✅ Opraven "Zobrazit" button na dashboardu
- ✅ Přidána možnost mazání (individual + bulk)
- ✅ PDF preview v iframe
- ✅ Rotace a zoom obrázků

---

**Pro Claude AI:** Tento dokument obsahuje kompletní kontext projektu. Při pokračování konverzace načti tento soubor a budeš mít všechny informace o architektuře, workflow a provedených změnách.

## 🎯 Workflow ověřování dokladů

1. **Nahrání** → Doklady se nahrají přes `/nahrat` se statusem `draft`
2. **Ověření** → Na dashboardu klikneš "Upravit" → otevře `/overit/[id]`
3. **Kontrola** → Zkontroluj dodavatele (nahoře!), částky, DPH
4. **Navigace** → Použij šipky na krajích nebo "Uložit a další →" pro rychlé procházení
5. **Export** → Po ověření všech dokladů je můžeš vybrat a exportovat do Pohody
6. **Zaúčtování** → Po importu do Pohody potvrď zaúčtování → přesune se do archivu
