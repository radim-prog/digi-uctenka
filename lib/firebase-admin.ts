// Firebase Admin SDK pro server-side operace
// Tento soubor je připraven pro budoucí použití (např. pro server-side verifikaci)

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY není nastavený');
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return {
    firestore: getFirestore(),
  };
}
