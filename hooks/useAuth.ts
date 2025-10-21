import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user?.email) {
        // Zkontroluj role v Firestore
        try {
          const userDoc = await getDoc(doc(db, 'allowed_users', user.email));
          if (userDoc.exists()) {
            const role = userDoc.data().role || 'user';
            setUserRole(role);
            setIsAdmin(role === 'admin');
          } else {
            setUserRole(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Chyba při načítání role:', error);
          setUserRole(null);
          setIsAdmin(false);
        }
      } else {
        setUserRole(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isAdmin, userRole };
}
