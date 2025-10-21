# Požadavky a rozhodnutí - Digi-Účtenka v1.4

> Tento dokument obsahuje všechny požadavky, rozhodnutí a brainstorming z vývoje verze 1.4

## 🎯 Hlavní cíle verze 1.4

1. ✅ Vyřešit problém s nekvalitním OCR u obrázků (komprese ničila text)
2. ✅ Zlepšit spolehlivost rozpoznávání datumů
3. ✅ Přidat admin panel pro správu uživatelů
4. ✅ Implementovat whitelist systém
5. ✅ Detailní error messages pro debugging

---

## 📋 Problém: Obrázky vs PDF

### Původní stav
- **PDF**: fungují dobře ✅
- **JPG/PNG/HEIC**: komprimace na 0.95 MB ničí kvalitu → špatné OCR ❌

### Zjištěné fakty
- Gemini 2.5 Flash podporuje až 25 MB
- PDF viewer funguje spolehlivě
- JPG preview je nestabilní

### Diskutované varianty

**Varianta A: OCR velké, uložit malé**
- Pošli 20 MB na OCR (dobrá kvalita)
- Zkomprimuj na 2-3 MB před uložením
- ❌ Uživatel neuvidí 100% originál

**Varianta B: Jen data, žádné soubory**
- Uložit pouze extrahovaná data
- Originály jen na Google Disku (manuálně)
- ❌ V aplikaci žádný náhled

**Varianta C: Všechno PDF** ✅ **ZVOLENO**
- Konvertuj JPG/HEIC → PDF (5-8 MB)
- PDF pošli na Gemini
- Ulož PDF do Firebase Storage
- ✅ Jednotný formát, fungující preview, lepší OCR

### Implementované řešení
```typescript
// 1. HEIC/JPG/PNG → PDF (cíl 5 MB)
const pdfBlob = await convertImageToPDF(file, 5);

// 2. PDF → Gemini OCR
const base64 = await fileToBase64(pdfBlob);
const data = await geminiOCR(base64, 'application/pdf');

// 3. Ulož PDF do Firebase Storage
await uploadBytes(storageRef, pdfBlob);
```

---

## 🔁 Retry OCR - Pojistka proti chybějícím datům

### Problém
- Datumy často chybějí (různé formáty)
- Gemini občas přehlédne pole

### Řešení
1. První OCR: standardní prompt (všechna data)
2. Validace: kontrola povinných polí
3. Pokud chybí → druhé OCR s targeted promptem
4. Merge výsledků

### Náklady
- 1. pokus: $0.0026 (vždycky)
- 2. pokus: $0.0026 (jen když chybí data)
- **Max:** $0.0052 za doklad (12 haléřů)

**Rozhodnutí:** Implementovat jako pojistku (lepší než nefunkční data)

---

## 👥 Admin panel a whitelist

### Požadavky
- Administrátor: `radim@wikiporadce.cz`
- User: `veronika@wikiporadce.cz`
- Možnost přidávat další uživatele přes UI
- Změna rolí (admin ↔ user)
- Všichni vidí všechny firmy a doklady (žádná izolace)

### Firestore struktura
```javascript
// Kolekce: allowed_users/{email}
{
  email: "radim@wikiporadce.cz",
  role: "admin", // nebo "user"
  addedBy: "system",
  addedAt: timestamp
}
```

### Security Rules
```javascript
function isAllowedUser() {
  return exists(/databases/$(database)/documents/allowed_users/$(request.auth.token.email));
}

function isAdmin() {
  return get(/databases/$(database)/documents/allowed_users/$(request.auth.token.email)).data.role == 'admin';
}

// Všechny kolekce
allow read, write: if isAllowedUser();

// Admin panel
allow write: if isAdmin(); // jen admin může měnit uživatele
```

### UI
- Stránka: `/admin/users`
- Seznam uživatelů s rolemi
- Formulář: email + role
- Tlačítka: Odstranit, Změnit roli
- Ochrana: nemůžeš smazat/změnit vlastní účet

---

## 💰 Náklady - Přesný výpočet

### Gemini 2.5 Flash pricing (leden 2025)
- Input: $0.30 / 1M tokenů
- Output: $2.50 / 1M tokenů

### 1 doklad
- Input: ~2100 tokenů (obrázek 1290 + prompt 800)
- Output: ~800 tokenů (JSON)
- **Cena: $0.0026** (6 haléřů)

### 1500 dokladů/měsíc
- OCR: 1500 × $0.0026 = **$3.90** (90 Kč)
- Storage: 7.5 GB
  - Free tier: 5 GB
  - Nad limit: 2.5 GB × $0.026 = **$0.065** (1.5 Kč)
- **Celkem: $3.96/měsíc** (91 Kč)

### Předchozí chybný odhad
- ~~$0.50/měsíc~~ ❌ (byl špatně)
- Správně: **$3.96/měsíc** ✅

---

## 🛡️ Error handling požadavky

### Požadavek
> "Chce to nastavit hodně chybových hlášek abychom věděli když bude něco špatně a co to je"

### Implementované error typy
1. **API Key invalid** → "Zkontroluj GEMINI_API_KEY v .env.local"
2. **Quota exceeded** → "Překročen denní limit, zkus za chvíli"
3. **Firebase permission** → "Zkontroluj Security Rules a přihlášení"
4. **Network error** → "Zkontroluj připojení k internetu"
5. **Timeout** → "Časový limit vypršel - soubor je příliš velký"
6. **JSON parse** → "AI vrátila nevalidní odpověď - zkus znovu"

### HTTP status kódy
- 401: Unauthorized (špatný API klíč)
- 403: Forbidden (Firebase permissions)
- 408: Timeout
- 429: Too Many Requests (quota)
- 502: Bad Gateway (nevalidní AI odpověď)
- 503: Service Unavailable (síť)

### Response format
```json
{
  "success": false,
  "error": "Překročen denní limit Gemini API",
  "details": "Zkus to za chvíli nebo upgradni Gemini plán",
  "timestamp": "2025-10-21T19:00:00.000Z"
}
```

---

## 📦 Storage strategie

### Rozhodnutí
- **Google Disk**: originály (záloha, ruční správa)
- **Firebase Storage**: PDF 5 MB (pro zobrazení v aplikaci)
- **Firestore**: extrahovaná data (dodavatel, částky, atd.)

### Proč Firebase Storage?
- Bez něj nelze zobrazit doklad v aplikaci (stránka "Ověřit")
- 5 MB × 1000 dokladů = 5 GB (free tier!)
- PDF preview funguje dobře

### Limity
- Upload: max 20 MB
- PDF output: cíl 5 MB
- Firebase free tier: 5 GB

---

## 🔐 Bezpečnost

### Přístup
- Whitelist: pouze povolené emaily v `allowed_users`
- Google Sign-in: ověřené účty
- Firestore rules: server-side (nelze obejít)

### Filosofie
> "Nejsme zajímaví ani důležití, whitelist stačí"

- Žádná platební karta
- Žádná citlivá hesla
- Účetní data nejsou kritická (lze poslat emailem)
- **Přístup: praktičnost > paranoia**

---

## 🚀 Deployment postup

### 1. První nasazení
```bash
# Deploy Firestore rules
firebase deploy --only firestore

# Inicializuj admin účty
npm run init-admin

# Start aplikace
npm run dev
```

### 2. Přidání dalších uživatelů
- Přihlaš se jako admin
- Jdi na `/admin/users`
- Přidej email + role
- Hotovo!

### 3. Změna role
- V admin panelu změň select box
- Automatic save
- Uživatel musí obnovit stránku

---

## 📝 Technické změny

### Nové soubory
- `lib/image-to-pdf.ts` - Konverze obrázků
- `app/(dashboard)/admin/users/page.tsx` - Admin panel
- `scripts/init-admin.js` - Init script

### Změněné soubory
- `lib/gemini-ocr.ts` - Prompt + retry
- `app/api/ocr/route.ts` - Error handling
- `app/(dashboard)/nahrat/page.tsx` - PDF konverze
- `hooks/useAuth.ts` - Admin detection
- `firestore.rules` - Whitelist
- `package.json` - Version 1.4.0

### Odstraněno
- `browser-image-compression` import (nahrazeno PDF konverzí)
- Stará `fileToBase64` funkce v `nahrat/page.tsx`
- Komprese na 0.95 MB logika

---

## ✅ Checklist dokončení

- [x] Konverze JPG/HEIC → PDF
- [x] Retry OCR funkce
- [x] Vylepšený prompt pro datumy
- [x] Detailní error handling
- [x] Admin panel UI
- [x] Whitelist Firestore rules
- [x] Init script pro admin
- [x] Aktualizace CHANGELOG
- [x] Aktualizace version
- [x] REQUIREMENTS.md dokument

---

## 🎓 Poučení pro budoucnost

### Co fungovalo
✅ Brainstorming před implementací
✅ Diskuze variant (A/B/C)
✅ Přesný výpočet nákladů
✅ Detailní error handling od začátku

### Co by se dalo lépe
⚠️ Testování konverze na PDF na reálných datech
⚠️ Měření velikosti výsledných PDF (může být i > 5 MB)
⚠️ Firebase CLI login test před deployment

### Další vylepšení (backlog)
- [ ] Automatický test OCR kvality (benchmark dataset)
- [ ] Dashboard s statistikami (úspěšnost OCR, průměrná doba)
- [ ] Notifikace emailem při chybě
- [ ] Bulk export všech dokladů

---

**Verze dokumentu:** 1.4 (2025-10-21)
**Poslední update:** Radim + Claude Code
