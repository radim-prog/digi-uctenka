'use client';

import { useDoklady } from '@/hooks/useDoklady';
import { useFirmy } from '@/hooks/useFirmy';
import Link from 'next/link';
import { useState } from 'react';
import { generatePohodaXML, downloadPohodaXML } from '@/lib/pohoda-export';

export default function DashboardPage() {
  const { doklady, loading } = useDoklady();
  const { activeFirma } = useFirmy();
  const [view, setView] = useState<'fronta' | 'archiv'>('fronta'); // Pracovní fronta nebo Archiv
  const [filter, setFilter] = useState<'all' | 'draft' | 'verified' | 'exported'>('all');
  const [selectedDoklady, setSelectedDoklady] = useState<string[]>([]);
  const [generatingPredkontace, setGeneratingPredkontace] = useState(false);

  // Pracovní fronta: draft, verified, exported (ještě nezaúčtované)
  const frontaDoklady = doklady.filter(d =>
    d.status === 'draft' || d.status === 'verified' || d.status === 'exported'
  );

  // Archiv: accounted (zaúčtované)
  const archivDoklady = doklady.filter(d => d.status === 'accounted');

  // Aktuální zobrazení
  const displayedDoklady = view === 'fronta' ? frontaDoklady : archivDoklady;

  const filteredDoklady = displayedDoklady.filter(d =>
    filter === 'all' ? true : d.status === filter
  );

  // Doklady bez předkontace
  const dokladyBezPredkontace = doklady.filter(d =>
    !d.predkontace_md && (d.status === 'draft' || d.status === 'verified')
  );

  const stats = {
    total: doklady.length,
    fronta: frontaDoklady.length,
    archiv: archivDoklady.length,
    totalAmount: doklady.reduce((sum, d) => sum + d.celkova_castka, 0),
    bezPredkontace: dokladyBezPredkontace.length,
  };

  const handleSelectDoklad = (id: string) => {
    setSelectedDoklady(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDoklady.length === filteredDoklady.length) {
      setSelectedDoklady([]);
    } else {
      setSelectedDoklady(filteredDoklady.map(d => d.id));
    }
  };

  const handleGeneratePredkontaceBatch = async () => {
    if (dokladyBezPredkontace.length === 0) {
      alert('Všechny doklady již mají předkontaci');
      return;
    }

    if (!confirm(`Opravdu chcete doplnit předkontaci pro ${dokladyBezPredkontace.length} dokladů pomocí AI?`)) {
      return;
    }

    setGeneratingPredkontace(true);

    try {
      const response = await fetch('/api/predkontace-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doklady: dokladyBezPredkontace.map(d => ({
            id: d.id,
            typ_dokladu: d.typ_dokladu,
            dodavatel_nazev: d.dodavatel_nazev,
            celkova_castka: d.celkova_castka,
            mena: d.mena,
            forma_uhrady: d.forma_uhrady,
            polozky: d.polozky,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Ulož výsledky do Firestore
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        for (const item of result.data) {
          if (item.success && item.predkontace) {
            const docRef = doc(db, 'doklady', item.id);
            await updateDoc(docRef, {
              predkontace: item.predkontace.predkontace,
              predkontace_md: item.predkontace.predkontace_md,
              predkontace_d: item.predkontace.predkontace_d,
            });
          }
        }

        alert(`✓ Hotovo!\n\nÚspěšně: ${result.summary.success}\nSelhalo: ${result.summary.failed}`);
        window.location.reload();
      }
    } catch (error) {
      console.error('Chyba při hromadném generování:', error);
      alert('Chyba při generování předkontací');
    } finally {
      setGeneratingPredkontace(false);
    }
  };

  const handleMarkAsAccounted = async () => {
    const selectedDokladyData = doklady.filter(d => selectedDoklady.includes(d.id));

    if (selectedDokladyData.length === 0) {
      alert('Vyber alespoň jeden doklad');
      return;
    }

    const datumUctovani = prompt('Do kterého měsíce byly doklady zaúčtovány? (formát: YYYY-MM, např. 2025-01)');
    if (!datumUctovani || !/^\d{4}-\d{2}$/.test(datumUctovani)) {
      alert('Neplatný formát data. Použij YYYY-MM (např. 2025-01)');
      return;
    }

    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      for (const doklad of selectedDokladyData) {
        // Vypočítej, zda je účtováno pozdě (> 30 dní po vystavení)
        const datumVystaveni = new Date(doklad.datum_vystaveni);
        const datumUctovaniDate = new Date(datumUctovani + '-01');
        const diffDays = Math.floor((datumUctovaniDate.getTime() - datumVystaveni.getTime()) / (1000 * 60 * 60 * 24));
        const pozdeUctovano = diffDays > 30;

        const docRef = doc(db, 'doklady', doklad.id);
        await updateDoc(docRef, {
          status: 'accounted',
          datum_uctovani: datumUctovani + '-01',
          mesic_uctovani: datumUctovani,
          pozde_uctovano: pozdeUctovano,
          accountedAt: serverTimestamp(),
        });
      }

      setSelectedDoklady([]);
      alert(`✓ ${selectedDokladyData.length} dokladů zaúčtováno do měsíce ${datumUctovani}!\n\nDoklady byly přesunuty do Archivu.`);
    } catch (error) {
      console.error('Chyba při zaúčtování:', error);
      alert('Chyba při zaúčtování dokladů.');
    }
  };

  const handleDeleteDoklady = async (dokladIds: string[]) => {
    if (dokladIds.length === 0) {
      alert('Vyber alespoň jeden doklad ke smazání');
      return;
    }

    const confirmMessage = dokladIds.length === 1
      ? 'Opravdu chceš smazat tento doklad? Tuto akci nelze vrátit zpět.'
      : `Opravdu chceš smazat ${dokladIds.length} dokladů? Tuto akci nelze vrátit zpět.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      for (const id of dokladIds) {
        const docRef = doc(db, 'doklady', id);
        await deleteDoc(docRef);
      }

      setSelectedDoklady([]);
      alert(`✓ ${dokladIds.length} dokladů bylo smazáno.`);
    } catch (error) {
      console.error('Chyba při mazání:', error);
      alert('Chyba při mazání dokladů.');
    }
  };

  const handleExportToPohoda = async () => {
    const selectedDokladyData = doklady.filter(d => selectedDoklady.includes(d.id));

    if (selectedDokladyData.length === 0) {
      alert('Vyber alespoň jeden doklad pro export');
      return;
    }

    // Export XML
    const xml = generatePohodaXML(selectedDokladyData);
    const filename = `pohoda-${new Date().toISOString().split('T')[0]}.xml`;
    downloadPohodaXML(xml, filename);

    // Označ jako exportované
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      for (const doklad of selectedDokladyData) {
        const docRef = doc(db, 'doklady', doklad.id);
        await updateDoc(docRef, {
          status: 'exported',
          exportedAt: serverTimestamp(),
        });
      }

      setSelectedDoklady([]);
      alert(`✓ ${selectedDokladyData.length} dokladů exportováno!\n\nNyní je nahraj do Pohody a pak je označ jako "Zaúčtováno".`);
    } catch (error) {
      console.error('Chyba při označování:', error);
      alert('Export proběhl, ale nepodařilo se označit doklady jako exportované.');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {!activeFirma && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Nemáš vybranou žádnou firmu. <Link href="/firmy" className="font-semibold underline">Přidej nebo vyber firmu</Link> pro nahrání dokladů.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Přepínač Fronta / Archiv */}
      <div className="bg-white rounded-lg shadow p-2 inline-flex gap-2">
        <button
          onClick={() => setView('fronta')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            view === 'fronta'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📋 Pracovní fronta ({stats.fronta})
        </button>
        <button
          onClick={() => setView('archiv')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            view === 'archiv'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📁 Archiv ({stats.archiv})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Celkem dokladů</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">
            {view === 'fronta' ? 'Ke zpracování' : 'V archivu'}
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {view === 'fronta' ? stats.fronta : stats.archiv}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Bez předkontace</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.bezPredkontace}</p>
          {stats.bezPredkontace > 0 && (
            <button
              onClick={handleGeneratePredkontaceBatch}
              disabled={generatingPredkontace}
              className="mt-2 text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:bg-gray-400"
            >
              {generatingPredkontace ? '⏳ Generuji...' : '✨ Doplnit AI'}
            </button>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Celková suma</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalAmount.toLocaleString('cs-CZ')} Kč
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Vše
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg ${filter === 'draft' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Koncepty
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-lg ${filter === 'verified' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Ověřené
            </button>
            <button
              onClick={() => setFilter('exported')}
              className={`px-4 py-2 rounded-lg ${filter === 'exported' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Exportované
            </button>
          </div>

          {selectedDoklady.length > 0 && (
            <div className="flex gap-2">
              {view === 'fronta' && (
                <>
                  <button
                    onClick={handleExportToPohoda}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    📥 Export do Pohody ({selectedDoklady.length})
                  </button>
                  <button
                    onClick={handleMarkAsAccounted}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    ✓ Potvrdit zaúčtování ({selectedDoklady.length})
                  </button>
                </>
              )}
              <button
                onClick={() => handleDeleteDoklady(selectedDoklady)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                🗑️ Smazat ({selectedDoklady.length})
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredDoklady.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné doklady</h3>
            <p className="mt-1 text-sm text-gray-500">Začni nahráním prvního dokladu.</p>
            <div className="mt-6">
              <Link
                href="/nahrat"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                + Nahrát doklad
              </Link>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDoklady.length === filteredDoklady.length && filteredDoklady.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dodavatel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Číslo dokladu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Částka</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akce</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoklady.map((doklad) => (
                <tr key={doklad.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedDoklady.includes(doklad.id)}
                      onChange={() => handleSelectDoklad(doklad.id)}
                      className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="text-gray-900">
                        {new Date(doklad.datum_vystaveni).toLocaleDateString('cs-CZ')}
                      </div>
                      {doklad.pozde_uctovano && (
                        <span className="text-xs text-red-600 font-semibold">
                          ⚠️ Účtováno pozdě
                        </span>
                      )}
                      {doklad.mesic_uctovani && (
                        <div className="text-xs text-gray-500">
                          Účtováno: {doklad.mesic_uctovani}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doklad.dodavatel_nazev}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doklad.cislo_dokladu}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {doklad.celkova_castka.toLocaleString('cs-CZ')} {doklad.mena}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doklad.status === 'accounted' ? 'bg-purple-100 text-purple-800' :
                      doklad.status === 'verified' ? 'bg-green-100 text-green-800' :
                      doklad.status === 'exported' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doklad.status === 'accounted' ? 'Zaúčtováno' :
                       doklad.status === 'verified' ? 'Ověřeno' :
                       doklad.status === 'exported' ? 'Exportováno' :
                       'Koncept'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/overit/${doklad.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Upravit
                    </Link>
                    <button
                      onClick={() => handleDeleteDoklady([doklad.id])}
                      className="text-red-600 hover:text-red-900"
                      title="Smazat doklad"
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
