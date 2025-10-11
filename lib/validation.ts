import { ValidationResult } from './types';

// Validační funkce pro všechny vstupy
export function validateICO(ico: string): ValidationResult {
  const digits = ico.replace(/\D/g, '');

  if (digits.length !== 8) {
    return { valid: false, error: 'IČO musí mít 8 číslic' };
  }

  // Kontrolní součet pro české IČO
  const weights = [8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 7; i++) {
    sum += parseInt(digits[i]) * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 1 : remainder === 1 ? 0 : 11 - remainder;

  if (parseInt(digits[7]) !== checkDigit) {
    return { valid: false, error: 'Neplatné IČO (chybný kontrolní součet)' };
  }

  return { valid: true };
}

export function validateDIC(dic: string): ValidationResult {
  const clean = dic.replace(/\s/g, '').toUpperCase();

  if (!clean.startsWith('CZ')) {
    return { valid: false, error: 'DIČ musí začínat "CZ"' };
  }

  const digits = clean.substring(2);

  if (digits.length < 8 || digits.length > 10) {
    return { valid: false, error: 'DIČ musí mít 8-10 číslic po "CZ"' };
  }

  if (!/^\d+$/.test(digits)) {
    return { valid: false, error: 'DIČ může obsahovat jen číslice' };
  }

  return { valid: true };
}

export function validateCastka(castka: number): ValidationResult {
  if (isNaN(castka) || castka <= 0) {
    return { valid: false, error: 'Částka musí být kladné číslo' };
  }

  if (castka > 100000000) {
    return { valid: false, error: 'Částka je příliš vysoká' };
  }

  return { valid: true };
}

export function validateDatum(datum: string): ValidationResult {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (!regex.test(datum)) {
    return { valid: false, error: 'Datum musí být ve formátu YYYY-MM-DD' };
  }

  const date = new Date(datum);

  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Neplatné datum' };
  }

  // Nesmí být v budoucnosti
  if (date > new Date()) {
    return { valid: false, error: 'Datum nemůže být v budoucnosti' };
  }

  // Nesmí být starší než 10 let
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  if (date < tenYearsAgo) {
    return { valid: false, error: 'Datum je příliš staré (max 10 let zpět)' };
  }

  return { valid: true };
}

// Čištění IČO (jen číslice, 8 znaků)
export function cleanICO(ico: string | null): string {
  if (!ico) return '';
  const digits = ico.replace(/\D/g, '');
  return digits.padStart(8, '0').slice(0, 8);
}

// Čištění DIČ (formát CZ12345678)
export function cleanDIC(dic: string | null): string {
  if (!dic) return '';
  let clean = dic.replace(/\s/g, '').toUpperCase();
  if (!clean.startsWith('CZ')) {
    clean = 'CZ' + clean.replace(/\D/g, '');
  }
  return clean;
}

// Validace data (YYYY-MM-DD)
export function validateAndFormatDate(dateStr: string | null): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  // Zkus parsovat různé formáty
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        return dateStr; // Už je správný formát
      } else {
        // Převeď na YYYY-MM-DD
        const [_, d, m, y] = match;
        return `${y}-${m}-${d}`;
      }
    }
  }

  return new Date().toISOString().split('T')[0]; // Fallback na dnes
}
