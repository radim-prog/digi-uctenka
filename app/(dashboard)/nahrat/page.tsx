'use client';

import { useFirmy } from '@/hooks/useFirmy';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { convertImageToPDF, fileToBase64 } from '@/lib/image-to-pdf';

interface FileProgress {
  file: File;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  progress: string;
  error?: string;
  preview?: string;
  dokladId?: string;
}

export default function NahratPage() {
  const { user } = useAuth();
  const { activeFirma } = useFirmy();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filesQueue, setFilesQueue] = useState<FileProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelRequested, setCancelRequested] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('Selected files:', files.length);
    if (files.length === 0) return;

    // Validace všech souborů
    const validFiles: FileProgress[] = [];

    for (const file of files) {
      const allowedTypes = ['image/', 'application/pdf'];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type) || file.type === 'application/pdf');

      if (!isValidType) {
        alert(`${file.name}: Musí být obrázek nebo PDF`);
        continue;
      }

      // Limit 20 MB (budeme konvertovat na PDF max 5 MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(`${file.name}: Soubor je příliš velký (max 20 MB)`);
        continue;
      }

      // Vytvoř náhled pro obrázky
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = await createPreview(file);
      } else {
        preview = 'PDF';
      }

      validFiles.push({
        file,
        status: 'waiting',
        progress: 'Čeká...',
        preview,
      });
    }

    if (validFiles.length === 0) {
      console.log('No valid files');
      return;
    }

    console.log('Valid files:', validFiles.length);
    setFilesQueue(validFiles);
    setCompletedCount(0);
    processQueue(validFiles);
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };


  const handleCancelProcessing = () => {
    setCancelRequested(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const processQueue = async (files: FileProgress[]) => {
    if (!activeFirma || !user) {
      console.error('Missing activeFirma or user');
      return;
    }

    console.log('Starting parallel queue processing:', files.length, 'files');
    setIsProcessing(true);
    setCancelRequested(false);
    abortControllerRef.current = new AbortController();

    // Zpracuj všechny soubory paralelně
    await Promise.all(
      files.map((_, index) => processFile(index, files))
    );

    setIsProcessing(false);
    setCancelRequested(false);
    abortControllerRef.current = null;
    console.log('Parallel queue processing complete');
  };

  const processFile = async (index: number, files: FileProgress[]) => {
    const fileProgress = files[index];
    if (!fileProgress) return;

    const { file } = fileProgress;

    try {
      // Kontrola zrušení
      if (cancelRequested) {
        updateFileProgress(index, { status: 'error', progress: 'Zrušeno', error: 'Zpracování zrušeno uživatelem' });
        return;
      }

      // Update status
      updateFileProgress(index, { status: 'processing', progress: 'Zahajuji...' });

      const isPDF = file.type === 'application/pdf';
      let processedFile = file;
      let base64ForOCR: string = '';
      let base64Original: string = '';

      // Zpracování podle typu souboru
      if (isPDF) {
        // PDF - pošli přímo na Gemini (podporuje až 25 MB)
        updateFileProgress(index, { progress: 'Připravuji PDF...' });

        base64ForOCR = await fileToBase64(file);
        base64Original = base64ForOCR;

        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        console.log(`📄 PDF (${fileSizeMB} MB) - posílám přímo na Gemini`);

        // Pro uložení použij originál PDF
        processedFile = file;
      } else {
        // Obrázky - komprimuj a pošli přímo (bez konverze na PDF)
        updateFileProgress(index, { progress: 'Komprimuji obrázek...' });

        try {
          // Komprese obrázku (cíl < 5 MB)
          let compressedFile = file;
          const fileSizeMB = file.size / 1024 / 1024;

          if (fileSizeMB > 5) {
            // Iterativní komprese do 5 MB
            const compression = await import('browser-image-compression');
            let quality = 0.8;
            let attempt = 0;
            const maxAttempts = 5;

            while (attempt < maxAttempts && compressedFile.size / 1024 / 1024 > 5) {
              attempt++;
              compressedFile = await compression.default(file, {
                maxSizeMB: 5,
                maxWidthOrHeight: 2048,
                useWebWorker: true,
                initialQuality: quality
              });
              quality = Math.max(0.5, quality - 0.15);
              console.log(`📊 Komprese pokus ${attempt}: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
            }
          }

          processedFile = compressedFile;

          // Pro OCR použij komprimovaný obrázek
          base64ForOCR = await fileToBase64(compressedFile);

          // Pro uložení také komprimovaný obrázek
          base64Original = base64ForOCR;

          const finalSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
          console.log(`✅ Obrázek zkomprimován: ${finalSizeMB} MB`);
        } catch (conversionError: any) {
          throw new Error(`Chyba při kompresi: ${conversionError.message}`);
        }
      }

      // Kontrola zrušení před voláním API
      if (cancelRequested) {
        updateFileProgress(index, { status: 'error', progress: 'Zrušeno', error: 'Zpracování zrušeno uživatelem' });
        return;
      }

      updateFileProgress(index, { progress: 'Analyzuji pomocí AI...' });

      // Detekce správného mimeType
      let finalMimeType = 'image/jpeg';
      if (isPDF) {
        finalMimeType = 'application/pdf';
      } else if (processedFile.type) {
        finalMimeType = processedFile.type;
      }

      const ocrResponse = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64ForOCR,
          mimeType: finalMimeType
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json();
        const detailedError = errorData.details
          ? `${errorData.error}\n${errorData.details}`
          : errorData.error || 'Chyba při OCR';
        throw new Error(detailedError);
      }

      const { data: extractedData } = await ocrResponse.json();

      // Kontrola zrušení po OCR
      if (cancelRequested) {
        updateFileProgress(index, { status: 'error', progress: 'Zrušeno', error: 'Zpracování zrušeno uživatelem' });
        return;
      }

      updateFileProgress(index, { progress: 'Ukládám soubor...' });

      // Sanitizuj cislo_dokladu a firmaNazev - odstraň nebezpečné znaky pro Storage path
      const safeCisloDokladu = extractedData.cislo_dokladu
        .replace(/[\/\\:*?"<>|]/g, '_')  // Nahraď nebezpečné znaky
        .substring(0, 50);  // Max 50 znaků

      const safeFirmaNazev = activeFirma!.nazev
        .replace(/[\/\\:*?"<>|]/g, '_')
        .replace(/\s+/g, '_')  // Nahraď mezery za _
        .replace(/\./g, '_');  // Nahraď tečky za _

      // Upload do Firebase Storage
      const fileName = `${extractedData.datum_vystaveni}_${safeCisloDokladu}.${isPDF ? 'pdf' : 'jpg'}`;
      const year = new Date(extractedData.datum_vystaveni).getFullYear().toString();
      const storagePath = `doklady/${safeFirmaNazev}/${year}/${fileName}`;

      let downloadURL = '';
      let pdfPreviewURL = '';

      try {
        // Convert base64 to Blob
        const base64Data = base64Original.split(',')[1] || base64Original;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: isPDF ? 'application/pdf' : 'image/jpeg' });

        // Upload originál to Storage
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, blob);
        downloadURL = await getDownloadURL(storageRef);

        console.log('✓ Originál nahrán do Firebase Storage:', downloadURL);

        // Pro JPG vytvoř PDF preview (pro lepší zobrazení)
        if (!isPDF) {
          updateFileProgress(index, { progress: 'Vytvářím PDF náhled...' });

          try {
            const pdfBlob = await convertImageToPDF(processedFile, 5);
            const pdfFileName = fileName.replace(/\.jpg$/i, '_preview.pdf');
            const pdfStoragePath = `doklady/${safeFirmaNazev}/${year}/${pdfFileName}`;
            const pdfStorageRef = ref(storage, pdfStoragePath);

            await uploadBytes(pdfStorageRef, pdfBlob);
            pdfPreviewURL = await getDownloadURL(pdfStorageRef);

            console.log('✓ PDF náhled vytvořen:', pdfPreviewURL);
          } catch (pdfError) {
            console.warn('⚠️ PDF náhled se nepodařilo vytvořit:', pdfError);
            // Pokračujeme bez PDF preview
          }
        }
      } catch (storageError: any) {
        console.error('Chyba při nahrávání do Storage:', storageError);
        // Pokračujeme i bez Storage
      }

      updateFileProgress(index, { progress: 'Ukládám do databáze...' });

      const dokladData = {
        ...extractedData,
        userId: user!.uid,
        firmaId: activeFirma!.id,
        odberatel_nazev: activeFirma!.nazev,
        odberatel_ico: activeFirma!.ico,
        odberatel_dic: activeFirma!.dic,
        odberatel_adresa: activeFirma!.adresa,
        originalImageUrl: downloadURL || '',
        pdfPreviewUrl: pdfPreviewURL || '', // PDF náhled pro JPG soubory
        storagePath: downloadURL ? storagePath : '',
        // NEUKLÁDÁME base64 do Firestore (limit 1 MB per field)
        // Soubor je uložen v Firebase Storage, odkaz je v originalImageUrl
        // Pro JPG soubory je k dispozici také PDF preview v pdfPreviewUrl
        imageMimeType: isPDF ? 'application/pdf' : 'image/jpeg',
        status: 'draft',
        exportedToSheets: false,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'doklady'), dokladData);

      updateFileProgress(index, {
        status: 'completed',
        progress: 'Hotovo!',
        dokladId: docRef.id
      });

      setCompletedCount(prev => prev + 1);

    } catch (err: any) {
      console.error('Chyba při zpracování:', err);

      // I když OCR selže, ulož soubor s prázdnými daty pro ruční zadání
      try {
        const base64Original = await fileToBase64(file);
        const now = new Date();
        const datumDnes = now.toISOString().split('T')[0];

        const emptyDokladData = {
          userId: user!.uid,
          firmaId: activeFirma!.id,
          odberatel_nazev: activeFirma!.nazev,
          odberatel_ico: activeFirma!.ico,
          odberatel_dic: activeFirma!.dic,
          odberatel_adresa: activeFirma!.adresa,
          dodavatel_nazev: '',
          dodavatel_ico: '',
          dodavatel_dic: '',
          cislo_dokladu: '',
          variabilni_symbol: '',
          datum_vystaveni: datumDnes,
          datum_duzp: datumDnes,
          celkova_castka: 0,
          mena: 'CZK',
          typ_dokladu: 'uctenka',
          // NEUKLÁDÁME base64 (přesahuje Firestore limit 1 MB)
          imageMimeType: file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg',
          originalImageUrl: '',
          driveFileId: '',
          status: 'draft',
          exportedToSheets: false,
          createdAt: serverTimestamp(),
          aiConfidence: 0,
        };

        const docRef = await addDoc(collection(db, 'doklady'), emptyDokladData);

        updateFileProgress(index, {
          status: 'error',
          progress: 'Chyba OCR - zadej ručně',
          error: err.message || 'Něco se pokazilo',
          dokladId: docRef.id
        });
      } catch (saveError) {
        updateFileProgress(index, {
          status: 'error',
          progress: 'Chyba',
          error: err.message || 'Něco se pokazilo'
        });
      }
    }
  };

  const updateFileProgress = (index: number, update: Partial<FileProgress>) => {
    setFilesQueue(prev => {
      const newQueue = [...prev];
      newQueue[index] = { ...newQueue[index], ...update };
      return newQueue;
    });
  };

  const resetUpload = () => {
    setFilesQueue([]);
    setCompletedCount(0);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!activeFirma) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Nemáš vybranou firmu</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Před nahráním dokladu musíš mít vybranou firmu (odběratele).</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/firmy')}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                >
                  Přejít na firmy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nahrát doklady</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Zpracováváš doklady pro:</strong> {activeFirma.nazev} (IČO: {activeFirma.ico})
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        {filesQueue.length === 0 ? (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="text-6xl mb-4">📁</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Vybrat soubory</h3>
              <p className="mt-2 text-gray-600">Klikni pro výběr jednoho nebo více souborů</p>
              <p className="mt-1 text-sm text-gray-500">JPG, PNG (auto komprese), PDF (max 25MB)</p>
              <p className="mt-2 text-sm font-semibold text-blue-600">💡 Můžeš nahrát více souborů najednou!</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress overview */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Zpracovávání souborů</h3>
                  <p className="text-sm text-gray-600">
                    {completedCount} z {filesQueue.length} dokončeno
                  </p>
                </div>
                <div className="text-right">
                  {isProcessing && !cancelRequested && (
                    <button
                      onClick={handleCancelProcessing}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      ⏹ Zastavit
                    </button>
                  )}
                  {isProcessing && cancelRequested && (
                    <span className="text-sm text-red-600 font-semibold">Zastavuji...</span>
                  )}
                  {!isProcessing && completedCount === filesQueue.length && (
                    <button
                      onClick={resetUpload}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-2"
                    >
                      Nahrát další
                    </button>
                  )}
                  {!isProcessing && completedCount === filesQueue.length && (
                    <button
                      onClick={() => router.push('/')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Zobrazit doklady
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${(completedCount / filesQueue.length) * 100}%` }}
                />
              </div>
            </div>

            {/* File list */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filesQueue.map((fileProgress, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-all ${
                    fileProgress.status === 'completed' ? 'bg-green-50 border-green-300' :
                    fileProgress.status === 'error' ? 'bg-red-50 border-red-300' :
                    fileProgress.status === 'processing' ? 'bg-blue-50 border-blue-300' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {fileProgress.preview === 'PDF' ? (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-2xl">📄</span>
                        </div>
                      ) : fileProgress.preview ? (
                        <img
                          src={fileProgress.preview}
                          alt={fileProgress.file.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {fileProgress.file.name}
                        </p>
                        {fileProgress.status === 'completed' && <span className="text-green-600">✓</span>}
                        {fileProgress.status === 'error' && <span className="text-red-600">✗</span>}
                        {fileProgress.status === 'processing' && (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {(fileProgress.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className={`text-sm font-medium ${
                        fileProgress.status === 'error' ? 'text-red-600' :
                        fileProgress.status === 'completed' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {fileProgress.progress}
                      </p>
                      {fileProgress.error && (
                        <p className="text-xs text-red-600 mt-1">{fileProgress.error}</p>
                      )}
                    </div>

                    {/* Action */}
                    {fileProgress.dokladId && (
                      <button
                        onClick={() => router.push(`/overit/${fileProgress.dokladId}`)}
                        className={`px-3 py-1 text-sm rounded ${
                          fileProgress.status === 'completed'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        {fileProgress.status === 'completed' ? 'Ověřit' : 'Zadat ručně'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Tipy pro nejlepší výsledky:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Můžeš nahrát více souborů najednou (Ctrl+klik nebo Cmd+klik)</li>
          <li>✓ Soubory se zpracují automaticky jeden po druhém</li>
          <li>✓ Vyfotit celý doklad (všechny okraje viditelné)</li>
          <li>✓ Dobrého osvětlení bez stínů</li>
          <li>✓ Text jasně čitelný</li>
          <li>✓ PDF i obrázky až 25 MB (obrázky se automaticky komprimují)</li>
        </ul>
      </div>
    </div>
  );
}
