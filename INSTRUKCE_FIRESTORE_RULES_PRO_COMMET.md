# 🤖 Instrukce pro Commet AI - Firestore Security Rules

## Problém
Aplikace hlásí chybu: **"FirebaseError: Missing or insufficient permissions."**

Příčina: Firestore security rules nejsou nasazeny v Firebase Console.

---

## Krok 1: Otevři Firestore Rules
1. Otevři URL: `https://console.firebase.google.com/project/digitenka-b9d46/firestore/rules`
2. Měla by se otevřít stránka s editorem pravidel
3. Klikni na záložku **"Rules"** (pokud není aktivní)

---

## Krok 2: Nastav Firestore Rules
1. V editoru Rules **VYMAŽ veškerý obsah**
2. Vlož tento kód (zkopíruj celý):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper funkce
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Firmy collection
    match /firmy/{firmaId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Doklady collection
    match /doklady/{dokladId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }
  }
}
```

3. Klikni tlačítko **"Publish"** (vpravo nahoře)
4. Pokud se zobrazí dialog s varováním, klikni **"Publish"** znovu pro potvrzení
5. Počkej na potvrzení "Rules published successfully"

---

## Krok 3: Ověř publikaci
1. Zkontroluj že nahoře je napsáno **"Published"** a aktuální timestamp
2. Neměla by být žádná červená chybová hláška

---

## Krok 4: Refreshni aplikaci
1. Přejdi zpět na tab s aplikací (localhost)
2. Stiskni **F5** nebo klikni na Refresh
3. Chyba "Missing or insufficient permissions" by měla zmizet

---

## Co udělat když něco selže:

### Problém: "Rules contain errors"
**Řešení:**
- Zkontroluj že jsi zkopíroval **celý kód** včetně první řádky `rules_version = '2';`
- Zkontroluj že nejsou žádné extra mezery na začátku nebo konci
- Zkopíruj znovu z tohoto souboru

### Problém: Dialog se neptá na potvrzení
**Řešení:**
- To je OK, pravidla se publikují rovnou
- Zkontroluj status "Published" nahoře

### Problém: "Project not found"
**Řešení:**
- Zkontroluj že jsi přihlášen správným Google účtem
- Zkus URL znovu: `https://console.firebase.google.com/project/digitenka-b9d46/firestore/rules`

---

## ✅ Po úspěšném dokončení:

Aplikace bude fungovat bez permission errors!

**Pošli Radimovi screenshot:**
1. Firestore Rules stránky s "Published" statusem
2. Refreshnuté aplikace (localhost) bez chyb v console

---

## Co tyto rules dělají:

- ✅ Každý uživatel vidí jen svoje data (podle `userId`)
- ✅ Uživatel může vytvářet firmy a doklady
- ✅ Uživatel může číst/upravovat/mazat jen svoje firmy a doklady
- ✅ Nikdo nemůže vidět data jiných uživatelů
- ✅ Nepřihlášení uživatelé nemají žádný přístup
