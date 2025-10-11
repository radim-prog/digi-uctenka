'use client';

import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Digi-Účtenka
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/firmy" className="text-gray-600 hover:text-gray-900">
              Firmy
            </Link>
            <Link href="/nahrat" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              + Nahrát doklad
            </Link>

            <div className="flex items-center gap-3 ml-4 pl-4 border-l">
              {user.photoURL && (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Odhlásit
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
