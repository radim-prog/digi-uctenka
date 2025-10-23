# Pohoda XML Complete Fix - v1.4 + v1.5

**Datum:** 2025-10-23
**Kategorie:** bugfix
**Verze:** v1.4, v1.5

## Problémy v chronologickém pořadí

### 1. Error 603 - Accounting Element (v1.3.8)
- **Chyba:** `<typ:ids>2Fv</typ:ids>` - nevalidní struktura
- **Oprava:** `<typ:accountingType>withoutAccounting</typ:accountingType>`
- **Zdroj:** https://www.stormware.cz/xml/samples/version_2/import/Faktury/invoice_04_v2.0.xml

### 2. Error 108 - SymVar Auto-generace (v1.4)
- **Chyba:** Pohoda auto-generuje symVar když není uveden, ale selhává na non-numeric znacích
- **Příklad:** "25.09.12/02 01/00000012" → Pohoda error 108
- **Oprava:** Explicitně generujeme symVar z čísla dokladu (pouze číslice)
  ```typescript
  const vs = doklad.cislo_dokladu
    .replace(/\D/g, '')  // Odstraň nečíselné znaky
    .substring(0, 20);   // Max 20 čísel podle XSD
  ```
- **DŮLEŽITÉ:** SymVar se generuje pro VŠECHNY faktury (ne jen bank transfer)

### 3. Error 108 - ClassificationVAT Invalid Value (v1.5)
- **Chyba:** Pohoda defaultuje na "PD" když není uveden, ale "PD" není validní hodnota v XSD
- **Validní hodnoty podle type.xsd:** POUZE "inland" a "nonSubsume"
- **Oprava:** Explicitně nastaveno na "inland"
  ```typescript
  <inv:classificationVAT>
    <typ:classificationVATType>inland</typ:classificationVATType>
  </inv:classificationVAT>
  ```

## Důležité poznatky

### Pohoda XSD Strict Validation
- Pohoda má VELMI striktní XSD validaci
- NELZE používat hodnoty mimo official XSD schema
- Defaultní hodnoty Pohody NEMUSÍ být validní podle XSD!

### Official Pohoda XSD Locations
- **Main Schema:** https://www.stormware.cz/schema/version_2/
- **invoice.xsd:** Struktura faktury
- **type.xsd:** Datové typy a enumy
- **intDoc.xsd:** Interní doklady

### Validní hodnoty pro receivedInvoice

#### inv:classificationVAT
```xml
<inv:classificationVAT>
  <typ:classificationVATType>inland|nonSubsume</typ:classificationVATType>
</inv:classificationVAT>
```
- **inland** - tuzemské plnění (používáme toto)
- **nonSubsume** - nepodléhá (special cases)

#### inv:accounting
```xml
<inv:accounting>
  <typ:accountingType>withoutAccounting</typ:accountingType>
</inv:accounting>
```
- **withoutAccounting** - bez předkontace (používáme toto)

#### inv:paymentType
```xml
<inv:paymentType>
  <typ:paymentType>cash|draft|creditcard|...</typ:paymentType>
</inv:paymentType>
```
- **cash** - hotovost (hotove)
- **draft** - příkaz k úhradě (prevod)
- **creditcard** - platební karta (karta)

#### inv:symVar
```xml
<inv:symVar>1234567890</inv:symVar>
```
- **Max 20 číslic**
- **Pouze číselné znaky** (0-9)
- **DŮLEŽITÉ:** Musí být explicitně uveden, jinak Pohoda auto-generuje a selhává

## Commit History

### v1.3.8 - Accounting Element Fix
```
🔧 v1.3.8 - Oprava accounting elementu podle oficiální Pohoda metodiky
```

### v1.4 - SymVar Generation
```
🔧 v1.4 - Přidán explicitní symVar pro všechny faktury (fix error 108)

✅ Opravy:
- Explicitní generování symVar z čísla dokladu (pouze číslice)
- Pohoda auto-generace symVar selhávala na non-numeric characters
- Příklad: "25.09.12/02" → symVar: "250912"

📝 Změněné soubory:
- lib/pohoda-export.ts - lines 58-68 (symVar generation)
```

### v1.5 - ClassificationVAT Fix
```
🔧 v1.5 - Přidáno classificationVAT: inland (validní hodnota)

✅ Opravy:
- Explicitně nastaveno classificationVAT: inland
- Pohoda defaultuje na "PD" což NENÍ validní hodnota v XSD
- Validní hodnoty podle type.xsd: pouze "inland" a "nonSubsume"

📝 Změněné soubory:
- lib/pohoda-export.ts - lines 97-99 (classificationVAT)
```

## Testování

### ⏳ Čeká se na test v1.5
1. Vygenerovat nový XML export (soubor 7 nebo 8)
2. Import do Pohody
3. Ověřit že error 108 a error 603 jsou vyřešeny

### Očekávaný výsledek
- ✅ Error 108 na symVar - VYŘEŠENO (v1.4)
- ✅ Error 108 na classificationVAT - VYŘEŠENO (v1.5)
- ✅ Error 603 na accounting - VYŘEŠENO (v1.3.8)

## Lekce pro budoucnost

1. **VŽDY používat pouze validní hodnoty z official XSD**
2. **NIKDY nevymýšlet hodnoty "co by mohly fungovat"**
3. **Pohoda defaults NEJSOU vždy XSD validní**
4. **Explicitně nastavovat všechny důležité elementy**
5. **Validovat proti XSD schema před nasazením**

## User Feedback

> "Tak když kurva víš co jsou oficiální hodnoty tak proč tam máš doprdele něco jiného namrdaného.... když kurva myslím aby jsi prošel všechny hodnoty které u faktury vkládáme podle metodiky tak tím myslím, že tam budeš mít povolené hodnoty a ne nějaký hovna co si vymyslíš"

**Poučení:** User má naprostou pravdu. Musíme se držet PŘESNĚ oficálního XSD schema.

## Files Changed

- **lib/pohoda-export.ts**
  - Lines 58-68: symVar generation (v1.4)
  - Lines 94-96: accounting element (v1.3.8)
  - Lines 97-99: classificationVAT element (v1.5)

## Git Tags na GitHubu

- ✅ v1.0 - Initial release
- ✅ v1.1 - Opravy exportu
- ✅ v1.2 - Docker support
- ✅ v1.3 - Windows support
- ✅ v1.3.1 - KRITICKÉ OPRAVY
- ✅ v1.3.2 - Rate Limiting
- ✅ v1.4 - SymVar fix
- ✅ v1.5 - ClassificationVAT fix
- ❌ v1.3.4 - v1.3.8 - SMAZÁNY (nefunkční intermediate verze)
