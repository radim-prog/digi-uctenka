# 📸 Digi-Účtenka v1.0

**Aplikace pro skenování a zpracování účtenek a faktur pomocí Google Gemini AI**

Automaticky rozpozná text z PDF a obrázků, extrahuje data (dodavatel, částky, DPH, položky) a ukládá do Firebase. Podporuje hromadné zpracování, AI předkontaci a správu více firem.

---

## ✨ Hlavní funkce verze 1.0

- 🤖 **AI OCR** - Google Gemini 2.5 Flash automaticky vytěží všechna data
- 📄 **PDF až 25 MB** - Bez komprese, podporuje velké faktury
- 📸 **Obrázky** - JPG, PNG s automatickou kompresí
- 🔄 **Hromadné zpracování** - Až 10 souborů paralelně
- ✅ **Ověření dat** - Manuální kontrola a oprava rozpoznaného textu
- 🧮 **AI Předkontace** - Automatické generování účetní předkontace
- 💾 **Firebase Storage** - Zabezpečené ukládání originálních souborů
- 🏢 **Multi-firma** - Podpora více firem/IČO
- 🔐 **Zabezpečené** - Přihlášení přes Google, každý vidí jen svoje data
- 📊 **Dashboard** - Přehled všech dokladů s filtrací a vyhledáváním

---

## 🚀 Rychlý start

### 1. Instalace
```bash
npm install
```

### 2. Konfigurace
Zkopíruj `.env.local.example` na `.env.local` a doplň API klíče:
- Firebase credentials
- Anthropic API key
- Google Service Account JSON
- Google Sheet ID

**Podrobný návod najdeš v [README-SETUP.md](./README-SETUP.md)**

### 3. Spuštění
```bash
npm run dev
```

Aplikace poběží na [http://localhost:3000](http://localhost:3000)

---

## 🛠 Technologie

- **Frontend:** Next.js 14 + React + TypeScript + Tailwind CSS
- **Authentication:** Firebase Authentication (Google Sign-in)
- **Database:** Firebase Firestore
- **AI Vision:** Claude API (Anthropic)
- **Storage:** Google Drive API
- **Export:** Google Sheets API
- **Hosting:** Vercel

---

## 📁 Struktura projektu

```
digi-uctenka/
├── app/
│   ├── (auth)/login/          # Přihlášení
│   ├── (dashboard)/           # Hlavní aplikace
│   │   ├── page.tsx           # Dashboard (seznam dokladů)
│   │   ├── firmy/             # Správa firem
│   │   ├── nahrat/            # Nahrání nového dokladu
│   │   └── overit/[id]/       # Verifikace dat
│   ├── api/                   # API endpoints
│   │   ├── ocr/               # Claude Vision OCR
│   │   ├── upload-drive/      # Google Drive upload
│   │   └── export-sheets/     # Export do Google Sheets
│   └── layout.tsx             # Root layout
├── lib/
│   ├── firebase.ts            # Firebase config
│   ├── claude-ocr.ts          # AI OCR logika
│   ├── google-drive.ts        # Drive API
│   ├── google-sheets.ts       # Sheets API
│   ├── validation.ts          # Validace IČO, DIČ, atd.
│   └── types.ts               # TypeScript typy
├── hooks/
│   ├── useAuth.ts             # Auth state management
│   ├── useFirmy.ts            # Firmy CRUD
│   └── useDoklady.ts          # Doklady CRUD
└── README-SETUP.md            # Detailní setup návod
```

---

## 📝 Datový model

### Firma
- Název, IČO, DIČ, Adresa
- Multi-firma support (každý user může mít více firem)

### Doklad
- **Odběratel:** Data z vybrané firmy
- **Dodavatel:** AI extrakce z účtenky
- **Základní údaje:** Číslo dokladu, VS, KS, SS, data
- **Částky:** Celková částka, DPH 21%, 12%, 0%
- **Metadata:** Link na Drive, export status, AI confidence

---

## 🎯 Workflow

1. **Přihlášení** přes Google účet
2. **Vytvoř firmu** (tvoje firma jako odběratel)
3. **Nahraj účtenku** - vyfotíš nebo nahraješ obrázek
4. **AI zpracování** - Claude automaticky rozpozná text (5-15 sekund)
5. **Ověření** - zkontroluj a případně oprav data
6. **Uložení** - data se uloží do Firestore a Google Sheets
7. **Export** - z Google Sheets můžeš importovat do Pohody

---

## 🔐 Bezpečnost

- Firebase Security Rules - každý user vidí jen svoje data
- Google Sign-in - žádná hesla ke správě
- Service Account s omezeným přístupem (jen Drive a Sheets)
- Environment variables pro všechny API klíče
- `.gitignore` pro ochranu `.env.local`

---

## 💰 Náklady

### Vývoj/Testování (ZDARMA)
- Firebase Spark Plan: 50K reads/day, 20K writes/day
- Anthropic: $5 free credit (~1600 účtenek)
- Vercel Hobby: Unlimited deployments
- Google Workspace: Zdarma (Drive + Sheets)

### Produkce (běžné použití)
- Firebase: Zůstane zdarma pro většinu use-casů
- Anthropic: ~$3 za 1000 účtenek (pay-as-you-go)
- Vercel: Zůstane zdarma (100 GB bandwidth/měsíc)

**Celkové náklady: ~$3 za 1000 účtenek** (velmi levné!)

---

## 🆘 Podpora

- **Setup návod:** [README-SETUP.md](./README-SETUP.md)
- **Issues:** [GitHub Issues](https://github.com/TVOJEMENO/digi-uctenka/issues)

---

## 📄 Licence

MIT License - použij jak chceš!

---

**Vytvořeno s ❤️ pomocí Claude Code**
