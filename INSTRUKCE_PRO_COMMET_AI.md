# 🤖 Instrukce pro Commet AI - Firebase Console

## Krok 1: Ověř Blaze Plan upgrade
1. Zkontroluj že dialog "Your billing account" je zavřený
2. Pokud je stále otevřený:
   - Klikni na "My Billing Account" v seznamu
   - Klikni "Continue" nebo "Confirm"
   - Počkej na potvrzení
3. Zavři dialog

## Krok 2: Otevři Storage Rules
1. V levém menu klikni na **"Storage"**
2. Měla by se objevit stránka s bucket a soubory (nebo prázdná)
3. Nahoře by měly být záložky: **Files | Rules | Usage**
4. Klikni na záložku **"Rules"**

## Krok 3: Nastav Storage Rules
1. V editoru Rules by měl být nějaký kód (možná prázdný nebo default rules)
2. **VYMAŽ veškerý obsah** editoru
3. Vlož tento kód:

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

4. Klikni tlačítko **"Publish"** (vpravo nahoře)
5. Počkej na potvrzení "Rules published successfully"

## Krok 4: Ověř že rules fungují
1. Zkontroluj že na stránce není chybová hláška
2. Mělo by být napsáno "Published" a timestamp

## Krok 5: Hotovo!
✅ Storage rules jsou nastaveny
✅ Aplikace může nahrávat soubory do Firebase Storage
✅ Soubory jsou chráněny (jen přihlášení uživatelé)

## Co udělat když něco selže:

### Problém: Storage záložka Rules neexistuje
**Řešení:**
- Klikni na bucket name v levém menu (měl by být pod "Storage")
- Nebo klikni na "Files" záložku, pak by se měla objevit i "Rules"

### Problém: Dialog "Your billing account" nejde zavřít
**Řešení:**
- Klikni na "My Billing Account"
- Klikni "Set account and continue"
- Potvrď upgrade na Blaze Plan

### Problém: "Rules contain errors"
**Řešení:**
- Zkontroluj že jsi zkopíroval celý kód včetně první řádky `rules_version = '2';`
- Zkontroluj že nejsou žádné extra mezery nebo znaky

---

**Po dokončení těchto kroků pošli Radimovi screenshot stránky Storage Rules s "Published" statusem.**
