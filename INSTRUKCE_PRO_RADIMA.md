# 🔥 CO MUSÍŠ UDĚLAT (5 minut)

## Krok 1: Nasaď Storage Rules v prohlížeči

### Otevři v Chrome s Commet AI:
```
https://console.firebase.google.com/project/_/storage/rules
```

### Zkopíruj tento kód a vlož do editoru:
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

### Klikni **Publish**

---

## Krok 2: Vytvoř Firestore Indexy

### V aplikaci:
1. Otevři http://localhost:3001
2. Přejdi na stránku **Doklady**
3. Otevři Console (F12)
4. Najdi červenou chybu s odkazem na Firebase Console
5. **Klikni na odkaz** (otevře se Firebase Console)
6. Klikni **Create Index**
7. Počkej 1-2 minuty
8. Refreshni aplikaci

---

## Krok 3: Otestuj upload velkého PDF

1. Přejdi na **Nahrát**
2. Vyber PDF větší než 1 MB (třeba ten 862 kB soubor)
3. Sleduj console (F12)
4. Mělo by to projít bez chyby!

**Co hledat v console:**
```
✓ PDF (X.XX MB) - posílám přímo na Gemini
✓ Soubor nahrán do Firebase Storage: https://...
```

---

## ✅ Pokud vše funguje:

Aplikace je **100% funkční** s Firebase Storage!

- ✅ PDF až 25 MB bez komprese
- ✅ Soubory v Storage, ne v Firestore
- ✅ Žádný 1 MB limit
- ✅ Cancel tlačítko funguje

---

## ❌ Pokud něco nefunguje:

**Pošli mi screenshot console (F12) a řeknu ti co je špatně!**
