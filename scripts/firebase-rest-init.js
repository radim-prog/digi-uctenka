#!/usr/bin/env node

// Vytvoření admin účtů přes Firebase REST API
const FIREBASE_API_KEY = 'AIzaSyCZWCYmCgfNjYuyDqugKL7q2ECNJLip-cU';

const fs = require('fs');
const path = require('path');

// Zjistím Project ID z .firebaserc
let PROJECT_ID = 'digi-uctenka-6ecbd'; // fallback

try {
  const firebaseRcPath = path.join(__dirname, '..', '.firebaserc');
  const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
  PROJECT_ID = firebaseRc.projects?.default || PROJECT_ID;
  console.log('📋 Firebase Project ID:', PROJECT_ID);
  console.log('');
} catch (e) {
  console.log('⚠️  .firebaserc nenalezen, používám fallback:', PROJECT_ID);
  console.log('');
}

async function createUser(email, role) {
  // URL encode email pro Firestore document ID
  const docId = email.replace('@', '%40').replace(/\./g, '%2E');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/allowed_users/${docId}?key=${FIREBASE_API_KEY}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        email: { stringValue: email },
        role: { stringValue: role },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error.substring(0, 200)}`);
  }

  return await response.json();
}

async function main() {
  console.log('🔥 Vytváření admin účtů přes Firebase REST API...');
  console.log('');

  const users = [
    { email: 'radim@wikiporadce.cz', role: 'admin' },
    { email: 'veronika@wikiporadce.cz', role: 'user' }
  ];

  for (const user of users) {
    try {
      await createUser(user.email, user.role);
      console.log(`✅ ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`❌ ${user.email}: ${error.message}`);
    }
  }

  console.log('');
  console.log('✅ ========================================');
  console.log('✅ Admin účty vytvořeny!');
  console.log('✅ ========================================');
  console.log('');
  console.log('⚠️  POZOR: Security Rules NEBYLY nasazeny!');
  console.log('');
  console.log('Firebase Security Rules musíš nasadit RUČNĚ:');
  console.log('');
  console.log('  1. Přihlas se:');
  console.log('     firebase login');
  console.log('');
  console.log('  2. Nasaď rules:');
  console.log('     firebase deploy --only firestore:rules,firestore:indexes,storage');
  console.log('');
  console.log('Důvod: REST API neumožňuje deployment rules,');
  console.log('       vyžaduje Firebase CLI autentizaci.');
  console.log('');
  console.log('📊 Kontrola v Firebase Console:');
  console.log('   https://console.firebase.google.com/project/' + PROJECT_ID + '/firestore');
  console.log('');
}

main().catch(err => {
  console.error('❌ CHYBA:', err.message);
  process.exit(1);
});
