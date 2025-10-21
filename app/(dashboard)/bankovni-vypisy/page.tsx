'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirmy } from '@/hooks/useFirmy';
import { useTransactions } from '@/hooks/useTransactions';
import { useDoklady } from '@/hooks/useDoklady';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import { generatePohodaBankXML, downloadPohodaBankXML } from '@/lib/pohoda-bank-export';

export default function BankovniVypisyPage() {
  const { user } = useAuth();
  const { activeFirma } = useFirmy();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { doklady } = useDoklady();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Pouze PDF soubory jsou podporovány pro bankovní výpisy');
      return;
    }

    setProcessing(true);
    setProgressMessage('Připravuji soubor...');

    try {
      // Převeď PDF na base64
      const base64 = await fileToBase64(file);

      // Zavolej OCR API
      setProgressMessage('Analyzuji výpis pomocí AI... (může trvat i několik minut)');
      const response = await fetch('/api/bank-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detailedError = errorData.details
          ? `${errorData.error}\n\nDetail: ${errorData.details}`
          : errorData.error || 'Chyba při zpracování';
        throw new Error(detailedError);
      }

      const { data } = await response.json();

      // Upload PDF do Firebase Storage
      setProgressMessage('Ukládám PDF...');
      const fileName = `${new Date().toISOString().split('T')[0]}_${file.name}`;
      const storagePath = `bank-statements/${activeFirma!.nazev}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Ulož transakce do Firestore
      setProgressMessage(`Ukládám ${data.transactions.length} transakcí...`);
      for (const transaction of data.transactions) {
        // Pokus se automaticky spárovat podle VS
        let parovanaFakturaId: string | undefined;
        let autoMatched = false;

        if (transaction.variabilni_symbol) {
          const matchingDoklad = doklady.find(
            d => d.variabilni_symbol === transaction.variabilni_symbol &&
                 d.status !== 'accounted'
          );
          if (matchingDoklad) {
            parovanaFakturaId = matchingDoklad.id;
            autoMatched = true;
          }
        }

        await addDoc(collection(db, 'bank_transactions'), {
          ...transaction,
          userId: user!.uid,
          firmaId: activeFirma!.id,
          vypisFileUrl: downloadURL,
          vypisFileName: file.name,
          parovana_faktura_id: parovanaFakturaId,
          auto_matched: autoMatched,
          status: autoMatched ? 'matched' : 'draft',
          createdAt: serverTimestamp(),
        });
      }

      alert(`✓ Hotovo!\n\n${data.transactions.length} transakcí zpracováno`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Chyba:', error);
      alert('Chyba při zpracování: ' + error.message);
    } finally {
      setProcessing(false);
      setProgressMessage('');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t.id));
    }
  };

  const handleExportToPohoda = async () => {
    const selectedTransactionsData = transactions.filter(t => selectedTransactions.includes(t.id));

    if (selectedTransactionsData.length === 0) {
      alert('Vyber alespoň jednu transakci pro export');
      return;
    }

    // Generuj XML
    const xml = generatePohodaBankXML(selectedTransactionsData);
    const filename = `pohoda-bank-${new Date().toISOString().split('T')[0]}.xml`;
    downloadPohodaBankXML(xml, filename);

    // Označ jako exportované
    try {
      for (const transaction of selectedTransactionsData) {
        const docRef = doc(db, 'bank_transactions', transaction.id);
        await updateDoc(docRef, {
          status: 'exported',
          exportedAt: serverTimestamp(),
        });
      }

      setSelectedTransactions([]);
      alert(`✓ ${selectedTransactionsData.length} transakcí exportováno!\n\nNyní je nahraj do Pohody.`);
    } catch (error) {
      console.error('Chyba při označování:', error);
      alert('Export proběhl, ale nepodařilo se označit transakce jako exportované.');
    }
  };

  if (!activeFirma) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800">Nemáš vybranou firmu</h3>
          <p className="mt-2 text-sm text-yellow-700">
            Před nahráním bankovního výpisu musíš mít vybranou firmu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bankovní výpisy</h1>
        <p className="mt-2 text-gray-600">
          Nahraj PDF bankovního výpisu a automaticky ho zpracuj pro import do Pohody
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Zpracováváš výpisy pro:</strong> {activeFirma.nazev} (IČO: {activeFirma.ico})
        </p>
      </div>

      {/* Varování o dlouhé době zpracování */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Upozornění:</strong> Zpracování bankovního výpisu může trvat i <strong>několik minut</strong>,
              zejména pokud obsahuje velké množství transakcí (50+ položek). Buď prosím trpělivý.
            </p>
          </div>
        </div>
      </div>

      {/* Upload section */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div
          onClick={() => !processing && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors ${
            processing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="text-6xl mb-4">🏦</div>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">
            {processing ? 'Zpracovávám...' : 'Nahrát bankovní výpis'}
          </h3>
          <p className="mt-2 text-gray-600">Klikni pro výběr PDF souboru</p>
          <p className="mt-1 text-sm text-gray-500">Podporované formáty: PDF (bankovní výpisy)</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          disabled={processing}
          className="hidden"
        />

        {/* Progress bar */}
        {processing && progressMessage && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">{progressMessage}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Celkem transakcí</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Spárované</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {transactions.filter(t => t.status === 'matched').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Nespárované</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {transactions.filter(t => t.status === 'draft').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Celková suma</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {transactions.reduce((sum, t) => sum + t.castka, 0).toLocaleString('cs-CZ')} Kč
          </p>
        </div>
      </div>

      {/* Actions */}
      {selectedTransactions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Vybráno: {selectedTransactions.length} transakcí
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExportToPohoda}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                📥 Export do Pohody ({selectedTransactions.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {transactionsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné transakce</h3>
            <p className="mt-1 text-sm text-gray-500">Nahraj první bankovní výpis.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protistrana</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Popis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Částka</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => handleSelectTransaction(transaction.id)}
                      className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(transaction.datum).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{transaction.nazev_protiuctu}</div>
                    {transaction.cislo_protiuctu && (
                      <div className="text-xs text-gray-500">{transaction.cislo_protiuctu}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {transaction.popis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.variabilni_symbol || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    <span className={transaction.typ === 'incoming' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.typ === 'incoming' ? '+' : ''}{transaction.castka.toLocaleString('cs-CZ')} Kč
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.status === 'matched' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {transaction.auto_matched ? '🤖 Auto spárováno' : 'Spárováno'}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Nespárováno
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Jak to funguje:</h3>
        <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
          <li>Nahraješ PDF bankovního výpisu</li>
          <li>AI rozpozná všechny transakce (datum, částka, VS, popis)</li>
          <li>Systém automaticky spáruje transakce s fakturami podle VS 🤖</li>
          <li>Zkontroluj a vyber transakce k exportu</li>
          <li>Exportuj do Pohody ve správném formátu</li>
          <li>Import v Pohodě = hotovo! 🎉</li>
        </ol>
      </div>
    </div>
  );
}
