'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { validateICO, validateDIC, validateCastka, validateDatum } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { generateInvoiceDescription } from '@/lib/invoice-description';

export default function OveritPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [doklad, setDoklad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dokladIds, setDokladIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showPrevArrow, setShowPrevArrow] = useState(false);
  const [showNextArrow, setShowNextArrow] = useState(false);
  const [generatingPredkontace, setGeneratingPredkontace] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    loadDoklad();
  }, [params.id]);

  useEffect(() => {
    if (user && !authLoading) {
      loadDokladList();
    }
  }, [user, authLoading]);

  const loadDokladList = async () => {
    if (!user) return;

    try {
      const dokladyRef = collection(db, 'doklady');
      const q = query(
        dokladyRef,
        where('userId', '==', user.uid),
        where('status', 'in', ['draft', 'verified']),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const ids = snapshot.docs.map(doc => doc.id);
      setDokladIds(ids);

      const index = ids.indexOf(params.id as string);
      setCurrentIndex(index);
    } catch (error) {
      console.error('Chyba při načítání seznamu:', error);
    }
  };

  const loadDoklad = async () => {
    try {
      const docRef = doc(db, 'doklady', params.id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setDoklad({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error('Chyba při načítání:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setDoklad({ ...doklad, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!doklad.dodavatel_nazev?.trim()) {
      newErrors.dodavatel_nazev = 'Název dodavatele je povinný';
    }

    if (doklad.dodavatel_ico) {
      const icoVal = validateICO(doklad.dodavatel_ico);
      if (!icoVal.valid) newErrors.dodavatel_ico = icoVal.error!;
    }

    if (doklad.dodavatel_dic) {
      const dicVal = validateDIC(doklad.dodavatel_dic);
      if (!dicVal.valid) newErrors.dodavatel_dic = dicVal.error!;
    }

    if (!doklad.cislo_dokladu?.trim()) {
      newErrors.cislo_dokladu = 'Číslo dokladu je povinné';
    }

    const datumVystaveniVal = validateDatum(doklad.datum_vystaveni);
    if (!datumVystaveniVal.valid) {
      newErrors.datum_vystaveni = datumVystaveniVal.error!;
    }

    const duzpVal = validateDatum(doklad.datum_zdanitelneho_plneni);
    if (!duzpVal.valid) {
      newErrors.datum_zdanitelneho_plneni = duzpVal.error!;
    }

    const castkaVal = validateCastka(doklad.celkova_castka);
    if (!castkaVal.valid) {
      newErrors.celkova_castka = castkaVal.error!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGeneratePredkontace = async () => {
    setGeneratingPredkontace(true);
    try {
      const response = await fetch('/api/predkontace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doklad),
      });

      if (!response.ok) {
        throw new Error('Chyba při generování předkontace');
      }

      const result = await response.json();

      if (result.success) {
        setDoklad({
          ...doklad,
          predkontace: result.data.predkontace,
          predkontace_md: result.data.predkontace_md,
          predkontace_d: result.data.predkontace_d,
        });
      }
    } catch (error) {
      console.error('Chyba při generování předkontace:', error);
    } finally {
      setGeneratingPredkontace(false);
    }
  };

  const handleSave = async (goToNext = false) => {
    if (!validateForm()) {
      alert('Oprav chyby ve formuláři');
      return;
    }

    setSaving(true);

    try {
      const docRef = doc(db, 'doklady', doklad.id);

      await updateDoc(docRef, {
        ...doklad,
        status: 'verified',
        verifiedAt: serverTimestamp(),
      });

      if (goToNext) {
        navigateNext();
      } else {
        alert('✓ Doklad uložen');
      }

    } catch (error) {
      console.error('Chyba při ukládání:', error);
      alert('Chyba při ukládání');
    } finally {
      setSaving(false);
    }
  };

  const navigatePrev = () => {
    if (currentIndex > 0) {
      router.push(`/overit/${dokladIds[currentIndex - 1]}`);
    }
  };

  const navigateNext = () => {
    if (currentIndex < dokladIds.length - 1) {
      router.push(`/overit/${dokladIds[currentIndex + 1]}`);
    } else {
      // Poslední doklad - vrátit na dashboard
      router.push('/');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!doklad) {
    return <div className="text-center py-12">Doklad nenalezen</div>;
  }

  return (
    <div className="max-w-full mx-auto px-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-gray-900">Zkontroluj a potvrď data</h1>
        <button
          onClick={() => router.push('/')}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Zpět
        </button>
      </div>

      {/* Layout: Náhled vlevo (60%), Formulář vpravo (40%) */}
      <div className="grid grid-cols-[60%_40%] gap-4">
        {/* LEVÁ STRANA: VELKÝ NÁHLED DOKLADU */}
        <div className="bg-white rounded-lg shadow p-3 sticky top-4" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Naskenovaný doklad</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setImageRotation((prev) => (prev - 90) % 360)}
                className="p-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                ↺
              </button>
              <button
                onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                className="p-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                ↻
              </button>
              <button
                onClick={() => setImageZoom((prev) => Math.max(0.5, prev - 0.25))}
                className="p-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                −
              </button>
              <button
                onClick={() => setImageZoom((prev) => Math.min(3, prev + 0.25))}
                className="p-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                +
              </button>
              {(doklad.imageBase64 || (doklad.originalImageUrl && doklad.originalImageUrl.trim() !== '')) && (
                <a
                  href={doklad.imageBase64 ? `data:${doklad.imageMimeType};base64,${doklad.imageBase64}` : doklad.originalImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  ↗
                </a>
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-auto bg-gray-50" style={{ height: 'calc(100% - 40px)' }}>
            {doklad.imageBase64 ? (
              doklad.imageMimeType === 'application/pdf' ? (
                <iframe
                  src={`data:application/pdf;base64,${doklad.imageBase64}`}
                  className="w-full h-full"
                  title="Doklad PDF"
                />
              ) : (
                <img
                  src={`data:${doklad.imageMimeType || 'image/jpeg'};base64,${doklad.imageBase64}`}
                  alt="Doklad"
                  className="w-full h-auto"
                />
              )
            ) : doklad.originalImageUrl && doklad.originalImageUrl.trim() !== '' ? (
              doklad.imageMimeType === 'application/pdf' ? (
                <iframe
                  src={doklad.originalImageUrl}
                  className="w-full h-full"
                  title="Doklad PDF"
                />
              ) : (
                <img
                  src={doklad.originalImageUrl}
                  alt="Doklad"
                  className="w-full h-auto"
                  crossOrigin="use-credentials"
                />
              )
            ) : (
              <div className="w-full h-64 flex items-center justify-center">
                <p className="text-gray-500">Náhled není k dispozici</p>
              </div>
            )}
          </div>
        </div>

        {/* PRAVÁ STRANA: FORMULÁŘ VE STYLU POHODY */}
        <div className="bg-white rounded-lg shadow p-3" style={{ height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div className="grid grid-cols-2 gap-4">

            {/* ========== LEVÝ SLOUPEC: ČÍSLA A ČÁSTKY ========== */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-700 border-b pb-1">Faktura</h3>

              {/* Typ dokladu */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Typ</label>
                <select
                  value={doklad.typ_dokladu}
                  onChange={(e) => handleChange('typ_dokladu', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="faktura_prijata">Faktura přijatá</option>
                  <option value="uctenka">Účtenka</option>
                  <option value="danovy_doklad">Daňový doklad</option>
                  <option value="zalohova_faktura">Zálohová faktura</option>
                </select>
              </div>

              {/* Číslo dokladu */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Číslo *</label>
                <input
                  type="text"
                  value={doklad.cislo_dokladu}
                  onChange={(e) => handleChange('cislo_dokladu', e.target.value)}
                  className={`w-full px-2 py-1 text-sm border rounded ${errors.cislo_dokladu ? 'border-red-500' : ''}`}
                />
              </div>

              {/* Variabilní symbol */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Var.sym.</label>
                <input
                  type="text"
                  value={doklad.variabilni_symbol}
                  onChange={(e) => handleChange('variabilni_symbol', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>

              {/* Součet položek - nadpis */}
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-700 mb-2">Součet položek</p>

                {/* DPH 21% */}
                <div className="grid grid-cols-3 gap-1 mb-1 text-xs">
                  <input
                    type="number"
                    step="0.01"
                    value={doklad.zaklad_dane_21 || ''}
                    onChange={(e) => handleChange('zaklad_dane_21', parseFloat(e.target.value) || null)}
                    className="px-2 py-1 border rounded text-right"
                    placeholder="Základ"
                  />
                  <span className="px-2 py-1 bg-gray-100 rounded text-center">21</span>
                  <input
                    type="number"
                    step="0.01"
                    value={doklad.dph_21 || ''}
                    onChange={(e) => handleChange('dph_21', parseFloat(e.target.value) || null)}
                    className="px-2 py-1 border rounded text-right"
                    placeholder="DPH"
                  />
                </div>

                {/* DPH 12% */}
                <div className="grid grid-cols-3 gap-1 mb-1 text-xs">
                  <input
                    type="number"
                    step="0.01"
                    value={doklad.zaklad_dane_12 || ''}
                    onChange={(e) => handleChange('zaklad_dane_12', parseFloat(e.target.value) || null)}
                    className="px-2 py-1 border rounded text-right"
                    placeholder="Základ"
                  />
                  <span className="px-2 py-1 bg-gray-100 rounded text-center">12</span>
                  <input
                    type="number"
                    step="0.01"
                    value={doklad.dph_12 || ''}
                    onChange={(e) => handleChange('dph_12', parseFloat(e.target.value) || null)}
                    className="px-2 py-1 border rounded text-right"
                    placeholder="DPH"
                  />
                </div>

                {/* DPH 0% */}
                <div className="grid grid-cols-3 gap-1 mb-1 text-xs">
                  <input
                    type="number"
                    step="0.01"
                    value={doklad.zaklad_dane_0 || ''}
                    onChange={(e) => handleChange('zaklad_dane_0', parseFloat(e.target.value) || null)}
                    className="px-2 py-1 border rounded text-right"
                    placeholder="Základ"
                  />
                  <span className="px-2 py-1 bg-gray-100 rounded text-center">0</span>
                  <span className="px-2 py-1 text-center">-</span>
                </div>

                {/* Celkem */}
                <div className="mt-2 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={doklad.celkova_castka}
                      onChange={(e) => handleChange('celkova_castka', parseFloat(e.target.value))}
                      className={`px-2 py-2 text-base font-bold border-2 rounded text-right ${errors.celkova_castka ? 'border-red-500' : 'border-blue-500'}`}
                    />
                    <select
                      value={doklad.mena}
                      onChange={(e) => handleChange('mena', e.target.value)}
                      className="px-2 py-2 text-sm border rounded"
                    >
                      <option value="CZK">CZK</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== PRAVÝ SLOUPEC: DODAVATEL A DATA ========== */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-700 border-b pb-1">Dodavatel</h3>

              {/* Dodavatel - NAHORU! */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Firma *</label>
                <input
                  type="text"
                  value={doklad.dodavatel_nazev}
                  onChange={(e) => handleChange('dodavatel_nazev', e.target.value)}
                  className={`w-full px-2 py-1 text-sm border rounded ${errors.dodavatel_nazev ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">IČ</label>
                  <input
                    type="text"
                    value={doklad.dodavatel_ico || ''}
                    onChange={(e) => handleChange('dodavatel_ico', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded ${errors.dodavatel_ico ? 'border-red-500' : ''}`}
                    maxLength={8}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">DIČ</label>
                  <input
                    type="text"
                    value={doklad.dodavatel_dic || ''}
                    onChange={(e) => handleChange('dodavatel_dic', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded ${errors.dodavatel_dic ? 'border-red-500' : ''}`}
                  />
                </div>
              </div>

              {/* Datumy */}
              <div className="pt-2 border-t">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Datum vystavení *</label>
                  <input
                    type="date"
                    value={doklad.datum_vystaveni}
                    onChange={(e) => handleChange('datum_vystaveni', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded ${errors.datum_vystaveni ? 'border-red-500' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Datum zd.plnění *</label>
                <input
                  type="date"
                  value={doklad.datum_zdanitelneho_plneni}
                  onChange={(e) => handleChange('datum_zdanitelneho_plneni', e.target.value)}
                  className={`w-full px-2 py-1 text-sm border rounded ${errors.datum_zdanitelneho_plneni ? 'border-red-500' : ''}`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Datum splatnosti</label>
                <input
                  type="date"
                  value={doklad.datum_splatnosti || ''}
                  onChange={(e) => handleChange('datum_splatnosti', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>

              {/* Předkontace */}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs text-gray-600">Předkontace</label>
                  {generatingPredkontace && (
                    <span className="text-xs text-purple-600">⏳ Generuji...</span>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    value={
                      doklad.predkontace_md && doklad.predkontace_d
                        ? `${doklad.predkontace_md}/${doklad.predkontace_d}`
                        : doklad.predkontace_md || ''
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      const parts = value.split('/');
                      if (parts.length === 2) {
                        handleChange('predkontace_md', parts[0].trim());
                        handleChange('predkontace_d', parts[1].trim());
                      } else if (parts.length === 1 && value.trim()) {
                        handleChange('predkontace_md', value.trim());
                        handleChange('predkontace_d', '');
                      } else {
                        handleChange('predkontace_md', '');
                        handleChange('predkontace_d', '');
                      }
                    }}
                    className="w-full px-2 py-1 text-sm border rounded"
                    placeholder="518/321"
                  />
                  <p className="text-xs text-gray-500 mt-1">MD/D</p>
                </div>
              </div>

              {/* Forma úhrady */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Forma úhrady</label>
                <select
                  value={doklad.forma_uhrady || 'prevod'}
                  onChange={(e) => handleChange('forma_uhrady', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="prevod">Převodem</option>
                  <option value="hotove">Hotově</option>
                  <option value="karta">Kartou</option>
                  <option value="jine">Jiné</option>
                </select>
              </div>
            </div>
          </div>

          {/* Položky (pokud jsou) */}
          {doklad.polozky && doklad.polozky.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-gray-600 mb-2">Položky ({doklad.polozky.length})</p>
              <div className="max-h-24 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-1 py-1 text-left text-xs">Název</th>
                      <th className="px-1 py-1 text-right text-xs">Celkem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doklad.polozky.map((polozka: any, index: number) => (
                      <tr key={index} className="border-t">
                        <td className="px-1 py-1 text-xs">{polozka.nazev}</td>
                        <td className="px-1 py-1 text-right text-xs font-semibold">{polozka.celkem_s_dph.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Popis pro Pohodu - přes celou šířku */}
          <div className="mt-3 pt-3 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">📄 Popis pro export do Pohody</label>
            <div className="px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <p className="text-base font-medium text-gray-800">{generateInvoiceDescription(doklad)}</p>
              <p className="text-xs text-gray-600 mt-2">💡 Tento text se objeví v poli "Text" při importu do Pohody</p>
            </div>
          </div>

          {/* Info o firmě */}
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-600">
              <strong>Odběratel:</strong> {doklad.odberatel_nazev}
            </p>
          </div>

          {/* Tlačítka uložit */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Ukládám...' : '💾 Uložit'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Ukládám...' : 'Uložit a další →'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation arrows - appear on hover */}
      {currentIndex > 0 && (
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50"
          onMouseEnter={() => setShowPrevArrow(true)}
          onMouseLeave={() => setShowPrevArrow(false)}
        >
          <div className="w-16 h-32 flex items-center">
            <button
              onClick={navigatePrev}
              className={`ml-2 p-3 bg-blue-600 text-white rounded-r-lg shadow-lg hover:bg-blue-700 transition-all ${
                showPrevArrow ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
              style={{ transition: 'opacity 0.2s, transform 0.2s' }}
            >
              ←
            </button>
          </div>
        </div>
      )}

      {currentIndex < dokladIds.length - 1 && (
        <div
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
          onMouseEnter={() => setShowNextArrow(true)}
          onMouseLeave={() => setShowNextArrow(false)}
        >
          <div className="w-16 h-32 flex items-center justify-end">
            <button
              onClick={navigateNext}
              className={`mr-2 p-3 bg-blue-600 text-white rounded-l-lg shadow-lg hover:bg-blue-700 transition-all ${
                showNextArrow ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
              }`}
              style={{ transition: 'opacity 0.2s, transform 0.2s' }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
