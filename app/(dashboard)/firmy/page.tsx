'use client';

import { useFirmy } from '@/hooks/useFirmy';
import { useState } from 'react';
import { validateICO, validateDIC } from '@/lib/validation';

export default function FirmyPage() {
  const { firmy, loading, addFirma, deleteFirma, setActiveFirma, activeFirma } = useFirmy();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nazev: '',
    ico: '',
    dic: '',
    adresa: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.nazev.trim()) {
      newErrors.nazev = 'Název firmy je povinný';
    }

    const icoValidation = validateICO(formData.ico);
    if (!icoValidation.valid) {
      newErrors.ico = icoValidation.error!;
    }

    const dicValidation = validateDIC(formData.dic);
    if (!dicValidation.valid) {
      newErrors.dic = dicValidation.error!;
    }

    if (!formData.adresa.trim()) {
      newErrors.adresa = 'Adresa je povinná';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    await addFirma(formData);
    setSaving(false);

    setFormData({ nazev: '', ico: '', dic: '', adresa: '' });
    setShowForm(false);
    setErrors({});
  };

  if (loading) {
    return <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Moje firmy</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Zrušit' : '+ Přidat firmu'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Nová firma</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Název firmy *</label>
              <input
                type="text"
                value={formData.nazev}
                onChange={(e) => setFormData({ ...formData, nazev: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.nazev ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Moje firma s.r.o."
              />
              {errors.nazev && <p className="text-red-500 text-sm mt-1">{errors.nazev}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IČO *</label>
                <input
                  type="text"
                  value={formData.ico}
                  onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.ico ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="12345678"
                  maxLength={8}
                />
                {errors.ico && <p className="text-red-500 text-sm mt-1">{errors.ico}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DIČ *</label>
                <input
                  type="text"
                  value={formData.dic}
                  onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.dic ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="CZ12345678"
                />
                {errors.dic && <p className="text-red-500 text-sm mt-1">{errors.dic}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresa *</label>
              <textarea
                value={formData.adresa}
                onChange={(e) => setFormData({ ...formData, adresa: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.adresa ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Ulice 123, 123 00 Praha"
                rows={3}
              />
              {errors.adresa && <p className="text-red-500 text-sm mt-1">{errors.adresa}</p>}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Ukládám...' : 'Přidat firmu'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {firmy.map((firma) => (
          <div
            key={firma.id}
            className={`bg-white rounded-lg shadow p-6 border-2 ${
              activeFirma?.id === firma.id ? 'border-blue-600' : 'border-transparent'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{firma.nazev}</h3>
              {activeFirma?.id === firma.id && (
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                  Aktivní
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>IČO:</strong> {firma.ico}</p>
              <p><strong>DIČ:</strong> {firma.dic}</p>
              <p><strong>Adresa:</strong> {firma.adresa}</p>
            </div>

            <div className="mt-4 flex gap-2">
              {activeFirma?.id !== firma.id && (
                <button
                  onClick={() => setActiveFirma(firma.id)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Nastavit jako aktivní
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Opravdu smazat tuto firmu?')) {
                    deleteFirma(firma.id);
                  }
                }}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                Smazat
              </button>
            </div>
          </div>
        ))}
      </div>

      {firmy.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné firmy</h3>
          <p className="mt-1 text-sm text-gray-500">Začni přidáním první firmy.</p>
        </div>
      )}
    </div>
  );
}
