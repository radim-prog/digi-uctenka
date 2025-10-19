import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BankTransaction } from '@/lib/types';
import { useAuth } from './useAuth';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const transactionsRef = collection(db, 'bank_transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', user.uid),
      orderBy('datum', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BankTransaction[];

      setTransactions(transactionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { transactions, loading };
}
