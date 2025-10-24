// Test script pro zobrazení XML exportu
const { generatePohodaXML } = require('./lib/pohoda-export.ts');

const testDoklad = {
  cislo_dokladu: '25.09.12/02 01/00000012',
  datum_vystaveni: '2025-09-25',
  datum_duzp: '2025-09-25',
  datum_splatnosti: '2025-10-09',
  dodavatel_nazev: 'Test s.r.o.',
  dodavatel_ico: '12345678',
  dodavatel_dic: 'CZ12345678',
  dodavatel_adresa: 'Testovací 123, Praha 1',
  bankovni_ucet_dodavatele: '123456789/0100',
  forma_uhrady: 'karta',
  odberatel_ico: '87654321',
  mena: 'CZK',
  celkova_castka: 1210,
  zaklad_dane_0: 0,
  zaklad_dane_12: 0,
  zaklad_dane_21: 1000,
  dph_12: 0,
  dph_21: 210,
  polozky: [
    {
      nazev: 'Testovací položka',
      mnozstvi: 1,
      jednotka: 'ks',
      cena_za_jednotku: 1000,
      sazba_dph: 21,
      zaklad_dane: 1000,
      dph: 210,
      celkem_s_dph: 1210
    }
  ]
};

const xml = generatePohodaXML([testDoklad]);
console.log(xml);
