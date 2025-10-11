# 🤖 Instrukce pro Commet AI - Vytvoření Firestore Indexů

## Problém
V console aplikace se zobrazují červené chyby:
```
FirebaseError: The query requires an index. You can create it here:
https://console.firebase.google.com/...
```

## Úkol
Klikni na každý modrý odkaz v chybové hlášce a vytvoř indexy.

---

## Postup:

### Krok 1: Najdi červené chyby v Console
1. V aplikaci otevři Console (F12)
2. Najdi červené chyby s textem "Firestore error: The query requires an index"
3. V každé chybě je **modrý odkaz** (začíná `https://console.firebase.google.com/...`)

### Krok 2: Pro každý odkaz udělej:
1. **Klikni na modrý odkaz**
2. Otevře se Firebase Console se stránkou "Create composite index"
3. **Klikni na tlačítko "Create Index"** (modré tlačítko)
4. Počkej na potvrzení
5. Vrať se zpět na tab s aplikací

### Krok 3: Opakuj pro všechny chyby
- V console může být 3-5 různých chyb
- **Každá vyžaduje vlastní index**
- Klikni na odkaz v každé chybě
- Pro každou klikni "Create Index"

### Krok 4: Počkej na build indexů
- Po vytvoření všech indexů počkej **2-3 minuty**
- Indexy se budují v pozadí
- Status můžeš sledovat na: `https://console.firebase.google.com/project/digitenka-b9d46/firestore/indexes`

### Krok 5: Refreshni aplikaci
- Až budou všechny indexy ve stavu "Enabled" (zelená)
- Refreshni aplikaci (F5)
- Červené chyby by měly zmizet

---

## Co hledat v chybách:

Příklady chybových hlášek:
```
▶ Firestore error: FirebaseError: The query requires an index.
  You can create it here:
  https://console.firebase.google.com/v1/r/project/digitenka/firestore/indexes?create_composite=...
```

**Důležité:** Každá chyba má **jiný odkaz** - musíš projít všechny!

---

## Časté indexy:

Pravděpodobně budeš vytvářet tyto indexy:

1. **Index pro doklady** (firmaId + datum_vystaveni)
2. **Index pro doklady** (firmaId + status + createdAt)
3. **Index pro firmy** (userId + createdAt)

---

## Ověření úspěchu:

1. Všechny indexy ve stavu **"Enabled"** (zelená ikona)
2. Po refreshi aplikace **žádné červené chyby** v console
3. Dashboard aplikace **načte seznam dokladů**

---

## Poznámka:
Build indexu trvá 1-3 minuty. Buď trpělivý a počkej než všechny indexy přejdou do stavu "Enabled".

**Po dokončení pošli Radimovi screenshot stránky Firestore Indexes se všemi zelenými statusy.**
