'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

interface AllowedUser {
  email: string;
  role: 'admin' | 'user';
  addedBy?: string;
  addedAt?: any;
}

export default function AdminUsersPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (user && isAdmin) {
      loadUsers();
    }
  }, [user, isAdmin]);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'allowed_users'));
      const usersList: AllowedUser[] = [];
      usersSnapshot.forEach((doc) => {
        usersList.push({
          email: doc.id,
          ...(doc.data() as Omit<AllowedUser, 'email'>),
        });
      });
      setUsers(usersList.sort((a, b) => a.email.localeCompare(b.email)));
      setLoadingUsers(false);
    } catch (err: any) {
      setError(`Chyba při načítání uživatelů: ${err.message}`);
      setLoadingUsers(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validace emailu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Neplatný formát emailu');
      return;
    }

    // Zkontroluj jestli už není
    if (users.find((u) => u.email === newEmail)) {
      setError('Tento email už je v seznamu');
      return;
    }

    try {
      await setDoc(doc(db, 'allowed_users', newEmail), {
        email: newEmail,
        role: newRole,
        addedBy: user?.email,
        addedAt: serverTimestamp(),
      });

      setSuccess(`Uživatel ${newEmail} byl přidán jako ${newRole}`);
      setNewEmail('');
      setNewRole('user');
      await loadUsers();
    } catch (err: any) {
      setError(`Chyba při přidávání uživatele: ${err.message}`);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Opravdu chceš odstranit ${email}?`)) return;

    setError('');
    setSuccess('');

    try {
      await deleteDoc(doc(db, 'allowed_users', email));
      setSuccess(`Uživatel ${email} byl odstraněn`);
      await loadUsers();
    } catch (err: any) {
      setError(`Chyba při odstraňování: ${err.message}`);
    }
  };

  const handleChangeRole = async (email: string, newRole: 'admin' | 'user') => {
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'allowed_users', email), {
        role: newRole,
      });
      setSuccess(`Role uživatele ${email} změněna na ${newRole}`);
      await loadUsers();
    } catch (err: any) {
      setError(`Chyba při změně role: ${err.message}`);
    }
  };

  if (loading || loadingUsers) {
    return (
      <div className="p-8">
        <div className="text-center">Načítám...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">👥 Správa uživatelů</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Formulář pro přidání uživatele */}
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">➕ Přidat uživatele</h2>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="veronika@wikiporadce.cz"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Přidat
          </button>
        </form>
      </div>

      {/* Seznam uživatelů */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">📋 Povolení uživatelé ({users.length})</h2>
        </div>

        <div className="divide-y">
          {users.map((allowedUser) => (
            <div key={allowedUser.email} className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{allowedUser.email}</div>
                <div className="text-sm text-gray-500">
                  {allowedUser.addedBy && `Přidal: ${allowedUser.addedBy}`}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={allowedUser.role}
                  onChange={(e) =>
                    handleChangeRole(allowedUser.email, e.target.value as 'admin' | 'user')
                  }
                  className={`px-3 py-1 rounded-lg border ${
                    allowedUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 border-purple-300'
                      : 'bg-blue-100 text-blue-700 border-blue-300'
                  }`}
                  disabled={allowedUser.email === user?.email} // Nemůžeš změnit vlastní roli
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  onClick={() => handleDeleteUser(allowedUser.email)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300"
                  disabled={allowedUser.email === user?.email} // Nemůžeš smazat sebe
                >
                  🗑️ Odstranit
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">Žádní uživatelé</div>
          )}
        </div>
      </div>
    </div>
  );
}
