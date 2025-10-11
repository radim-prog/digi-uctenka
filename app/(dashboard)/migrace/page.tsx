'use client';

import { useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export default function MigracePage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);

  const migrateDoklady = async () => {
    if (!user) {
      setStatus('Nejste přihlášeni');
      return;
    }

    setProcessing(true);
    setStatus('Načítám doklady...');

    try {
      const dokladyRef = collection(db, 'doklady');
      const snapshot = await getDocs(dokladyRef);

      setTotal(snapshot.size);
      setStatus(`Nalezeno ${snapshot.size} dokladů. Aktualizuji...`);

      let count = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Přidej předkontační pole, pokud neexistují
        const updates: any = {};

        if (!data.predkontace) {
          updates.predkontace = '3Fv'; // Výchozí hodnota pro přijaté faktury
        }

        if (!data.predkontace_md) {
          updates.predkontace_md = '';
        }

        if (!data.predkontace_d) {
          updates.predkontace_d = '';
        }

        // Aktualizuj pouze pokud je něco k aktualizaci
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'doklady', docSnap.id), updates);
          count++;
        }

        setProcessed(count);
      }

      setStatus(`✅ Hotovo! Aktualizováno ${count} z ${snapshot.size} dokladů.`);
    } catch (error: any) {
      setStatus(`❌ Chyba: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Migrace dat - Předkontace</h1>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p className="text-sm text-blue-900">
            Tento nástroj doplní pole předkontace (předkontace, predkontace_md, predkontace_d)
            do všech existujících dokladů, které je nemají.
          </p>
        </div>

        <button
          onClick={migrateDoklady}
          disabled={processing}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {processing ? 'Zpracovávám...' : 'Spustit migraci'}
        </button>

        {total > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">
              Zpracováno: {processed} / {total}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(processed / total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status && (
          <div className="mt-4 p-4 bg-gray-50 rounded border text-sm">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
