/**
 * Init script pro vytvoření prvních admin účtů
 * Spusť: node scripts/init-admin.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, setDoc, doc } = require('firebase/firestore');

// Firebase config z .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCZWCYmCgfNjYuyDqugKL7q2ECNJLip-cU',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'digitenka.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'digitenka',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'digitenka.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1007650804889',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1007650804889:web:b2bca45598e2fe5e9a5408',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initAdminUsers() {
  console.log('🚀 Inicializace admin účtů...\n');

  const adminUsers = [
    {
      email: 'radim@wikiporadce.cz',
      role: 'admin',
    },
    {
      email: 'veronika@wikiporadce.cz',
      role: 'user',
    },
  ];

  try {
    for (const user of adminUsers) {
      await setDoc(doc(db, 'allowed_users', user.email), {
        email: user.email,
        role: user.role,
        addedBy: 'system',
        addedAt: new Date(),
      });

      console.log(`✅ ${user.email} - ${user.role}`);
    }

    console.log('\n🎉 Admin účty byly úspěšně vytvořeny!');
    console.log('\n📝 Další uživatele můžeš přidat přes admin panel:');
    console.log('   http://localhost:3000/admin/users');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Chyba při inicializaci:', error.message);
    console.error('\nPokud vidíš "Missing or insufficient permissions":');
    console.error('1. Nasaď Firestore rules: firebase deploy --only firestore');
    console.error('2. Nebo dočasně povol všem: allow read, write: if true;');
    process.exit(1);
  }
}

initAdminUsers();
