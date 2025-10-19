import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { Doklad } from '@/lib/types';

export function useDoklady() {
  const { user } = useAuth();
  const [doklady, setDoklady] = useState<Doklad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'doklady'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dokladyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Doklad[];

        console.log(`✓ Načteno ${dokladyData.length} dokladů z Firestore`);
        setDoklady(dokladyData);
        setLoading(false);
      },
      (error) => {
        console.error('⚠️ Firestore dotaz selhal:', error);
        console.error('⚠️ Error code:', error.code);
        console.error('⚠️ Error message:', error.message);
        // Pokud selže index, zkus bez orderBy
        if (error.code === 'failed-precondition') {
          console.log('🔄 Zkouším dotaz bez orderBy...');
          const simpleQ = query(
            collection(db, 'doklady'),
            where('userId', '==', user.uid)
          );

          const simpleUnsub = onSnapshot(simpleQ, (snapshot) => {
            const dokladyData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Doklad[];

            console.log(`✓ Načteno ${dokladyData.length} dokladů (fallback bez orderBy)`);

            // Seřaď v paměti
            dokladyData.sort((a, b) => {
              const aTime = a.createdAt?.seconds || 0;
              const bTime = b.createdAt?.seconds || 0;
              return bTime - aTime;
            });

            setDoklady(dokladyData);
            setLoading(false);
          });

          return simpleUnsub;
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { doklady, loading };
}
