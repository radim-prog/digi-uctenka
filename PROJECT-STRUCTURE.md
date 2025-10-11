# 📂 Struktura projektu Digi-Účtenka

Kompletní přehled všech souborů v aplikaci.

## ✅ VYTVOŘENÉ SOUBORY (29 souborů)

### 🔧 Konfigurační soubory (7)
- `package.json` - NPM dependencies a skripty
- `tsconfig.json` - TypeScript konfigurace
- `next.config.js` - Next.js konfigurace
- `tailwind.config.js` - Tailwind CSS konfigurace
- `postcss.config.js` - PostCSS konfigurace
- `.gitignore` - Git ignore soubor
- `.env.local.example` - Vzor pro environment variables

### 📖 Dokumentace (3)
- `README.md` - Hlavní README projektu
- `README-SETUP.md` - Detailní návod k nastavení (pro non-programátory)
- `PROJECT-STRUCTURE.md` - Tento soubor

### 🔐 Firebase (1)
- `firestore.rules` - Firestore security rules

### 📱 App Pages (6)
- `app/layout.tsx` - Root layout
- `app/globals.css` - Globální styly
- `app/(auth)/login/page.tsx` - Login stránka (Google Sign-in)
- `app/(dashboard)/layout.tsx` - Dashboard layout s navigací
- `app/(dashboard)/page.tsx` - Dashboard (seznam dokladů)
- `app/(dashboard)/firmy/page.tsx` - Správa firem
- `app/(dashboard)/nahrat/page.tsx` - Nahrání nového dokladu
- `app/(dashboard)/overit/[id]/page.tsx` - Verifikace dat dokladu

### 🔌 API Routes (3)
- `app/api/ocr/route.ts` - Claude AI OCR endpoint
- `app/api/upload-drive/route.ts` - Google Drive upload endpoint
- `app/api/export-sheets/route.ts` - Google Sheets export endpoint

### 📚 Lib (knihovny) (7)
- `lib/firebase.ts` - Firebase inicializace a auth helpers
- `lib/firebase-admin.ts` - Firebase Admin SDK (pro server-side)
- `lib/claude-ocr.ts` - Claude AI OCR modul
- `lib/google-drive.ts` - Google Drive upload modul
- `lib/google-sheets.ts` - Google Sheets export modul
- `lib/validation.ts` - Validační funkce (IČO, DIČ, datum, částka)
- `lib/types.ts` - TypeScript typy a interfaces

### 🪝 Custom Hooks (3)
- `hooks/useAuth.ts` - Auth state management
- `hooks/useFirmy.ts` - Firmy CRUD operations
- `hooks/useDoklady.ts` - Doklady CRUD operations

---

## 📦 DEPENDENCIES (z package.json)

### Production Dependencies
- `next@^14.2.3` - React framework
- `react@^18.3.1` - UI library
- `react-dom@^18.3.1` - React DOM
- `typescript@^5.4.5` - TypeScript
- `@anthropic-ai/sdk@^0.20.9` - Claude AI SDK
- `firebase@^10.12.2` - Firebase SDK
- `googleapis@^134.0.0` - Google APIs
- `tailwindcss@^3.4.3` - CSS framework
- `autoprefixer@^10.4.19` - PostCSS plugin
- `postcss@^8.4.38` - CSS preprocessor

### Dev Dependencies
- `@types/node@^20.12.12` - Node.js types
- `@types/react@^18.3.2` - React types
- `@types/react-dom@^18.3.0` - React DOM types

---

## 🎯 KLÍČOVÉ FUNKCE PO SOUBORECH

### Authentication Flow
1. `app/(auth)/login/page.tsx` - Login UI
2. `lib/firebase.ts` - Google Sign-in implementace
3. `hooks/useAuth.ts` - Auth state hook

### OCR Flow
1. `app/(dashboard)/nahrat/page.tsx` - File upload UI
2. `app/api/ocr/route.ts` - API endpoint
3. `lib/claude-ocr.ts` - Claude AI integrace

### Drive Upload Flow
1. `app/(dashboard)/nahrat/page.tsx` - Upload trigger
2. `app/api/upload-drive/route.ts` - API endpoint
3. `lib/google-drive.ts` - Drive API integrace

### Sheets Export Flow
1. `app/(dashboard)/overit/[id]/page.tsx` - Export trigger
2. `app/api/export-sheets/route.ts` - API endpoint
3. `lib/google-sheets.ts` - Sheets API integrace

### Data Validation
- `lib/validation.ts` - IČO (kontrolní součet), DIČ, datum, částka
- `app/(dashboard)/overit/[id]/page.tsx` - UI validace před uložením

---

## 🔄 DATA FLOW

```
1. User nahaje obrázek
   ↓
2. Upload do paměti (base64)
   ↓
3. OCR přes Claude API
   ↓
4. Upload originálního obrázku na Google Drive
   ↓
5. Uložení dat do Firestore
   ↓
6. Uživatel ověří data
   ↓
7. Export do Google Sheets
   ↓
8. Možnost importu do Pohody
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Před prvním spuštěním:
- [ ] Nainstaluj Node.js 18+
- [ ] Spusť `npm install`
- [ ] Vytvoř `.env.local` podle `.env.local.example`
- [ ] Zkontroluj všech 10 environment variables

### Lokální vývoj:
- [ ] Spusť `npm run dev`
- [ ] Otevři `http://localhost:3000`
- [ ] Přihlas se přes Google
- [ ] Otestuj nahrání účtenky

### Production deployment (Vercel):
- [ ] Push kódu na GitHub
- [ ] Importuj projekt do Vercel
- [ ] Nastav všechny Environment Variables
- [ ] Deploy
- [ ] Otestuj live URL

---

## 📊 VELIKOST PROJEKTU

- **Celkem souborů:** 29 (bez node_modules)
- **TypeScript/TSX:** 18 souborů
- **Config soubory:** 7 souborů
- **Dokumentace:** 3 soubory
- **Lines of Code:** ~3,500 řádků (odhadem)

---

## 🔒 BEZPEČNOSTNÍ SOUBORY

**Soubory které NESMÍ být v Gitu:**
- `.env.local` (již v .gitignore)
- `node_modules/` (již v .gitignore)

**Soubory které musí být v Gitu:**
- `.env.local.example` (vzor pro ostatní)
- Všechny ostatní soubory

---

## 📝 POZNÁMKY

- Všechny komponenty jsou **client-side** ('use client')
- API routes běží na **serveru** (Next.js API)
- **TypeScript** strict mode zapnutý
- **Tailwind** používá default konfiguraci
- **Firebase** používá Firestore v test mode (později production s rules)

---

**Aplikace je připravena k použití! 🎉**
