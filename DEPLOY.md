# Návod k nasazení Firebase Storage a Firestore indexů

## 1. Firebase Storage Rules

1. Otevřít [Firebase Console](https://console.firebase.google.com/)
2. Vybrat projekt
3. Přejít na **Storage** → **Rules**
4. Zkopírovat tento kód:
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
5. Vložit do editoru a kliknout **Publish**

---

## 2. Firestore Indexy

1. Spustit aplikaci a otevřít stránku **Doklady**
2. Otevřít browser console (F12)
3. Najít chybovou hlášku s odkazem (červená chyba)
4. **Kliknout na odkaz** - otevře Firebase Console
5. Kliknout **Create Index** (index se vytvoří automaticky)
6. Počkat 1-2 minuty na dokončení
7. Refreshnout aplikaci

---

## 3. Testování

Po nasazení rules a indexů:

### Test 1: Upload souboru
1. Otevřít aplikaci na http://localhost:3001
2. Přejít na stránku **Nahrát**
3. Vybrat velký PDF (>1 MB, ale <25 MB)
4. Sledovat console (F12) pro logy:
   ```
   ✓ PDF (X.XX MB) - posílám přímo na Gemini
   ✓ Soubor nahrán do Firebase Storage: https://...
   ```

### Test 2: Zobrazení dokladu
1. Po uploadu přejít na stránku **Ověřit**
2. Zkontrolovat, že se soubor zobrazuje správně
3. Ověřit rotaci a zoom funguje

### Test 3: Firestore indexy
1. Přejít na stránku **Doklady**
2. Pokud se zobrazí chyba v console, kliknout na odkaz k vytvoření indexu
3. Počkat 1-2 minuty na build indexu
4. Refreshnout stránku

---

## 4. Co se změnilo?

### ✅ Vyřešeno:
- **Firestore 1 MB limit** - Soubory se ukládají do Firebase Storage, ne do Firestore
- **PDF komprese** - Gemini 2.5 Flash podporuje až 25 MB, není potřeba komprimovat
- **Google Drive dependency** - Nahrazeno Firebase Storage

### ⚠️ Vyžaduje ruční krok:
- Nasazení Storage rules do Firebase Console
- Vytvoření Firestore indexů (při prvním běhu queries)

---

## 5. Struktura Firebase Storage

Soubory se ukládají v této struktuře:
```
doklady/
  {název firmy}/
    {rok}/
      {datum}_{číslo dokladu}.pdf
      {datum}_{číslo dokladu}.jpg
```

Příklad:
```
doklady/
  Moje firma s.r.o./
    2025/
      2025-01-15_FAK2025001.pdf
      2025-01-16_FAK2025002.jpg
```

---

## 6. Troubleshooting

### Problém: "Permission denied" při uploadu
**Řešení:** Zkontrolovat Storage rules jsou nasazeny

### Problém: "Index not found" v Firestore
**Řešení:** Vytvořit index kliknutím na odkaz v chybové hlášce

### Problém: Soubor se nenahrál do Storage
**Řešení:**
1. Zkontrolovat `.env.local` má správný `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
2. Zkontrolovat user je přihlášený
3. Zkontrolovat console pro detailní error
