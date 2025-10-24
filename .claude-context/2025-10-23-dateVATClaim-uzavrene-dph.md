# DateVATClaim - Řešení Error 103 (Uzavřené DPH období)

**Datum:** 2025-10-23
**Kategorie:** bugfix
**Verze:** v1.6

## Problém

Import faktur z uzavřených DPH období selhal s chybou:

**Error 103:** "Pokoušíte se zapsat daňový doklad spadající do již uzavřeného období DPH."

### Příklad z odpovědi Pohody:

```xml
<rdc:errno>103</rdc:errno>
<rdc:note>Pokoušíte se zapsat daňový doklad spadající do již uzavřeného období DPH.
  Opravte datum uskutečnění zdanitelného plnění resp. odpočtu
  nebo zrušte uzavření přiznání DPH za příslušné období,
     zapište doklad a dořešte v souladu s platnou legislativou.</rdc:note>
```

**Týkalo se 28 faktur** ze srpna/září 2025 (uzavřená období).

---

## Důvod chyby

### Původní XML (chybný):

```xml
<inv:date>2025-08-14</inv:date>
<inv:dateAccounting>2025-10-23</inv:dateAccounting>
<inv:dateTax>2025-08-14</inv:dateTax>
<!-- CHYBÍ: dateVATClaim -->
```

**Problém:** Pohoda automaticky uplatní odpočet DPH v období podle `<inv:dateTax>` (srpen). Když je srpen uzavřený, import selže.

---

## Zákon o DPH vs. Pohoda XML

### Zákon o DPH (§ 73 zákona 235/2004 Sb.):

> Plátce je oprávněn uplatnit nárok na odpočet daně **nejpozději ve lhůtě 3 let** od konce zdaňovacího období, ve kterém vznikl nárok na odpočet.

**Důsledek:** Fakturu ze srpna 2025 můžeš naimportovat a uplatnit odpočet třeba až v říjnu 2025 (nebo později, max 3 roky).

### Pohoda XML požadavek:

Pohoda potřebuje **explicitně vědět KDY má uplatnit odpočet DPH**.

**Řešení:** Element `<inv:dateVATClaim>` (Datum uplatnění odpočtu DPH)

---

## Oprava v1.6

### Kód změna (lib/pohoda-export.ts, řádek 84):

**Před (v1.5):**
```typescript
xml += `
        <inv:date>${doklad.datum_vystaveni}</inv:date>
        <inv:dateAccounting>${datumZapisu}</inv:dateAccounting>
        <inv:dateTax>${doklad.datum_duzp}</inv:dateTax>`;
```

**Po (v1.6):**
```typescript
xml += `
        <inv:date>${doklad.datum_vystaveni}</inv:date>
        <inv:dateAccounting>${datumZapisu}</inv:dateAccounting>
        <inv:dateTax>${doklad.datum_duzp}</inv:dateTax>
        <inv:dateVATClaim>${datumZapisu}</inv:dateVATClaim>`;
```

---

## Výsledný XML (správný):

```xml
<inv:date>2025-08-14</inv:date>
<inv:dateAccounting>2025-10-23</inv:dateAccounting>
<inv:dateTax>2025-08-14</inv:dateTax>
<inv:dateVATClaim>2025-10-23</inv:dateVATClaim>
```

**Co to znamená:**
- **`dateTax`** (DUZP) = 2025-08-14 (původní datum zdanitelného plnění - srpen)
- **`dateVATClaim`** = 2025-10-23 (uplatnění odpočtu v říjnu = aktuální otevřené období)

**Pohoda tím:**
1. Uloží fakturu s původním DUZP (srpen)
2. Uplatní odpočet DPH až v říjnovém přiznání
3. Nesahá do uzavřeného srpna

---

## Očekávané výsledky

### ✅ V1.6 vyřeší:
- **Error 103** - faktury z uzavřených období lze importovat
- **28 faktur** ze srpna/září bude možné naimportovat
- **DUZP zůstává původní** (srpen), odpočet v aktuálním (říjen)

### ✅ Zachovává (z v1.4 + v1.5):
- **Error 108** - symVar generování (vyřešeno v1.4)
- **Error 603** - accounting/classificationVAT (vyřešeno v1.5)

---

## Testování

### Postup:
1. **Reload browseru** (Cmd+Shift+R) - vyčistit cache
2. **Vygeneruj nový XML** (soubor 8 nebo 9)
3. **Importuj do Pohody**

### Očekávaný výsledek:
- ✅ **0× Error 103** (dříve: 28×)
- ✅ **Faktury ze srpna/září úspěšně importovány**
- ✅ **Odpočet DPH v říjnovém přiznání**

---

## Commit info

```
Commit: e59364e
Tag: v1.6
Branch: v1.3-working
File: lib/pohoda-export.ts (line 84)
```

---

## Soubory změny

- **lib/pohoda-export.ts** - řádek 84 (přidán dateVATClaim)

---

## Zdroje

- **Zákon 235/2004 Sb. (Zákon o DPH)** - § 73 (Lhůta pro uplatnění nároku na odpočet)
- **Pohoda XML v2.0** - https://www.stormware.cz/schema/version_2/invoice.xsd
- **Element dateVATClaim** - datum uplatnění odpočtu DPH (OPTIONAL, ale doporučený)

---

## Poznámky

- Element `<inv:dateVATClaim>` je OPTIONAL podle XSD, ale **kritický pro import starších faktur**
- Bez něj Pohoda defaultuje na `dateTax` = problém při uzavřených obdobích
- S ním lze faktury importovat kdykoliv do 3 let zpětně
- DUZP (dateTax) zůstává původní = správné pro účetní evidence
