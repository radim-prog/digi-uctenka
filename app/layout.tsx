import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Digi-Účtenka - Digitalizace dokladů pomocí AI',
  description: 'Chytrá aplikace pro skenování a zpracování účtenek a faktur pomocí AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
