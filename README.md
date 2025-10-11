# 📸 Digi-Účtenka - AI-Powered Receipt Scanner

**Chytrá webová aplikace pro digitalizaci účtenek a faktur pomocí umělé inteligence Claude.**

Aplikace automaticky rozpozná text z účtenek, extrahuje důležité informace (dodavatel, částky, DPH) a uloží je do Google Sheets pro snadný import do účetních systémů jako Pohoda.

---

## ✨ Hlavní funkce

- 📱 **Mobilní web app** - vyfotíš účtenku přímo v prohlížeči
- 🤖 **AI OCR** - Claude 4 Sonnet automaticky vytěží všechna data
- ✅ **Ověření dat** - možnost manuálně zkontrolovat a opravit rozpoznaný text
- 💾 **Google Drive** - automatické ukládání originálních obrázků
- 📊 **Google Sheets** - export dat pro import do Pohody
- 🏢 **Multi-firma** - podpora více firem/IČO
- 🔐 **Zabezpečené** - přihlášení přes Google, každý vidí jen svoje data

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
