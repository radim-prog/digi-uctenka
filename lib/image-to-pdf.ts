import jsPDF from 'jspdf';

/**
 * Konvertuje obrázek (JPG/PNG/HEIC) na PDF s cílovým limitem 5 MB
 *
 * @param imageFile - Originální obrázek
 * @param maxSizeMB - Maximální velikost PDF v MB (default 5)
 * @returns Promise<Blob> - PDF blob
 */
export async function convertImageToPDF(
  imageFile: File,
  maxSizeMB: number = 5
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Chyba při čtení souboru'));

    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const img = new Image();

        img.onerror = () => reject(new Error('Chyba při načítání obrázku'));

        img.onload = async () => {
          console.log(`📄 Orig. rozměry: ${img.width}x${img.height}px`);

          let quality = 0.85; // Začínáme s vyšší kvalitou
          let attempt = 0;
          const maxAttempts = 5;
          let pdfBlob: Blob | null = null;

          while (attempt < maxAttempts) {
            attempt++;

            // Vypočítej rozměry pro PDF (zachovej poměr stran)
            const orientation = img.width > img.height ? 'landscape' : 'portrait';

            // A4 rozměry v px (pro kvalitní zobrazení)
            const maxWidth = 1654; // A4 při 200 DPI
            const maxHeight = 2339;

            let pdfWidth = img.width;
            let pdfHeight = img.height;

            // Zmenši pokud je příliš velký
            if (pdfWidth > maxWidth) {
              const ratio = maxWidth / pdfWidth;
              pdfWidth = maxWidth;
              pdfHeight = pdfHeight * ratio;
            }
            if (pdfHeight > maxHeight) {
              const ratio = maxHeight / pdfHeight;
              pdfHeight = maxHeight;
              pdfWidth = pdfWidth * ratio;
            }

            // Vytvoř PDF
            const pdf = new jsPDF({
              orientation,
              unit: 'px',
              format: [pdfWidth, pdfHeight],
              compress: true, // Enable PDF compression
            });

            // Přidej obrázek s danou kvalitou
            pdf.addImage(
              dataUrl,
              imageFile.type === 'image/png' ? 'PNG' : 'JPEG',
              0,
              0,
              pdfWidth,
              pdfHeight,
              undefined,
              'FAST' // Rychlá komprese
            );

            pdfBlob = pdf.output('blob');
            const pdfSizeMB = pdfBlob.size / 1024 / 1024;

            console.log(
              `📄 PDF pokus ${attempt}: ${pdfSizeMB.toFixed(2)} MB (kvalita: ${quality.toFixed(2)}, rozměry: ${Math.round(pdfWidth)}x${Math.round(pdfHeight)})`
            );

            if (pdfSizeMB <= maxSizeMB) {
              console.log(`✅ PDF úspěšně vytvořeno: ${pdfSizeMB.toFixed(2)} MB`);
              resolve(pdfBlob);
              return;
            }

            // Příliš velké - zmenši rozměry a/nebo sniž kvalitu
            quality = Math.max(0.5, quality - 0.15);
            pdfWidth = Math.round(pdfWidth * 0.85);
            pdfHeight = Math.round(pdfHeight * 0.85);
          }

          // Po max pokusech vrať poslední verzi (i když je větší)
          if (pdfBlob) {
            const finalSize = pdfBlob.size / 1024 / 1024;
            console.warn(
              `⚠️ PDF je stále příliš velké (${finalSize.toFixed(2)} MB), ale vracím ho po ${maxAttempts} pokusech`
            );
            resolve(pdfBlob);
          } else {
            reject(new Error('Nepodařilo se vytvořit PDF'));
          }
        };

        img.src = dataUrl;
      } catch (error: any) {
        reject(new Error(`Chyba při konverzi na PDF: ${error.message}`));
      }
    };

    reader.readAsDataURL(imageFile);
  });
}

/**
 * Převede File nebo Blob na base64 string
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Odstraň data:image/...;base64, prefix
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru'));
    reader.readAsDataURL(file);
  });
}
