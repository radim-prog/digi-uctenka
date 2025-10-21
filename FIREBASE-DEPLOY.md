# 🔥 Firebase Deployment - Návod

## Co je potřeba nasadit:

### 1. Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```

**Co to udělá:**
- Nasadí whitelist systém (allowed_users kolekce)
- Pouze povolení uživatelé mohou číst/psát data
- Admin může spravovat uživatele

### 2. Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

**Co to udělá:**
- Vytvoří composite indexy pro rychlé filtrování
- Nutné pro dashboard (filtr podle firmy, data, atd.)

### 3. Storage Security Rules
```bash
firebase deploy --only storage
```

**Co to udělá:**
- Pouze autentizovaní uživatelé mohou nahrávat/číst soubory
- Max velikost 25 MB

### 4. Inicializace admin účtu
```bash
npm run init-admin
```

**Co to udělá:**
- Vytvoří allowed_users/radim@wikiporadce.cz (role: admin)
- Vytvoří allowed_users/veronika@wikiporadce.cz (role: user)

## Kompletní nasazení (všechno najednou):

```bash
# 1. Nasaď všechny rules a indexy
firebase deploy --only firestore,storage

# 2. Počkej 30 sekund než se rules aktivují

# 3. Inicializuj admin účty
npm run init-admin
```

## Kontrola po nasazení:

1. Otevři Firebase Console: https://console.firebase.google.com
2. Zkontroluj Firestore Rules (záložka "Rules")
3. Zkontroluj Storage Rules (záložka "Rules")
4. Zkontroluj Firestore Data → kolekce "allowed_users" (měly by tam být 2 záznamy)

## Troubleshooting:

**"Insufficient permissions"** při init-admin:
- Přihlas se: `firebase login`
- Zkontroluj projekt: `firebase use --add`

**"Index not found"** při filtrování v dashboardu:
- Nasaď indexy: `firebase deploy --only firestore:indexes`
- Počkaj 2-5 minut než se vytvoří

