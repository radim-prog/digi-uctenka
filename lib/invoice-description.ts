import { Doklad, Polozka } from './types';

/**
 * Generuje jednoduchý, přirozený popis jako by ho řekl člověk
 */
export function generateInvoiceDescription(doklad: Doklad): string {
  const polozky = doklad.polozky || [];

  // Žádné položky
  if (polozky.length === 0) {
    return `${doklad.dodavatel_nazev} - Nákup`;
  }

  // Jedna položka
  if (polozky.length === 1) {
    return `${doklad.dodavatel_nazev} - ${polozky[0].nazev}`;
  }

  // 2-3 položky - vypiš všechny
  if (polozky.length <= 3) {
    const seznam = polozky.map(p => p.nazev).join(', ');
    return `${doklad.dodavatel_nazev} - ${seznam}`;
  }

  // 4-6 položek - vypiš první 3 + "a další X"
  if (polozky.length <= 6) {
    const prvni = polozky.slice(0, 3).map(p => p.nazev).join(', ');
    const zbytek = polozky.length - 3;
    return `${doklad.dodavatel_nazev} - ${prvni} a další ${zbytek}`;
  }

  // Hodně položek - zkus najít kategorii
  const kategorie = getSimpleCategory(polozky);
  if (kategorie) {
    return `${doklad.dodavatel_nazev} - ${kategorie} (${polozky.length} položek)`;
  }

  // Fallback - vypiš první 3
  const prvni = polozky.slice(0, 3).map(p => p.nazev).join(', ');
  return `${doklad.dodavatel_nazev} - ${prvni}... (celkem ${polozky.length} položek)`;
}

function getSimpleCategory(polozky: Polozka[]): string | null {
  const nazvy = polozky.map(p => p.nazev.toLowerCase()).join(' ');

  // Jednoduché klíčové slovo matching
  if (nazvy.includes('kancelář') || nazvy.includes('papír') || nazvy.includes('pero') ||
      nazvy.includes('sešit') || nazvy.includes('příslušenství')) {
    return 'Kancelářské potřeby';
  }
  if (nazvy.includes('nafta') || nazvy.includes('benzin') || nazvy.includes('diesel')) {
    return 'Pohonné hmoty';
  }
  if (nazvy.includes('potraviny') || nazvy.includes('jídlo')) {
    return 'Potraviny';
  }
  if (nazvy.includes('elektro') || nazvy.includes('kabel') || nazvy.includes('usb')) {
    return 'Elektronika';
  }
  if (nazvy.includes('staveb') || nazvy.includes('nářadí') || nazvy.includes('materiál')) {
    return 'Stavební materiál a nářadí';
  }

  return null;
}
