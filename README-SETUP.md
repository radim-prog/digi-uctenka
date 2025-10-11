# 🚀 NÁVOD K NASTAVENÍ DIGI-ÚČTENKA APLIKACE

Tento návod tě krok za krokem provede celým nastavením aplikace pro skenování účtenek. Je určený i pro lidi bez programovacích zkušeností.

---

## 📋 CO BUDEŠ POTŘEBOVAT

1. **Google účet** (pro Firebase, Drive a Sheets)
2. **Anthropic účet** (pro Claude AI)
3. **Vercel účet** (pro hosting aplikace - zdarma)
4. **Terminál** (na Macu je vestavěný, na Windows použij PowerShell)
5. **Node.js** (verze 18 nebo vyšší) - stáhni z [nodejs.org](https://nodejs.org)

---

## KROK 1: VYTVOŘ FIREBASE PROJEKT (15 minut)

### 1.1 Vytvoř nový projekt
1. Jdi na [console.firebase.google.com](https://console.firebase.google.com)
2. Klikni na **"Add project"** (Přidat projekt)
3. Zadej název projektu: `digi-uctenka` (nebo cokoliv jiného)
4. **VYPNI Google Analytics** (není potřeba pro naši aplikaci)
5. Klikni na **"Create project"**

### 1.2 Zapni Google Authentication
1. V levém menu klikni na **"Authentication"**
2. Klikni na **"Get started"**
3. Klikni na **"Sign-in method"** (Metody přihlášení)
4. Klikni na **"Google"** a **ZAPNI** ho (toggle switch)
5. Vyber svůj email jako **Project support email**
6. Klikni **"Save"**

### 1.3 Vytvoř Firestore databázi
1. V levém menu klikni na **"Firestore Database"**
2. Klikni na **"Create database"**
3. Vyber **"Start in test mode"** (později nastavíme security rules)
4. Vyber region: **europe-west3** (Frankfurt - nejblíž k ČR)
5. Klikni **"Enable"**

### 1.4 Získej Firebase konfiguraci
1. V levém menu klikni na ikonu **ozubeného kola** (Settings) > **"Project settings"**
2. Scrolluj dolů na **"Your apps"**
3. Klikni na ikonu **</>** (Web app)
4. Zadej název aplikace: `Digi-Uctenka Web`
5. **NEZAŠKRTÁVEJ** "Also set up Firebase Hosting"
6. Klikni **"Register app"**
7. **ZKOPÍRUJ SI** všechny hodnoty z `firebaseConfig` objektu:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",              // ← ZKOPÍRUJ
     authDomain: "xxx.firebaseapp.com",
     projectId: "xxx",
     storageBucket: "xxx.appspot.com",
     messagingSenderId: "123...",
     appId: "1:123..."
   };
   ```
8. Tyto hodnoty budeš potřebovat později pro `.env.local`

### 1.5 Nasaď Firestore Security Rules
1. V Firestore Database klikni na **"Rules"**
2. Smaž vše co tam je
3. Zkopíruj obsah souboru `firestore.rules` z našeho projektu
4. Vlož ho tam a klikni **"Publish"**

---

## KROK 2: ZÍSKEJ ANTHROPIC API KLÍČ (5 minut)

1. Jdi na [console.anthropic.com](https://console.anthropic.com)
2. Přihlas se svým Google účtem
3. V levém menu klikni na **"API Keys"**
4. Klikni **"Create Key"**
5. Zadej název: `Digi-Uctenka`
6. **ZKOPÍRUJ SI KLÍČ** (začíná `sk-ant-...`) - **POZOR:** Uvidíš ho jen jednou!
7. Ulož si ho někam bezpečně (budeš ho potřebovat pro `.env.local`)

### 💰 Poznámka k ceně
- Anthropic účtuje za použití: ~$3 za 1000 obrázků (velmi levné)
- Při registraci dostaneš **$5 zdarma** kredit
- To ti vystačí na ~1600 účtenek zdarma!

---

## KROK 3: NASTAV GOOGLE CLOUD (20 minut)

### 3.1 Vytvoř Google Cloud projekt
1. Jdi na [console.cloud.google.com](https://console.cloud.google.com)
2. V horní liště klikni na dropdown s názvem projektu
3. Klikni **"NEW PROJECT"**
4. Zadej název: `digi-uctenka`
5. Klikni **"CREATE"**
6. **Počkej** až se projekt vytvoří (30 sekund)
7. V horní liště **PŘEPNI** na tento nový projekt

### 3.2 Zapni Google Drive API
1. V levém menu klikni na **"APIs & Services"** > **"Library"**
2. Vyhledej **"Google Drive API"**
3. Klikni na něj a pak **"ENABLE"**

### 3.3 Zapni Google Sheets API
1. Stejně jako výše, vyhledej **"Google Sheets API"**
2. Klikni na něj a pak **"ENABLE"**

### 3.4 Vytvoř Service Account
1. V levém menu klikni na **"IAM & Admin"** > **"Service Accounts"**
2. Klikni **"CREATE SERVICE ACCOUNT"**
3. Zadej:
   - **Service account name:** `digi-uctenka-service`
   - **Description:** `Service account pro Digi-Uctenka aplikaci`
4. Klikni **"CREATE AND CONTINUE"**
5. V **"Grant this service account access to project"**:
   - Vyber **"Editor"** (nebo "Owner" pokud chceš full přístup)
6. Klikni **"CONTINUE"**
7. Klikni **"DONE"**

### 3.5 Vytvoř a stáhni JSON klíč
1. Najdi právě vytvořený Service Account v seznamu
2. Klikni na něj (na email adresu)
3. Jdi na záložku **"KEYS"**
4. Klikni **"ADD KEY"** > **"Create new key"**
5. Vyber **"JSON"**
6. Klikni **"CREATE"**
7. **STÁHNE SE** soubor (např. `digi-uctenka-xxxx.json`)
8. **OTEVŘI** tento soubor v textovém editoru
9. **ZKOPÍRUJ CELÝ OBSAH** (celý JSON) - budeš ho potřebovat pro `.env.local`

---

## KROK 4: VYTVOŘ GOOGLE SHEET PRO EXPORT (5 minut)

1. Jdi na [sheets.google.com](https://sheets.google.com)
2. Klikni **"Blank"** (prázdná tabulka)
3. Pojmenuj ji: **"Digi-Účtenka Export"**
4. **ZKOPÍRUJ SI ID SHEETU** z URL:
   ```
   https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0/edit
                                          ^^^^^^^^^^^^^^^^^^^
                                          TOHLE JE SHEET ID
   ```
5. **SDÍLEJ SHEET** se Service Accountem:
   - Klikni **"Share"** (Sdílet)
   - Vlož email Service Accountu (najdeš v tom JSON souboru, nebo v Google Cloud Console)
   - Email vypadá jako: `digi-uctenka-service@xxx.iam.gserviceaccount.com`
   - Nastav oprávnění na **"Editor"**
   - **NEZAŠKRTÁVEJ** "Notify people"
   - Klikni **"Share"**

---

## KROK 5: NASTAV LOKÁLNÍ PROSTŘEDÍ (10 minut)

### 5.1 Nainstaluj Node.js (pokud nemáš)
1. Jdi na [nodejs.org](https://nodejs.org)
2. Stáhni **LTS verzi** (doporučená)
3. Nainstaluj (běžná instalace, klikej Next)
4. Ověř v terminálu:
   ```bash
   node --version
   npm --version
   ```

### 5.2 Přejdi do složky projektu
```bash
cd "/Users/Radim/Library/CloudStorage/GoogleDrive-radim@wikiporadce.cz/Můj disk/claude code/Aplikace skenování účtenek"
```

### 5.3 Nainstaluj dependencies
```bash
npm install
```
(Může to trvat 2-5 minut)

### 5.4 Vytvoř `.env.local` soubor
1. Zkopíruj soubor `.env.local.example` a přejmenuj na `.env.local`
2. Otevři `.env.local` v textovém editoru
3. **DOPLŇ** všechny hodnoty:

```env
# Firebase Configuration (z KROKU 1.4)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=digi-uctenka-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=digi-uctenka-xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=digi-uctenka-xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Anthropic Claude API (z KROKU 2)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Google Cloud Service Account (z KROKU 3.5)
# DŮLEŽITÉ: Celý JSON na JEDEN řádek (odstraň mezery a nové řádky)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"digi-uctenka","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\nXXX\n-----END PRIVATE KEY-----\n","client_email":"digi-uctenka-service@xxx.iam.gserviceaccount.com",...}

# Google Sheet ID (z KROKU 4)
GOOGLE_SHEET_ID=1A2B3C4D5E6F7G8H9I0
```

**POZOR:**
- `GOOGLE_SERVICE_ACCOUNT_KEY` musí být **celý JSON na jednom řádku**
- Nezapomeň nahradit všechny `...` skutečnými hodnotami
- **NIKDY** nesdílej tento soubor veřejně (obsahuje tajné klíče!)

---

## KROK 6: SPUSŤ APLIKACI LOKÁLNĚ (TEST)

### 6.1 Spusť development server
```bash
npm run dev
```

### 6.2 Otevři v prohlížeči
1. Jdi na [http://localhost:3000](http://localhost:3000)
2. Měl bys vidět login obrazovku Digi-Účtenka
3. Klikni **"Přihlásit přes Google"**
4. Přihlas se svým Google účtem
5. Zkus nahrát testovací účtenku!

### 6.3 Testování
- **Přidej firmu:** Jdi na "Firmy" a přidej svou testovací firmu
- **Nahraj účtenku:** Klikni "Nahrát doklad" a vyfoť/nahraj účtenku
- **Ověř data:** Zkontroluj, jestli AI správně rozpoznala text
- **Zkontroluj Export:** Podívej se do Google Sheetu, jestli se tam data uložila

**Pokud vše funguje, jsi ready pro deployment! 🎉**

---

## KROK 7: NASAĎ NA VERCEL (PRODUCTION) (10 minut)

### 7.1 Připrav projekt pro Git
```bash
git init
git add .
git commit -m "Initial commit - Digi-Uctenka"
```

### 7.2 Vytvoř GitHub repository
1. Jdi na [github.com](https://github.com)
2. Klikni **"New repository"**
3. Název: `digi-uctenka`
4. **PRIVATE** (aby nikdo neviděl tvoje API klíče v kódu - i když jsou v .env)
5. Klikni **"Create repository"**
6. Spusť v terminálu:
```bash
git remote add origin https://github.com/TVOJEMENO/digi-uctenka.git
git branch -M main
git push -u origin main
```

### 7.3 Nasaď na Vercel
1. Jdi na [vercel.com](https://vercel.com)
2. Klikni **"Sign Up"** a přihlas se přes **GitHub**
3. Klikni **"Add New"** > **"Project"**
4. Najdi `digi-uctenka` repository a klikni **"Import"**
5. V **"Environment Variables"** přidej VŠECHNY proměnné z `.env.local`:
   - Klikni **"Environment Variables"**
   - Pro každý řádek z `.env.local`:
     - **Name:** Například `NEXT_PUBLIC_FIREBASE_API_KEY`
     - **Value:** Hodnota (např. `AIzaSy...`)
     - Klikni **"Add"**
   - **OPAKUJ** pro všech 10 proměnných!
6. Klikni **"Deploy"**
7. **Počkej** 2-3 minuty na build
8. Klikni na **"Visit"** a otestuj živou aplikaci!

### 7.4 Nastav custom doménu (volitelné)
1. V Vercel dashboardu klikni na svůj projekt
2. Jdi na **"Settings"** > **"Domains"**
3. Přidej svou doménu (např. `uctenky.mujweb.cz`)
4. Následuj instrukce pro DNS nastavení

---

## 🎯 HOTOVO! APLIKACE JE LIVE!

Tvoje Digi-Účtenka aplikace je nyní dostupná na internetu! 🚀

### Co dál?
1. **Sdílej odkaz** s kolegy/týmem
2. **Nahraj své první účtenky**
3. **Exportuj data do Pohody** (přes Google Sheets CSV export)

---

## 🆘 TROUBLESHOOTING (Časté problémy)

### ❌ "Authentication failed"
- **Příčina:** Špatně nastavený Firebase
- **Řešení:** Zkontroluj, jestli máš Google Authentication zapnutý ve Firebase Console

### ❌ "OCR API Error"
- **Příčina:** Neplatný nebo vypršelý Anthropic API klíč
- **Řešení:** Zkontroluj `ANTHROPIC_API_KEY` v `.env.local` nebo Vercel Environment Variables

### ❌ "Google Drive upload failed"
- **Příčina:** Chybný Service Account JSON nebo vypršelé oprávnění
- **Řešení:**
  1. Zkontroluj, jestli je `GOOGLE_SERVICE_ACCOUNT_KEY` správně zkopírovaný (celý JSON na jeden řádek)
  2. Zkontroluj, jestli jsou zapnuté Drive API a Sheets API v Google Cloud

### ❌ "Sheet not found"
- **Příčina:** Špatné `GOOGLE_SHEET_ID` nebo nesdílený sheet
- **Řešení:**
  1. Zkontroluj Sheet ID v URL
  2. Ověř, že jsi sdílel Sheet se Service Account emailem jako "Editor"

### ❌ "Module not found" po npm install
- **Příčina:** Staré cache nebo špatná Node.js verze
- **Řešení:**
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### ❌ Build failuje na Vercel
- **Příčina:** Chybějící environment variables
- **Řešení:** Zkontroluj, jestli máš VŠECH 10 proměnných nastavených ve Vercel

---

## 📞 PODPORA

Pokud narazíš na problém který tu není:
1. **Zkontroluj console v browseru** (F12 > Console) - často tam najdeš přesnou chybu
2. **Zkontroluj Vercel logs** (v dashboardu klikni na deployment a "View Function Logs")
3. **GitHub Issues:** Vytvoř issue s detailním popisem problému

---

## 🔐 BEZPEČNOST - DŮLEŽITÉ!

1. **NIKDY** necommituj `.env.local` do Gitu (už je v `.gitignore`)
2. **NIKDY** nesdílej své API klíče veřejně
3. Firebase Security Rules jsou nastavené tak, že každý uživatel vidí jen svoje data
4. Service Account má přístup jen k Drive a Sheets (ne k celému Google účtu)
5. Anthropic API klíč rotuj každých 6 měsíců (vytvoř nový, smaž starý)

---

## 📈 MONITORING A LIMITY

### Anthropic API
- **Free tier:** $5 kredit (~1600 účtenek)
- **Pay-as-you-go:** $3/1000 obrázků
- **Monitoring:** [console.anthropic.com](https://console.anthropic.com) > Usage

### Firebase
- **Free tier (Spark):**
  - 50K reads/day (dostatečné pro většinu použití)
  - 20K writes/day
  - 1 GB storage
- **Monitoring:** Firebase Console > Usage and billing

### Vercel
- **Free tier (Hobby):**
  - 100 GB bandwidth/měsíc
  - Unlimited deployments
- **Monitoring:** Vercel Dashboard > Analytics

---

**Hodně štěstí s Digi-Účtenkou! 💙**

Pokud ti tento návod pomohl, dej hvězdu na GitHubu! ⭐
