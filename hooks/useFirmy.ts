import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { Firma } from '@/lib/types';

export function useFirmy() {
  const { user } = useAuth();
  const [firmy, setFirmy] = useState<Firma[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFirma, setActiveFirmaState] = useState<Firma | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'firmy'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firmyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Firma[];

      setFirmy(firmyData);

      // Najdi aktivní firmu
      const active = firmyData.find(f => f.isActive);
      setActiveFirmaState(active || null);

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addFirma = async (data: Omit<Firma, 'id' | 'isActive' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) return;

    await addDoc(collection(db, 'firmy'), {
      ...data,
      userId: user.uid,
      isActive: firmy.length === 0, // První firma je automaticky aktivní
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateFirma = async (id: string, data: Partial<Firma>) => {
    const docRef = doc(db, 'firmy', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteFirma = async (id: string) => {
    await deleteDoc(doc(db, 'firmy', id));
  };

  const setActiveFirma = async (id: string) => {
    // Deaktivuj všechny firmy
    for (const firma of firmy) {
      await updateDoc(doc(db, 'firmy', firma.id), { isActive: false });
    }

    // Aktivuj vybranou firmu
    await updateDoc(doc(db, 'firmy', id), { isActive: true });
  };

  return {
    firmy,
    loading,
    activeFirma,
    addFirma,
    updateFirma,
    deleteFirma,
    setActiveFirma,
  };
}
