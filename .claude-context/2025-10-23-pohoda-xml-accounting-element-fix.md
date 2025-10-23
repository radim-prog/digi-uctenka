# Pohoda XML Accounting Element Fix

**Datum:** 2025-10-23
**Kategorie:** bugfix
**Verze:** v1.3.8

## Problém

Pohoda import hlásil chyby při importu XML faktur:
- **Error 603**: Hodnota prvku musela být upravena
  - `valueRequested: 2Fv`
  - `valueProduced: 504`
- **Error 108**: Neznámá hodnota (symVar)
  - Tato chyba se objevovala i když symVar element nebyl v XML přítomen

## Původní (chybný) kód

```typescript
xml += `
        <inv:accounting>
          <typ:ids>${doklad.predkontace || '2Fv'}</typ:ids>
        </inv:accounting>
```

**Problém:** Používali jsme `<typ:ids>` element, který je určen pro předkontace. Pohoda to neakceptovala a způsobovalo to validační chyby celého dokladu.

## Opravený kód (v1.3.8)

```typescript
xml += `
        <inv:accounting>
          <typ:accountingType>withoutAccounting</typ:accountingType>
        </inv:accounting>
```

**Řešení:** Podle oficiální Pohoda XML metodiky (invoice_04_v2.0.xml) se pro přijaté faktury bez předkontace používá element `<typ:accountingType>` s hodnotou `withoutAccounting`.

## Zdroj řešení

- **Oficiální příklad:** https://www.stormware.cz/xml/samples/version_2/import/Faktury/invoice_04_v2.0.xml
- **XSD Schema:** https://www.stormware.cz/schema/version_2/type.xsd
- **XSD Invoice:** https://www.stormware.cz/schema/version_2/invoice.xsd

## Ověření dalších XML elementů

Prošli jsme všechny elementy v našem exportu podle Pohoda metodiky:

### ✅ Správně implementované elementy

1. **`<inv:paymentType>`**
   ```xml
   <inv:paymentType>
     <typ:paymentType>cash|draft|creditcard</typ:paymentType>
   </inv:paymentType>
   ```
   - Je validní podle type.xsd
   - Pohoda XSD povoluje 3 způsoby reference: `typ:id`, `typ:ids`, `typ:paymentType`
   - My používáme `typ:paymentType` s enum hodnotami (cash, draft, creditcard)
   - Pohoda automaticky namapuje na odpovídající formu úhrady

2. **`<inv:classificationVAT>`**
   - Je OPTIONAL podle invoice.xsd
   - Default hodnota: "inland" (tuzemsko)
   - Nemusíme uvádět, Pohoda použije default

3. **`<inv:symVar>`**
   - Vypnut v1.3.7 (zakomentován)
   - Pohoda auto-generuje VS z čísla dokladu
   - Správné řešení pro doklady s různými formáty čísel

## Důsledky

- **Error 603** by měl být vyřešen - accounting element je nyní správný
- **Error 108** by měl být vyřešen - způsobovala ho nevalidní struktura celého dokladu
- Import do Pohody by měl projít bez chyb

## Soubor změny

- **`lib/pohoda-export.ts`** - řádek 96-98
- Commit: v1.3.8
- Branch: v1.3-working

## Navazující akce

1. ✅ Commitnuto do gitu
2. ✅ Vytvořen tag v1.3.8
3. ✅ Pushnuto do remote
4. ⏳ **Čeká se na test:** Uživatel musí vygenerovat nový XML s v1.3.8 a otestovat import do Pohody

## Poznámky

- Pohoda má velmi striktní XSD validaci
- Je důležité používat přesné elementy podle oficiální metodiky
- Validace proti XSD schema je kritická před nasazením
- V budoucnu zvážit přidání `classificationVAT` pro explicitnost (i když není povinný)
