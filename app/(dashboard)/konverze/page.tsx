'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import heic2any from 'heic2any';

interface UploadedFile {
  file: File;
  preview: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  pdfBlob?: Blob;
  error?: string;
}

export default function KonverzePage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Zpracování nahraných souborů
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);

    const processedFiles: UploadedFile[] = await Promise.all(
      uploadedFiles.map(async (file) => {
        // Vytvoř preview
        const preview = URL.createObjectURL(file);

        return {
          file,
          preview,
          status: 'pending' as const,
        };
      })
    );

    setFiles((prev) => [...prev, ...processedFiles]);
  };

  // Konverze obrázku na PDF pomocí jsPDF
  const convertImageToPDF = async (file: File): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Konverze HEIC na JPEG pokud je potřeba
        let processedFile = file;
        if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
          console.log(`🔄 Konvertuji HEIC na JPEG: ${file.name}`);
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          });
          processedFile = new File(
            [Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob],
            file.name.replace(/\.heic$/i, '.jpg'),
            { type: 'image/jpeg' }
          );
        }

        // Načti obrázek
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };

        img.onload = () => {
          try {
            // Vytvoř PDF s rozměry obrázku
            const pdf = new jsPDF({
              orientation: img.width > img.height ? 'landscape' : 'portrait',
              unit: 'mm',
              format: 'a4',
            });

            // Vypočítej rozměry pro A4
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgAspectRatio = img.width / img.height;
            const pageAspectRatio = pageWidth / pageHeight;

            let finalWidth = pageWidth;
            let finalHeight = pageHeight;

            if (imgAspectRatio > pageAspectRatio) {
              // Obrázek je širší než stránka
              finalHeight = pageWidth / imgAspectRatio;
            } else {
              // Obrázek je vyšší než stránka
              finalWidth = pageHeight * imgAspectRatio;
            }

            // Vystředění obrázku
            const x = (pageWidth - finalWidth) / 2;
            const y = (pageHeight - finalHeight) / 2;

            // Přidej obrázek do PDF
            pdf.addImage(img.src, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST');

            // Vrať PDF jako Blob
            const pdfBlob = pdf.output('blob');
            resolve(pdfBlob);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = (error) => {
          reject(new Error(`Chyba při načítání obrázku: ${error}`));
        };

        reader.readAsDataURL(processedFile);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Konverze všech souborů
  const handleConvertAll = async () => {
    setConverting(true);
    setProgress({ current: 0, total: files.length });

    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const fileData = updatedFiles[i];

      if (fileData.status === 'done') {
        // Přeskoč již zkonvertované soubory
        continue;
      }

      // Nastav status na "converting"
      fileData.status = 'converting';
      setFiles([...updatedFiles]);

      try {
        // Konverze
        const pdfBlob = await convertImageToPDF(fileData.file);

        // Úspěch
        fileData.status = 'done';
        fileData.pdfBlob = pdfBlob;
      } catch (error: any) {
        // Chyba
        fileData.status = 'error';
        fileData.error = error.message || 'Neznámá chyba';
        console.error(`❌ Chyba při konverzi ${fileData.file.name}:`, error);
      }

      // Update progress
      setProgress({ current: i + 1, total: files.length });
      setFiles([...updatedFiles]);
    }

    setConverting(false);
  };

  // Stažení ZIP archivu s PDF soubory
  const handleDownloadZIP = async () => {
    const zip = new JSZip();

    // Přidej všechny úspěšně zkonvertované PDF do ZIP
    files.forEach((fileData, index) => {
      if (fileData.status === 'done' && fileData.pdfBlob) {
        const fileName = fileData.file.name.replace(/\.(jpe?g|png|heic)$/i, '.pdf');
        zip.file(fileName, fileData.pdfBlob);
      }
    });

    // Generuj ZIP a stáhni
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `konverze-${new Date().toISOString().split('T')[0]}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Smazání souboru
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Smazání všech souborů
  const handleClearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setProgress({ current: 0, total: 0 });
  };

  const doneCount = files.filter((f) => f.status === 'done').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Hromadná konverze JPG → PDF</h1>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Nahrát obrázky</h2>
        <p className="text-gray-600 mb-4">
          Nahraj JPG, PNG nebo HEIC soubory (třeba 100+ fotek najednou). Konverze na PDF které umí Gemini přečíst.
        </p>

        <label className="block">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/heic"
            multiple
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </label>

        {files.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Nahráno: <strong>{files.length}</strong> souborů
            </p>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Smazat vše
            </button>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">2. Konvertovat na PDF</h2>

            {!converting && doneCount === 0 && (
              <button
                onClick={handleConvertAll}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                🔄 Konvertovat vše na PDF ({files.length} souborů)
              </button>
            )}

            {converting && (
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Konvertuji...</span>
                  <span className="font-semibold">
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {!converting && doneCount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-green-600 font-semibold">✅ {doneCount} úspěšně zkonvertováno</span>
                    {errorCount > 0 && (
                      <span className="ml-4 text-red-600 font-semibold">❌ {errorCount} chyb</span>
                    )}
                  </div>
                  {doneCount < files.length && (
                    <button
                      onClick={handleConvertAll}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      🔄 Konvertovat zbývající
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {doneCount > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">3. Stáhnout ZIP s PDF soubory</h2>
              <button
                onClick={handleDownloadZIP}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
              >
                📥 Stáhnout ZIP ({doneCount} PDF souborů)
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Seznam souborů</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((fileData, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 ${
                    fileData.status === 'done'
                      ? 'border-green-300 bg-green-50'
                      : fileData.status === 'error'
                      ? 'border-red-300 bg-red-50'
                      : fileData.status === 'converting'
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden">
                    <img
                      src={fileData.preview}
                      alt={fileData.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-600 truncate mb-1" title={fileData.file.name}>
                    {fileData.file.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {fileData.status === 'pending' && (
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Smazat
                      </button>
                    )}
                    {fileData.status === 'done' && (
                      <span className="text-xs text-green-600 font-semibold">✅ Hotovo</span>
                    )}
                    {fileData.status === 'converting' && (
                      <span className="text-xs text-blue-600 font-semibold">🔄 Konvertuji...</span>
                    )}
                    {fileData.status === 'error' && (
                      <span className="text-xs text-red-600 font-semibold" title={fileData.error}>
                        ❌ Chyba
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {files.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">
            Zatím žádné soubory. Nahraj obrázky pro konverzi na PDF.
          </p>
        </div>
      )}
    </div>
  );
}
