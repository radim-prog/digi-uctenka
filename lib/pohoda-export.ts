import { Doklad, Polozka } from './types';
import { generateInvoiceDescription } from './invoice-description';

/**
 * ⚙️ NASTAVENÍ: Automatické párování účtu 261 (Peníze na cestě) → 221 (Banka)
 *
 * ZAPNUTO (true):  Pro platby kartou se vytvoří 2 záznamy (MD náklad/D 261 + MD 221/D 261)
 * VYPNUTO (false): Pro platby kartou se vytvoří 1 záznam (MD náklad/D 261)
 *
 * ⚠️ VYPNUTO z bezpečnostních důvodů - nevíme jestli Pohoda páruje automaticky.
 *    Pokud Pohoda NEpáruje, budeš muset párovat ručně v Pohodě.
 *    Pokud zjistíš že chceš automatické párování, změň na true.
 */
const AUTO_PAROVANI_261_NA_221 = false;

/**
 * Generuje XML soubor pro import přijatých faktur do Pohody
 * Podle formátu https://www.stormware.cz/pohoda/xml/
 */
export function generatePohodaXML(doklady: Doklad[]): string {
  const dnesniDatum = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const ico = doklady[0]?.odberatel_ico || '00000000';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack id="Import_faktur" ico="${ico}" application="Digi-Uctenka" version="2.0" note="Import faktur" xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd" xmlns:inv="http://www.stormware.cz/schema/version_2/invoice.xsd" xmlns:int="http://www.stormware.cz/schema/version_2/intDoc.xsd" xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd">`;

  let itemId = 1;
  doklady.forEach((doklad) => {
    // Přidej fakturu/účtenku
    xml += generateInvoiceXML(doklad, itemId++, dnesniDatum);

    // Pokud je platba kartou (261 - peníze na cestě), automaticky přidej párování
    if (AUTO_PAROVANI_261_NA_221 && doklad.predkontace_d === '261') {
      xml += generatePenizeNaCesteXML(doklad, itemId++);
    }
  });

  xml += `\n</dat:dataPack>`;
  return xml;
}

function generateInvoiceXML(doklad: Doklad, dataId: number, datumZapisu: string): string {
  const sazbaDPHMapping = (sazba: number): string => {
    if (sazba === 21) return 'high';
    if (sazba === 12) return 'low';
    return 'none';
  };

  let xml = `
  <dat:dataPackItem id="${dataId}" version="2.0">
    <inv:invoice version="2.0">
      <inv:invoiceHeader>
        <inv:invoiceType>receivedInvoice</inv:invoiceType>
        <inv:number>
          <typ:numberRequested>${doklad.cislo_dokladu}</typ:numberRequested>
        </inv:number>`;

  // Variabilní symbol - generujeme z čísla dokladu (pouze číslice)
  // DŮVOD: Pohoda se pokouší auto-generovat VS když není uveden, ale selhává (error 108)
  // ŘEŠENÍ: Posíláme VS explicitně pro VŠECHNY faktury
  const vs = doklad.cislo_dokladu
    .replace(/\D/g, '')  // Odstraň nečíselné znaky: "25.09.12/02" → "250912"
    .substring(0, 20);   // Max 20 čísel podle Pohoda XSD

  if (vs.length > 0) {
    xml += `
        <inv:symVar>${vs}</inv:symVar>`;
  }

  if (doklad.konstantni_symbol && doklad.konstantni_symbol.trim() !== '') {
    xml += `
        <inv:symConst>${doklad.konstantni_symbol.trim()}</inv:symConst>`;
  }

  if (doklad.specificke_symbol && doklad.specificke_symbol.trim() !== '') {
    xml += `
        <inv:symSpec>${doklad.specificke_symbol.trim()}</inv:symSpec>`;
  }

  xml += `
        <inv:date>${doklad.datum_vystaveni}</inv:date>
        <inv:dateTax>${doklad.datum_zdanitelneho_plneni}</inv:dateTax>
        <inv:dateAccounting>${datumZapisu}</inv:dateAccounting>`;

  if (doklad.datum_splatnosti) {
    xml += `
        <inv:dateDue>${doklad.datum_splatnosti}</inv:dateDue>`;
  }

  xml += `
        <inv:dateKHDPH>${datumZapisu}</inv:dateKHDPH>`;

  // Vytvoř popisný text pro Pohodu
  const textPopis = generateInvoiceDescription(doklad);

  xml += `
        <inv:accounting>
          <typ:accountingType>withoutAccounting</typ:accountingType>
        </inv:accounting>
        <inv:classificationVAT>
          <typ:classificationVATType>inland</typ:classificationVATType>
        </inv:classificationVAT>
        <inv:text>${textPopis}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${doklad.dodavatel_nazev}</typ:company>`;

  if (doklad.dodavatel_ico) {
    xml += `
            <typ:ico>${doklad.dodavatel_ico}</typ:ico>`;
  }

  if (doklad.dodavatel_dic) {
    xml += `
            <typ:dic>${doklad.dodavatel_dic}</typ:dic>`;
  }

  if (doklad.dodavatel_adresa) {
    // Max 64 znaků pro Pohoda XML schéma
    const adresa = doklad.dodavatel_adresa.substring(0, 64);
    xml += `
            <typ:street>${adresa}</typ:street>`;
  }

  xml += `
          </typ:address>
        </inv:partnerIdentity>`;

  if (doklad.bankovni_ucet_dodavatele) {
    xml += `
        <inv:account>
          <typ:accountNo>${doklad.bankovni_ucet_dodavatele}</typ:accountNo>
        </inv:account>`;
  }

  xml += `
        <inv:paymentType>
          <typ:paymentType>${mapPaymentType(doklad.forma_uhrady)}</typ:paymentType>
        </inv:paymentType>
      </inv:invoiceHeader>`;

  // Položky dokladu
  if (doklad.polozky && doklad.polozky.length > 0) {
    xml += `
      <inv:invoiceDetail>`;

    doklad.polozky.forEach((polozka) => {
      xml += generateInvoiceItemXML(polozka, doklad.mena);
    });

    xml += `
      </inv:invoiceDetail>`;
  }

  // Souhrn DPH
  xml += `
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${doklad.zaklad_dane_0 || 0}</typ:priceNone>
          <typ:priceLow>${(doklad.zaklad_dane_12 || 0) + (doklad.dph_12 || 0)}</typ:priceLow>
          <typ:priceLowVAT>${doklad.dph_12 || 0}</typ:priceLowVAT>
          <typ:priceLowSum>${doklad.zaklad_dane_12 || 0}</typ:priceLowSum>
          <typ:priceHigh>${(doklad.zaklad_dane_21 || 0) + (doklad.dph_21 || 0)}</typ:priceHigh>
          <typ:priceHighVAT>${doklad.dph_21 || 0}</typ:priceHighVAT>
          <typ:priceHighSum>${doklad.zaklad_dane_21 || 0}</typ:priceHighSum>
          <typ:round>
            <typ:priceRound>0</typ:priceRound>
          </typ:round>
        </inv:homeCurrency>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>`;

  return xml;
}

function generateInvoiceItemXML(polozka: Polozka, mena: string): string {
  const sazbaDPH = polozka.sazba_dph === 21 ? 'high' : polozka.sazba_dph === 12 ? 'low' : 'none';

  return `
        <inv:invoiceItem>
          <inv:text>${polozka.nazev}</inv:text>
          <inv:quantity>${polozka.mnozstvi}</inv:quantity>
          <inv:unit>${polozka.jednotka}</inv:unit>
          <inv:rateVAT>${sazbaDPH}</inv:rateVAT>
          <inv:homeCurrency>
            <typ:unitPrice>${polozka.cena_za_jednotku}</typ:unitPrice>
            <typ:price>${polozka.zaklad_dane}</typ:price>
            <typ:priceVAT>${polozka.dph}</typ:priceVAT>
            <typ:priceSum>${polozka.celkem_s_dph}</typ:priceSum>
          </inv:homeCurrency>
        </inv:invoiceItem>`;
}

function mapPaymentType(forma?: string): string {
  switch (forma) {
    case 'hotove':
      return 'cash';
    case 'prevod':
      return 'draft';
    case 'karta':
      return 'creditcard';
    default:
      return 'draft';
  }
}

/**
 * Generuje XML pro automatické připsání peněz z účtu 261 (peníze na cestě) na účet 221 (banka)
 * Toto se volá automaticky pro platby kartou
 */
function generatePenizeNaCesteXML(doklad: Doklad, dataId: number): string {
  // Datum připsání = datum dokladu + 2 dny (standardní bankovní den)
  const datumDokladu = new Date(doklad.datum_vystaveni);
  const datumPripsani = new Date(datumDokladu);
  datumPripsani.setDate(datumPripsani.getDate() + 2);
  const datumPripsaniStr = datumPripsani.toISOString().split('T')[0];

  const castka = doklad.celkova_castka || 0;
  const popis = `Připsání platby kartou - ${doklad.dodavatel_nazev || 'doklad'} ${doklad.cislo_dokladu || ''}`.trim();

  return `
  <dat:dataPackItem id="${dataId}" version="2.0">
    <int:intDoc version="2.0">
      <int:intDocHeader>
        <int:number>
          <typ:numberRequested>PNC-${doklad.cislo_dokladu || dataId}</typ:numberRequested>
        </int:number>
        <int:date>${datumPripsaniStr}</int:date>
        <int:text>${popis}</int:text>
        <int:intNote>Automaticky vygenerováno - připsání platby kartou z účtu 261 na účet 221</int:intNote>
        <int:accounting>
          <typ:ids>VBU</typ:ids>
        </int:accounting>
      </int:intDocHeader>
      <int:intDocDetail>
        <int:intDocItem>
          <int:text>${popis}</int:text>
          <int:homeCurrency>
            <typ:unitPrice>${castka}</typ:unitPrice>
          </int:homeCurrency>
          <int:accounting>
            <int:ids>VBU</int:ids>
            <int:accountingType>MD</int:accountingType>
            <int:account>221</int:account>
          </int:accounting>
        </int:intDocItem>
        <int:intDocItem>
          <int:text>${popis}</int:text>
          <int:homeCurrency>
            <typ:unitPrice>${castka}</typ:unitPrice>
          </int:homeCurrency>
          <int:accounting>
            <int:ids>VBU</int:ids>
            <int:accountingType>D</int:accountingType>
            <int:account>261</int:account>
          </int:accounting>
        </int:intDocItem>
      </int:intDocDetail>
    </int:intDoc>
  </dat:dataPackItem>`;
}

/**
 * Stáhne XML jako soubor v prohlížeči
 */
export function downloadPohodaXML(xml: string, filename: string = 'pohoda-import.xml') {
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
