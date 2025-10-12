# Changelog - Digi-Účtenka

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
