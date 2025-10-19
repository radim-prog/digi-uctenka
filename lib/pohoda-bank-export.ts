import { BankTransaction } from './types';

/**
 * Generuje XML soubor pro import bankovních transakcí do Pohody
 * Podle formátu https://www.stormware.cz/pohoda/xml/
 */
export function generatePohodaBankXML(transactions: BankTransaction[]): string {
  const datum = new Date().toISOString();
  const ico = '00000000'; // Použije se IČO z první transakce

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack id="Import_bankovnich_transakci" ico="${ico}" application="Digi-Uctenka" version="2.0" note="Import bankovních transakcí" xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd" xmlns:bnk="http://www.stormware.cz/schema/version_2/bank.xsd" xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd">`;

  transactions.forEach((transaction, index) => {
    xml += generateBankTransactionXML(transaction, index + 1);
  });

  xml += `\n</dat:dataPack>`;
  return xml;
}

function generateBankTransactionXML(transaction: BankTransaction, dataId: number): string {
  // Určení směru pohybu
  const statementType = transaction.typ === 'incoming' ? 'receipt' : 'issue';

  let xml = `
  <dat:dataPackItem id="${dataId}" version="2.0">
    <bnk:bank version="2.0">
      <bnk:bankHeader>
        <bnk:bankType>${statementType}</bnk:bankType>
        <bnk:account>
          <typ:ids>Hlavní účet</typ:ids>
        </bnk:account>
        <bnk:statementNumber>
          <typ:statementNumber>${transaction.datum.replace(/-/g, '')}</typ:statementNumber>
        </bnk:statementNumber>
        <bnk:symVar>${transaction.variabilni_symbol || ''}</bnk:symVar>`;

  if (transaction.konstantni_symbol) {
    xml += `
        <bnk:symConst>${transaction.konstantni_symbol}</bnk:symConst>`;
  }

  if (transaction.specificke_symbol) {
    xml += `
        <bnk:symSpec>${transaction.specificke_symbol}</bnk:symSpec>`;
  }

  xml += `
        <bnk:dateStatement>${transaction.datum}</bnk:dateStatement>
        <bnk:datePayment>${transaction.datum}</bnk:datePayment>
        <bnk:text>${escapeXml(transaction.popis)}</bnk:text>
        <bnk:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(transaction.nazev_protiuctu)}</typ:company>`;

  if (transaction.cislo_protiuctu) {
    xml += `
            <typ:street>${escapeXml(transaction.cislo_protiuctu)}</typ:street>`;
  }

  xml += `
          </typ:address>
        </bnk:partnerIdentity>
        <bnk:myIdentity>
          <typ:address>
            <typ:company>Moje firma</typ:company>
          </typ:address>
        </bnk:myIdentity>`;

  // Částka (absolutní hodnota)
  const castka = Math.abs(transaction.castka);

  xml += `
        <bnk:paymentAccount>
          <typ:accountNo>${transaction.cislo_protiuctu || ''}</typ:accountNo>
        </bnk:paymentAccount>
        <bnk:homeCurrency>
          <typ:price>${castka}</typ:price>
        </bnk:homeCurrency>
      </bnk:bankHeader>
    </bnk:bank>
  </dat:dataPackItem>`;

  return xml;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Stáhne XML jako soubor v prohlížeči
 */
export function downloadPohodaBankXML(xml: string, filename: string = 'pohoda-bank-import.xml') {
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
