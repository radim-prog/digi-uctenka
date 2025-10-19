# 📸 Digi-Účtenka v1.3

**Aplikace pro digitalizaci a zpracování účetních dokladů pomocí Google Gemini AI**

Automaticky rozpozná text z PDF a obrázků, extrahuje data (dodavatel, částky, DPH, položky) a ukládá do Firebase. Podporuje hromadné zpracování až 10 souborů paralelně, AI předkontaci, bankovní výpisy a export do účetního systému Pohoda.

---

## ✨ Hlavní funkce

### 🤖 OCR a AI zpracování
- **Google Gemini 2.5 Flash** - Nejnovější AI model pro rozpoznávání textu
- **PDF až 25 MB** - Bez komprese, podporuje velké faktury
- **Obrázky** - JPG, PNG, HEIC s automatickou iterativní kompresí
- **Inteligentní extrakce** - Dodavatel, částky, DPH (21%, 12%, 0%), řádkové položky, forma úhrady
- **7 typů dokladů** - Faktura přijatá/vydaná, účtenka, daňový doklad, opravný DD, zálohová faktura, dobropis

### 📊 Zpracování dat
- **Hromadné nahrávání** - Až 10 souborů paralelně s progress barem
- **Manuální ověření** - Kontrola a oprava OCR dat
- **AI Předkontace** - Automatické generování účetních předkontací (MD/D)
- **Bankovní výpisy** - OCR zpracování PDF výpisů, automatické párování transakcí s fakturami
- **Archiv** - Organizace dokladů po měsících

### 💾 Storage a bezpečnost
- **Firebase Storage** - Zabezpečené ukládání originálních souborů (5 GB zdarma)
- **Firebase Firestore** - NoSQL databáze pro metadata
- **Security Rules** - Každý uživatel vidí jen svoje data
- **Google Sign-in** - Bezpečné přihlášení bez hesel

### 🏢 Multi-firma a export
- **Multi-firma** - Podpora více firem/IČO na jeden účet
- **Export do Pohody** - XML export kompatibilní s účetním systémem Pohoda
- **Popis pro Pohodu** - AI generuje čitelný popis položek pro import
- **Dashboard** - Přehled všech dokladů s filtrací (měsíc, rok, dodavatel, typ)

---

## 🚀 Rychlý start

### 1. Instalace
```bash
npm install
```

### 2. Konfigurace
Zkopíruj `.env.local.example` na `.env.local` a doplň:
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...

# Google Gemini AI
GEMINI_API_KEY=...
```

**Podrobný návod: [README-SETUP.md](./README-SETUP.md)**

### 3. Firebase Security Rules
```bash
firebase deploy --only storage,firestore
```

### 4. Spuštění
```bash
npm run dev
```

Aplikace poběží na [http://localhost:3000](http://localhost:3000)

---

## 🛠 Technologie

- **Framework:** Next.js 14.2.33 + React + TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Firebase Authentication (Google Sign-in)
- **Database:** Firebase Firestore + Firebase Storage
- **AI OCR:** Google Gemini 2.5 Flash API
- **Image Processing:** browser-image-compression, heic2any
- **Deployment:** Vercel (doporučeno) nebo Firebase Hosting

---

## 📁 Struktura projektu

```
digi-uctenka/
├── app/
│   ├── (auth)/login/              # Přihlášení
│   ├── (dashboard)/               # Hlavní aplikace
│   │   ├── page.tsx               # Dashboard (seznam dokladů)
│   │   ├── firmy/                 # Správa firem
│   │   ├── nahrat/                # Nahrání dokladů (až 10 paralelně)
│   │   ├── overit/[id]/           # Ověření a úprava dat
│   │   ├── bankovni-vypisy/       # Zpracování bankovních výpisů
│   │   └── archiv/                # Archiv dokladů po měsících
│   ├── api/
│   │   ├── ocr/                   # Gemini OCR endpoint
│   │   ├── predkontace/           # AI předkontace
│   │   ├── predkontace-batch/     # Hromadná předkontace
│   │   ├── bank-statement/        # Zpracování výpisů
│   │   └── pohoda-export/         # Export do Pohody XML
│   └── layout.tsx
├── lib/
│   ├── firebase.ts                # Firebase config
│   ├── gemini-ocr.ts              # Gemini AI OCR logika
│   ├── bank-statement-ocr.ts      # OCR pro bankovní výpisy
│   ├── validation.ts              # Validace IČO, DIČ, dat
│   ├── pohoda-export.ts           # XML export pro Pohodu
│   ├── invoice-description.ts     # AI popis pro Pohodu
│   ├── predkontace-ai.ts          # AI generování předkontací
│   └── types.ts                   # TypeScript typy
├── hooks/
│   ├── useAuth.ts                 # Auth state
│   ├── useFirmy.ts                # Firmy CRUD
│   ├── useDoklady.ts              # Doklady CRUD
│   └── useTransactions.ts         # Bankovní transakce
├── storage.rules                  # Firebase Storage Security Rules
├── firestore.rules                # Firestore Security Rules
└── firestore.indexes.json         # Firestore indexy
```

---

## 📝 Datový model

### Firma
```typescript
{
  nazev: string;
  ico: string;        // 8 číslic, s kontrolním součtem
  dic: string;        // CZ + 8-10 číslic
  adresa: string;
  isActive: boolean;
}
```

### Doklad
```typescript
{
  // Dodavatel (z OCR)
  dodavatel_nazev: string;
  dodavatel_ico: string;
  dodavatel_dic: string;

  // Základní údaje
  typ_dokladu: 'faktura_prijata' | 'uctenka' | ...;
  cislo_dokladu: string;
  variabilni_symbol: string;
  datum_vystaveni: string;      // YYYY-MM-DD
  datum_zdanitelneho_plneni: string;
  datum_splatnosti?: string;

  // Částky
  celkova_castka: number;
  zaklad_dane_21?: number;
  dph_21?: number;
  zaklad_dane_12?: number;
  dph_12?: number;
  zaklad_dane_0?: number;

  // Položky (pokud jsou na dokladu)
  polozky?: Array<{
    nazev: string;
    mnozstvi: number;
    jednotka: string;
    sazba_dph: 21 | 12 | 0;
    celkem_s_dph: number;
  }>;

  // Předkontace
  predkontace_md?: string;     // Účet MD (má dáti)
  predkontace_d?: string;      // Účet D (dal)

  // Metadata
  originalImageUrl: string;    // Firebase Storage URL
  storagePath: string;
  imageMimeType: string;
  status: 'draft' | 'verified' | 'exported';
  confidence: number;          // AI confidence score (0-1)
}
```

### BankTransaction
```typescript
{
  datum: string;
  castka: number;              // Kladná = příchozí, záporná = odchozí
  typ: 'incoming' | 'outgoing';
  variabilni_symbol?: string;
  nazev_protiuctu: string;
  popis: string;
  parovana_faktura_id?: string; // Auto-matching podle VS
  status: 'draft' | 'matched' | 'exported';
}
```

---

## 🎯 Workflow

### Zpracování dokladů
1. **Přihlášení** přes Google účet
2. **Vytvoř firmu** (tvoje firma jako odběratel)
3. **Nahraj doklady** - 1-10 souborů najednou (PDF, JPG, PNG, HEIC)
4. **AI zpracování** - Gemini automaticky rozpozná text (10-30 sekund)
5. **Ověření** - Zkontroluj a oprav data v uživatelsky přívětivém formuláři
6. **AI předkontace** - Automatické generování účetní předkontace
7. **Export do Pohody** - XML soubor pro import

### Bankovní výpisy
1. **Nahraj PDF výpis** z internetového bankovnictví
2. **AI zpracování** - Gemini extrahuje všechny transakce
3. **Auto-matching** - Párování transakcí s fakturami podle VS
4. **Export** - Připraveno k zaúčtování

---

## 🔐 Bezpečnost

### Firebase Security Rules
```javascript
// Firestore
match /doklady/{dokladId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}

// Storage
match /doklady/{firmaNazev}/{year}/{fileName} {
  allow read, write: if request.auth != null;
}
```

### Best Practices
- ✅ Google Sign-in - žádná hesla ke správě
- ✅ Environment variables pro API klíče
- ✅ `.gitignore` pro ochranu secrets
- ✅ Firebase Storage pro soubory (ne Firestore - 1 MB limit)
- ✅ User-based isolation (každý vidí jen svoje data)

---

## 💰 Náklady

### Běžné použití (100 dokladů/měsíc)
- **Firebase Storage:** 5 GB zdarma (stačí na ~10 000 dokladů)
- **Firestore:** 50K reads/day, 20K writes/day zdarma
- **Gemini API:** ~$0.05/měsíc (~$0.0005 za doklad)
- **Vercel Hosting:** Zdarma (Hobby tier)

**Celkem: ~$0.05/měsíc (5 Kč/měsíc)**

### Větší provoz (1000 dokladů/měsíc)
- **Firebase:** Stále zdarma
- **Gemini API:** ~$0.50/měsíc
- **Vercel:** Stále zdarma

**Celkem: ~$0.50/měsíc (50 Kč/měsíc)**

🎉 **Extrémně levné!** Díky Gemini 2.5 Flash (100x levnější než GPT-4 Vision)

---

## 🐛 Řešení problémů

### OCR nečte data
- ✅ Zkontroluj GEMINI_API_KEY v .env.local
- ✅ Ověř, že obrázek je ostrý a dobře nasvícený
- ✅ PDF nesmí být chráněné heslem

### Firebase 403 Forbidden
- ✅ Nasaď Security Rules: `firebase deploy --only storage,firestore`
- ✅ Zkontroluj, že jsi přihlášený

### "_ is not defined" error
- ✅ Opraveno v lib/validation.ts:125-128
- ✅ Používej `const d = match[1]` místo `[_, d] = match`

---

## 📈 Verze a historie

### v1.3 (2025-10-19) - Aktuální stabilní verze ✅
- ✅ Oprava kritického bugu "_ is not defined" v lib/validation.ts
- ✅ Nasazení Firebase Storage a Firestore Security Rules
- ✅ Iterativní komprese obrázků (garantuje < 1 MB)
- ✅ Bankovní výpisy s AI zpracováním
- ✅ Export do Pohody XML
- ✅ AI generování popisů pro Pohodu
- ✅ Support pro 7 typů dokladů
- ✅ Hromadná předkontace
- ✅ Archiv po měsících
- ✅ Auto-matching bankovních transakcí s fakturami
- ✅ HEIC podpora

### v1.2 (2025-10-12)
- Pohoda export s inteligentním popisem
- Oprava mapování formy úhrady
- Klikací řádky v dashboardu

### v1.1 (2025-10-08)
- Multi-firma support
- Dashboard s filtry
- PDF preview

### v1.0 (2025-10-01)
- Základní OCR s Google Gemini
- Firebase Storage migrace
- První produkční verze

---

## 🚀 Nasazení online

### Vercel (doporučeno)
```bash
# 1. Push na GitHub
git add .
git commit -m "Ready for deployment"
git push

# 2. Import na Vercel
# - Jdi na vercel.com
# - Import GitHub repo
# - Přidej environment variables
# - Deploy!
```

**URL:** `https://tvoje-aplikace.vercel.app`

---

## 🆘 Podpora

- **Setup návod:** [README-SETUP.md](./README-SETUP.md)
- **Issues:** [GitHub Issues](https://github.com/radim-prog/digi-uctenka/issues)
- **Dokumentace:** Tento README + komentáře v kódu

---

## 📄 Licence

MIT License - použij jak chceš!

---

**Vytvořeno s ❤️ pomocí Claude Code a Google Gemini AI**
