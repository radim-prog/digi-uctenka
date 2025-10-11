import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  activeFirmaId: string | null;
}

export interface Firma {
  id: string;
  userId: string;
  nazev: string;
  ico: string;
  dic: string;
  adresa: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TypDokladu = 'faktura_prijata' | 'uctenka' | 'danovy_doklad' | 'zalohova_faktura';
export type FormaUhrady = 'hotove' | 'prevod' | 'karta' | 'jine';
export type StatusDokladu = 'draft' | 'verified' | 'exported' | 'accounted';

// Řádková položka dokladu
export interface Polozka {
  nazev: string;              // Název položky (např. "Nafta Natural 95", "Sušenky")
  mnozstvi: number;           // Množství (např. 45)
  jednotka: string;           // Jednotka (např. "l", "ks", "kg")
  cena_za_jednotku: number;   // Cena za jednotku
  zaklad_dane: number;        // Základ daně pro tuto položku
  sazba_dph: 21 | 12 | 0;    // Sazba DPH (21%, 12%, nebo 0%)
  dph: number;                // Výše DPH pro tuto položku
  celkem_s_dph: number;       // Celková částka s DPH
}

export interface Doklad {
  id: string;
  userId: string;
  firmaId: string;

  // Odběratel (z firmy)
  odberatel_nazev: string;
  odberatel_ico: string;
  odberatel_dic: string;
  odberatel_adresa: string;

  // Dodavatel (z AI)
  dodavatel_nazev: string;
  dodavatel_ico: string;
  dodavatel_dic: string;
  dodavatel_adresa?: string;

  // Doklad
  typ_dokladu: TypDokladu;
  cislo_dokladu: string;
  variabilni_symbol: string;
  konstantni_symbol?: string;
  specificke_symbol?: string;
  datum_vystaveni: string; // YYYY-MM-DD
  datum_zdanitelneho_plneni: string; // DUZP
  datum_splatnosti?: string;

  // Částky
  celkova_castka: number;
  mena: string; // "CZK"

  // DPH - české sazby (21%, 12%, 0%)
  zaklad_dane_21?: number;
  dph_21?: number;
  zaklad_dane_12?: number;
  dph_12?: number;
  zaklad_dane_0?: number;

  // Položky dokladu
  polozky?: Polozka[];

  // Platba
  forma_uhrady?: FormaUhrady;
  bankovni_ucet_dodavatele?: string;

  // Předkontace (pro Pohoda)
  predkontace?: string; // např. "3Fv", "UD", atd.
  predkontace_md?: string; // Účet MD (má dáti) - např. "321"
  predkontace_d?: string;  // Účet D (dal) - např. "311"

  // Metadata
  originalImageUrl: string; // Google Drive link
  driveFileId: string;
  status: StatusDokladu;
  exportedToSheets: boolean;
  sheetsRowNumber?: number;

  // Účtování
  datum_uctovani?: string; // Datum, kdy byl doklad zaúčtován do účetnictví (YYYY-MM-DD)
  mesic_uctovani?: string; // Měsíc účtování ve formátu YYYY-MM
  pozde_uctovano?: boolean; // True pokud rozdíl mezi vystavením a účtováním > 30 dní

  // AI confidence scores (pro debugging)
  aiConfidence?: number;
  aiRawResponse?: string;

  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  exportedAt?: Timestamp;
  accountedAt?: Timestamp; // Timestamp zaúčtování
}

export interface DokladData {
  dodavatel_nazev: string;
  dodavatel_ico: string;
  dodavatel_dic: string;
  dodavatel_adresa?: string;
  cislo_dokladu: string;
  variabilni_symbol: string;
  konstantni_symbol?: string;
  specificke_symbol?: string;
  datum_vystaveni: string;
  datum_zdanitelneho_plneni: string;
  datum_splatnosti?: string;
  celkova_castka: number;
  mena: string;
  zaklad_dane_21?: number;
  dph_21?: number;
  zaklad_dane_12?: number;
  dph_12?: number;
  zaklad_dane_0?: number;
  polozky?: Polozka[];
  typ_dokladu: TypDokladu;
  forma_uhrady?: FormaUhrady;
  bankovni_ucet_dodavatele?: string;
  predkontace?: string;
  predkontace_md?: string;
  predkontace_d?: string;
  confidence?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadResult {
  fileId: string;
  webViewLink: string;
  success: boolean;
  error?: string;
}

export interface ExportResult {
  success: boolean;
  rowNumber?: number;
  error?: string;
}
