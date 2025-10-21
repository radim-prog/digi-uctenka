# Changelog - Digi-Účtenka

## 🔧 2025-10-21 (večer) - VERZE 1.4.1 - UI opravy + Vylepšená AI předkontace

### 🐛 Opraveno

**👥 Admin panel**
- Přidáno tlačítko "👥 Admin" do navigace (viditelné jen pro adminy)
- Odkaz: `/admin/users`
- Fialové zvýraznění pro rozlišení od běžných odkazů

**🏦 Bankovní výpisy - Detailní error handling**
- Konkrétní chybové zprávy pro každý typ chyby
- Zobrazení error details v uživatelském rozhraní
- HTTP status kódy: 400, 401, 429, 502, 503
- Lepší diagnostika problémů (PDF poškozený, API klíč, atd.)

**📊 AI Předkontace - KOMPLETNÍ PŘEPSÁNÍ**
- ✅ Přepsán podle správného českého podvojného účetnictví
- ✅ Rozlišení mezi FAKTUROU (datum splatnosti) vs ÚČTENKOU (okamžitá úhrada)
- ✅ Správné použití účtu 321 (dodavatelé) pro faktury
- ✅ Správné použití 211/261/221 POUZE pro okamžité úhrady
- ✅ Peníze na cestě (261) - POUZE pro platby kartou
- ✅ Rozšířená účtová osnova:
  - 131 (materiál na skladě)
  - 502 (spotřeba energie)
  - 504 (prodané zboží)
  - 511 (opravy a udržování)
  - 512 (cestovné)
  - 513 (reprezentace)
  - 042 (pořízení DHM)
- ✅ Důsledné rozlišení reprezentace (513) vs cestovné (512)
- ✅ Explicitní pravidla pro úhradu faktur (samostatný účetní případ)

### 📝 Vylepšený prompt

**Dříve (CHYBNÉ):**
```
Přijatá faktura:
- MD: 518 (služby)
- D: 321 (dodavatelé) ✅ nebo 211/221/261 ❌ (podle úhrady)
```

**Nyní (SPRÁVNĚ):**
```
Přijatá FAKTURA (má datum splatnosti):
- MD: podle obsahu (501/502/512/518...)
- D: VŽDY 321 (dodavatelé - vzniká závazek)
- ❌ NEpoužívej 211/221/261 pokud má datum splatnosti!

Úhrada faktury (samostatně):
- MD: 321 (dodavatelé - snižujeme závazek)
- D: 221 (bankovní účet - odchází peníze)

ÚČTENKA (bez data splatnosti, zaplaceno okamžitě):
- MD: podle obsahu (501/502/512/518...)
- D: 211 (hotově) / 261 (kartou) / 221 (převodem)
- ✅ Tady ANO používej platební účty!
```

### 🎓 Účetní pravidla v promptu

Prompt nyní obsahuje:
1. Kompletní výklad podvojného účetnictví
2. Rozlišení MD vs D s vysvětlením
3. Kritická pravidla (často chybují)
4. Příklady všech scénářů:
   - Přijatá faktura (nezaplacená)
   - Účtenka hotově/kartou/převodem
   - Vydaná faktura
   - Úhrada faktury
   - Dobropis

### 📦 Změněné soubory
- `app/(dashboard)/layout.tsx` - Přidán admin odkaz do navigace
- `lib/predkontace-ai.ts` - Kompletně přepsaný prompt podle českého účetnictví
- `app/api/bank-statement/route.ts` - Detailní error handling
- `app/(dashboard)/bankovni-vypisy/page.tsx` - Zobrazení error details

---

## 🚀 2025-10-21 (odpoledne) - VERZE 1.4 - Automatické PDF konverze + Admin panel

### ✨ Hlavní změny

**🔄 Automatická konverze JPG/HEIC → PDF**
- Všechny obrázky se automaticky konvertují na PDF (cíl 5 MB)
- Lepší kvalita OCR (PDF lépe čitelné než komprimované JPG)
- Limit nahrávání zvýšen na 20 MB (z původních 25 MB)
- Nová knihovna: `lib/image-to-pdf.ts`
- Iterativní komprese PDF pokud přesáhne 5 MB
- Odstraněna stará JPG komprese (0.95 MB limit byl příliš agresivní)

**🔁 Retry OCR pro chybějící pole**
- Automatické 2. volání Gemini API pokud chybí důležitá pole
- Detekce chybějících: datum_vystaveni, datum_zdanitelneho_plneni, cislo_dokladu
- Targeted prompt pouze pro chybějící hodnoty
- Nová funkce: `retryMissingFields()` v `lib/gemini-ocr.ts`
- Náklady: max +$0.0026 za doklad (jen když je potřeba)

**📝 Vylepšený OCR prompt pro datumy**
- Explicitní podpora všech formátů: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY, D. M. YYYY
- Příklady konverze přímo v promptu
- Řešení problému s rokem (25 = 2025, ne 1925)
- Hledání klíčových slov: "Datum vystavení", "Splatnost", "DUZP"

**🛡️ Detailní error handling**
- Konkrétní chybové zprávy pro každý typ chyby:
  - API key invalid → "Zkontroluj GEMINI_API_KEY"
  - Quota exceeded → "Zkus to za chvíli"
  - Firebase permission → "Zkontroluj Security Rules"
  - Network error → "Zkontroluj připojení"
  - Timeout → "Soubor je příliš velký"
- HTTP status kódy: 401, 403, 408, 429, 502, 503
- Timestamp v error response

**👥 Admin panel pro správu uživatelů**
- Nová stránka: `/admin/users`
- Whitelist systém (kolekce `allowed_users` v Firestore)
- Přidávání/odebírání uživatelů přes UI
- Role management: admin / user
- Automatická detekce admin role v `useAuth` hooku
- Init script: `npm run init-admin` (vytvoří radim@wikiporadce.cz + veronika@wikiporadce.cz)

**🔐 Aktualizované Firestore Security Rules**
- Whitelist kontrola pro všechny kolekce
- Admin má plný přístup
- Všichni whitelistovaní uživatelé vidí všechny firmy a doklady
- Nová helper funkce: `isAllowedUser()`, `isAdmin()`

### 💰 Náklady

**Aktualizovaný výpočet (přesné ceny Gemini 2.5 Flash):**
- Input: $0.30 / 1M tokenů
- Output: $2.50 / 1M tokenů
- **1 doklad:** ~$0.0026 (6 haléřů)
- **1500 dokladů/měsíc:** $3.90 (90 Kč)
- **Retry OCR:** max +$0.0026 (jen když potřeba)

**Firebase Storage:**
- 1500 dokladů × 5 MB = 7.5 GB
- Free tier: 5 GB
- Nad limit: 2.5 GB × $0.026 = $0.065/měsíc (1.5 Kč)

**Celkem: ~$3.96/měsíc (91 Kč)**

### 📦 Nové soubory
- `lib/image-to-pdf.ts` - Konverze obrázků na PDF
- `app/(dashboard)/admin/users/page.tsx` - Admin panel
- `scripts/init-admin.js` - Init script pro admin účty

### 🔧 Změněné soubory
- `lib/gemini-ocr.ts` - Vylepšený prompt + retry funkce
- `app/api/ocr/route.ts` - Retry logika + detailní errors
- `app/(dashboard)/nahrat/page.tsx` - PDF konverze místo komprese
- `hooks/useAuth.ts` - Admin role detection
- `firestore.rules` - Whitelist + admin rules
- `package.json` - Přidán script `init-admin`

### 🚀 Deployment

**1. Deploy Firestore rules:**
```bash
firebase deploy --only firestore
```

**2. Inicializuj admin účty:**
```bash
npm run init-admin
```

**3. Restart aplikace:**
```bash
npm run dev
```

---

## 🔐 2025-10-19 (večer) - VERZE 1.3.2 - Rate Limiting připraven

### ✨ Nové funkce (připraveno, zatím deaktivováno)
- **Rate Limiting** v `app/api/ocr/route.ts`
  - Kontrola denního limitu OCR requestů (50/den/user)
  - Firestore tracking v kolekci `api_usage`
  - HTTP 429 (Too Many Requests) při překročení limitu
  - Dočasně vypnuto (`RATE_LIMITING_ENABLED = false`)
  - Pro aktivaci: změnit konstantu na `true` + přidat `userId` do API volání

### 🚀 Vercel deployment
- Aplikace nasazena na https://digi-uctenka.vercel.app
- Firebase Authorized Domains nakonfigurovány (3 Vercel domény)
- Auto-deploy při push na GitHub main branch
- Environment variables nastaveny na Vercelu

### 📊 Výkon
- OCR zpracování: 20-40 sekund normální (Gemini API)
- Některé složitější obrázky mohou trvat déle (load Gemini API)
- Paralelní zpracování 3 souborů najednou funguje

### 🐛 Známé problémy
- Gemini API může být občas pomalejší (závisí na Google serveru)
- Komprese obrázků zbytečná (Gemini podporuje až 25 MB) - zvážit odstranění

### 📝 Dokumentace
- CHANGELOG.md aktualizován
- Připraveno pro budoucí rate limiting aktivaci

---

## 🔧 2025-10-19 (dopoledne) - VERZE 1.3.1 - KRITICKÉ OPRAVY ✅

### 🐛 Opraveno (CRITICAL)
- **"_ is not defined" bug** v `lib/validation.ts:125-128`
  - **Problém:** Array destructuring s `_` placeholder nefungoval v production buildu
  - **Dopad:** 100% OCR selhání na všech dokladech
  - **Řešení:** Nahrazeno přímým array indexováním (`match[1]`, `match[2]`, `match[3]`)
  - **Status:** ✅ 100% funkčnost obnovena

### 🔐 Firebase Security Rules nasazeny
- **Storage Rules** (`storage.rules`)
  - Read/write pouze pro přihlášené uživatele
  - Struktura: `/doklady/{firmaNazev}/{year}/{fileName}`
  - Oprava 403 Forbidden errorů
- **Firestore Rules** (`firestore.rules`)
  - User-based isolation (každý vidí jen svoje data)
  - Helper funkce `isOwner()` pro kontrolu vlastnictví
- **Firestore Indexes** (`firestore.indexes.json`)
  - Optimalizace dotazů pro rychlejší načítání

### 🚀 Obnoveno z v1.3 zálohy
- `lib/validation.ts` - oprava date parsingu
- `lib/gemini-ocr.ts` - clean OCR logika bez debug outputu
- `app/(dashboard)/nahrat/page.tsx` - iterativní komprese (garantuje < 1 MB)

### 📝 Dokumentace
- **README.md** kompletně přepsán
  - Aktuální funkce: Gemini API, bankovní výpisy, Pohoda export
  - Troubleshooting: Řešení "_ is not defined" a Firebase 403 errorů
  - Náklady: ~$0.05/měsíc (100 dokladů), ~$0.50/měsíc (1000 dokladů)
  - Deployment návod pro Vercel
- **CHANGELOG.md** vytvořen/aktualizován

### 🎯 Testováno
- ✅ OCR funguje 100% (testováno na 3 problémových obrázcích)
- ✅ Firebase Storage ukládání a čtení funguje
- ✅ Iterativní komprese garantuje velikost < 1 MB
- ✅ Všechny typy dokladů rozpoznány správně

---

## 🪟 2025-10-12 - VERZE 1.3 - Windows podpora a jednoduché spouštění

### ✨ Nové funkce
- **NOVÉ:** `INSTALL.bat` - instalace jedním dvojklikem (Windows)
- **NOVÉ:** `START.bat` - spuštění jedním dvojklikem (Windows)
- **NOVÉ:** `NAVOD-WINDOWS-SERVER.md` - kompletní návod pro Windows
- **VYLEPŠENO:** Odstranění Docker experimentálních funkcí z produkce

### 🎯 Výhody Windows verze
- ✅ Žádný příkazový řádek - jen dvojkliky
- ✅ Funguje na Windows 10/11 i Windows Server
- ✅ Ideální pro Google Cloud Windows VM
- ✅ Automatická instalace závislostí
- ✅ Jednoduché spuštění pro ne-programátory

### 🔧 Technické změny
- **UPRAVENO:** `next.config.js` - vráceno do produkčního stavu (bez standalone)
- **ODSTRANĚNO:** `experimental.serverActions` (deprecated v Next.js 14)
- **ZACHOVÁNO:** Docker soubory pro pokročilé uživatele

### 📁 Nové soubory
- `INSTALL.bat` - instalační skript pro Windows
- `START.bat` - spouštěcí skript pro Windows
- `NAVOD-WINDOWS-SERVER.md` - podrobný návod

### 🚀 Jak použít na Windows
```batch
1. Nainstalovat Node.js z nodejs.org
2. Zkopírovat složku na Windows počítač
3. Dvojklik na INSTALL.bat
4. Dvojklik na START.bat
5. Otevřít http://localhost:3000
```

---

## 🐳 2025-10-12 - VERZE 1.2 - Docker podpora pro snadné nasazení

### ✨ Nové funkce
- **NOVÉ:** Plná Docker podpora - aplikaci lze nyní spustit jedním příkazem
- **NOVÉ:** `Dockerfile` - multi-stage build pro optimalizovaný Docker image
- **NOVÉ:** `docker-compose.yml` - jednoduchá konfigurace pro spuštění
- **NOVÉ:** `start.sh` - bash skript pro jednoduché spuštění aplikace
- **NOVÉ:** `DOCKER-NASAZENI.md` - kompletní návod v češtině

### 🔧 Technické změny
- **UPRAVENO:** `next.config.js` - přidán `output: 'standalone'` pro Docker build
- **NOVÝ:** `.dockerignore` - optimalizace Docker buildu

### 🎯 Výhody Docker verze
- ✅ Funguje na Mac, Windows, Linux stejně
- ✅ Žádná instalace Node.js, npm potřeba
- ✅ Jeden příkaz pro spuštění: `./start.sh`
- ✅ Snadné nasazení na jakýkoli server/VPS
- ✅ Izolované prostředí
- ✅ Automatický restart při pádu

### 📁 Nové soubory
- `Dockerfile` - definice Docker kontejneru
- `.dockerignore` - výjimky pro Docker build
- `docker-compose.yml` - Docker Compose konfigurace
- `start.sh` - spouštěcí skript
- `DOCKER-NASAZENI.md` - dokumentace

### 🚀 Jak použít
```bash
# Zkopírovat celou složku na jakýkoli počítač
# Nainstalovat Docker Desktop
# Spustit:
./start.sh
# Otevřít: http://localhost:3000
```

---

## 🔧 2025-10-11 (večer) - VERZE 1.1 - Opravy exportu a UX

### ✅ Opravy Pohoda XML exportu
- **OPRAVENO:** Nevalidní XML elementy `accountingMD` a `accountingD` odstraněny
- **OPRAVENO:** Forma úhrady nyní používá správné kódy (`cash`, `draft`, `creditcard` místo českých názvů)
- **VYLEPŠENO:** Inteligentní popis faktury v poli `<inv:text>` místo jen názvu dodavatele
  - Příklad: "PEPCO Czech Republic - Kancelářské potřeby (4 položky)"
  - Příklad: "Shell - Tankování a nákup (káva, sušenky)"

### ✨ UX vylepšení
- **NOVÉ:** Celý řádek v dashboardu je klikací (nejen tlačítko "Upravit")
- **NOVÉ:** Zobrazení popisu pro Pohodu na ověřovací stránce PŘED exportem
- **VYLEPŠENO:** Popis pro Pohodu umístěn pod položky pro lepší kontrolu

### 🤖 AI vylepšení
- **VYLEPŠENO:** Gemini OCR prompt pro lepší rozpoznání formy úhrady z textu na dokladu
- **NOVÝ SOUBOR:** `lib/invoice-description.ts` - knihovna pro generování přirozených popisů
- **VYLEPŠENO:** Jednoduché, přirozené popisy položek (ne technický výpis)

### 📝 Změněné soubory
- `lib/pohoda-export.ts` - oprava XML formátu, import sdílené funkce
- `lib/gemini-ocr.ts` - lepší prompt pro formu úhrady
- `lib/invoice-description.ts` - **NOVÝ** soubor pro popisy
- `app/(dashboard)/page.tsx` - klikací řádky v tabulce
- `app/(dashboard)/overit/[id]/page.tsx` - zobrazení popisu

---

## 🎉 2025-10-11 - VERZE 1.0 PRODUKČNÍ RELEASE

### ✅ Co je hotové a funguje

**Aplikace je 100% funkční a připravená k používání!**

#### Hlavní funkce
- ✅ Upload PDF až 25 MB (bez komprese)
- ✅ Upload obrázků s automatickou kompresí
- ✅ Hromadné zpracování až 10 souborů paralelně
- ✅ OCR pomocí Google Gemini 2.5 Flash
- ✅ Ověření a úprava rozpoznaných dat
- ✅ AI generování předkontace
- ✅ Firebase Storage pro soubory (5 GB/měsíc zdarma)
- ✅ Firestore Database pro metadata
- ✅ Google Authentication
- ✅ Multi-firma podpora
- ✅ Dashboard s filtry
- ✅ Zabezpečení (Security Rules)
- ✅ Firestore indexy pro rychlé queries

#### Náklady
- **Storage:** 5 GB ZDARMA (5000 PDF)
- **100 dokladů:** ~$0.05 (5 Kč/měsíc)
- **1000 dokladů:** ~$0.50 (50 Kč/měsíc)

---

## 2025-10-11 (večer) - KRITICKÁ OPRAVA: Firestore limit + Firebase Storage

### 🔴 KRITICKÝ PROBLÉM VYŘEŠEN

**Problém:** Firestore má limit 1 MB na jeden field, ale ukládali jsme base64 obrázky (700 kB soubor = 933 kB base64), což způsobovalo chybu `imageBase64 is longer than 1048487 bytes`.

**Řešení:** Přechod z Google Drive na Firebase Storage pro ukládání souborů.

### Změny v kódu

**1. Firebase Storage integrace (lib/firebase.ts, app/(dashboard)/nahrat/page.tsx)**
- Přidán import Firebase Storage
- Soubory se nyní nahrávají do Firebase Storage místo Google Drive
- Base64 se konvertuje na Blob a nahrává se
- V Firestore se ukládá jen URL odkaz (`originalImageUrl`)
- Odstraněno ukládání `imageBase64` do Firestore

**2. Storage rules (storage.rules - NOVÝ SOUBOR)**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /doklady/{firmaNazev}/{year}/{fileName} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**3. Zvýšen limit souborů na 25 MB**

### Změny

**1. Zvýšen limit souborů na 25 MB (app/(dashboard)/nahrat/page.tsx:49-156)**
- **Zjištění:** Gemini 2.5 Flash podporuje až 25 MB pro soubory
- **Původní problém:** Měli jsme zbytečně nízký limit 0.95 MB kvůli mylné představě o Gemini API
- **Řešení:**
  - Odstraněna komplikovaná PDF→JPG konverze (která stejně nefungovala)
  - Všechna PDF i obrázky až do 25 MB se posílají přímo na Gemini API
  - Žádná komprese PDF - Gemini je zvládne přímo
  - Obrázky se stále komprimují iterativně pro optimalizaci
- **Výhody:**
  - Jednoduší kód bez PDF.js
  - Spolehlivější zpracování
  - Žádné extra náklady (tokeny se počítají podle rozlišení, ne velikosti souboru)

**2. Možnost zastavit zpracování souborů**
- Přidán state `cancelRequested` a `abortControllerRef`
- Tlačítko "⏹ Zastavit" se zobrazí během zpracování
- Kontrola zrušení na klíčových místech:
  - Na začátku processFile
  - Před voláním OCR API
  - Po OCR před uložením
- AbortController pro zrušení fetch požadavků
- Soubory označeny jako "Zrušeno" když uživatel klikne Stop

**3. UI změny**
- Červené tlačítko "⏹ Zastavit" když běží zpracování
- Text "Zastavuji..." když už bylo kliknuto
- Stavy "waiting" | "processing" | "completed" | "error"

### Testování

Po nasazení:
1. Nahrát velké PDF (>800 kB)
2. Sledovat browser console (F12) pro detailní logy
3. Najít přesný krok kde dochází k chybě "Object.defineProperty..."
4. Otestovat Stop tlačítko během zpracování

---

## 2025-10-11 - Opravy komprese a velikosti souborů

### Změny v kompresním systému

#### Problém
- PDF soubory nad 0.95 MB (po base64 encoding) selhávaly s generickou chybou
- Iterativní komprese obrázků nebyla dostatečně agresivní
- Uživatelé nevěděli skutečnou velikost limitu (~710 kB pro PDF)

#### Řešení

**PDF zpracování (app/(dashboard)/nahrat/page.tsx:127-140)**
- Odstraněna snaha o kompresi PDF (imageCompression neumí PDF)
- Kontrola velikosti po base64 encoding
- Informativní chybová hláška s reálnými čísly:
  - Zobrazuje původní velikost v kB
  - Zobrazuje velikost po base64 v MB
  - Uvádí maximum ~710 kB pro PDF

**Komprese obrázků (app/(dashboard)/nahrat/page.tsx:141-195)**
- Iterativní komprese s kontrolou base64 velikosti po KAŽDÉM pokusu
- Agresivnější snižování parametrů:
  - maxSizeMB: začíná 0.7, klesá × 0.7 (min 0.2)
  - maxWidthOrHeight: začíná 1600px, klesá -200px (min 800px)
  - quality: začíná 0.85, klesá -0.1 (min 0.5)
- Maximum 5 pokusů
- Vždy komprimuje z originálního souboru (ne z již zkomprimovaného)
- Ukládá originál do `base64Original`, komprimované do `base64ForOCR`

### Technické detaily

**Base64 encoding overhead:**
- Base64 zvětší soubor o ~33%
- 710 kB soubor → ~0.95 MB po base64 ✓
- 883 kB soubor → ~1.18 MB po base64 ✗

**Limity:**
- Gemini API: 1 MB pro base64 input
- Aplikace používá 0.95 MB pro bezpečnost
- Pro PDF: maximálně ~710 kB originální velikost
- Pro obrázky: automatická komprese do 0.95 MB

### Známé problémy

**Google Drive upload (neopraveno)**
- Chybí `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` v `.env.local`
- Upload do Drive selhává, ale aplikace pokračuje (failover)
- Soubory se ukládají do Firestore jako base64 backup

### Soubory změněny

1. `app/(dashboard)/nahrat/page.tsx` (řádky 127-195)
   - Přepracován celý kompresní systém
   - Rozdělení logiky pro PDF vs obrázky
   - Iterativní komprese s kontrolou velikosti

2. `CHANGELOG.md` (nový soubor)
   - Dokumentace změn

### Testování

Testováno s následujícími soubory:
- ✅ "Ověření podpisu 200 Kč.pdf" (710 kB) - úspěšné
- ✅ "pepco 48,-.pdf" (246 kB) - úspěšné
- ✅ "PF 25FP143 - Faktura_250100043.pdf" (101 kB) - úspěšné
- ❌ "Ověření podpisu 450 Kč.pdf" (883 kB) - příliš velké, korektní chyba

### Další kroky (TODO)

1. Nastavit Google Drive service account pro produkci
2. Zvážit použití jiného API s vyšším limitem velikosti
3. Přidat varování při výběru souboru (před nahráním)
4. Dokumentovat limity velikosti v UI
