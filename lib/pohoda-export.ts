import { Doklad, Polozka } from './types';

/**
 * Generuje XML soubor pro import přijatých faktur do Pohody
 * Podle formátu https://www.stormware.cz/pohoda/xml/
 */
export function generatePohodaXML(doklady: Doklad[]): string {
  const datum = new Date().toISOString();
  const ico = doklady[0]?.odberatel_ico || '00000000';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack id="Import_faktur" ico="${ico}" application="Digi-Uctenka" version="2.0" note="Import faktur" xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd" xmlns:inv="http://www.stormware.cz/schema/version_2/invoice.xsd" xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd">`;

  doklady.forEach((doklad, index) => {
    xml += generateInvoiceXML(doklad, index + 1);
  });

  xml += `\n</dat:dataPack>`;
  return xml;
}

function generateInvoiceXML(doklad: Doklad, dataId: number): string {
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
        </inv:number>
        <inv:symVar>${doklad.variabilni_symbol}</inv:symVar>`;

  if (doklad.konstantni_symbol) {
    xml += `
        <inv:symConst>${doklad.konstantni_symbol}</inv:symConst>`;
  }

  if (doklad.specificke_symbol) {
    xml += `
        <inv:symSpec>${doklad.specificke_symbol}</inv:symSpec>`;
  }

  xml += `
        <inv:date>${doklad.datum_vystaveni}</inv:date>
        <inv:dateTax>${doklad.datum_zdanitelneho_plneni}</inv:dateTax>`;

  if (doklad.datum_splatnosti) {
    xml += `
        <inv:dateDue>${doklad.datum_splatnosti}</inv:dateDue>`;
  }

  xml += `
        <inv:accounting>
          <typ:ids>${doklad.predkontace || '2Fv'}</typ:ids>`;

  // Pokud jsou vyplněné účty MD a D, přidej je
  if (doklad.predkontace_md) {
    xml += `
          <typ:accountingMD>${doklad.predkontace_md}</typ:accountingMD>`;
  }

  if (doklad.predkontace_d) {
    xml += `
          <typ:accountingD>${doklad.predkontace_d}</typ:accountingD>`;
  }

  xml += `
        </inv:accounting>
        <inv:text>${doklad.dodavatel_nazev}</inv:text>
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
    xml += `
            <typ:street>${doklad.dodavatel_adresa}</typ:street>`;
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
      return 'hotově';
    case 'prevod':
      return 'příkazem';
    case 'karta':
      return 'kartou';
    default:
      return 'příkazem';
  }
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
