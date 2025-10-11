# Changelog - Digi-Účtenka

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
