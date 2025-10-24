import { NextRequest, NextResponse } from 'next/server';
import { extractDokladData, retryMissingFields } from '@/lib/gemini-ocr';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// Rate limiting: Max OCR requestů per user per day
const MAX_OCR_PER_DAY = 50;
const RATE_LIMITING_ENABLED = false; // ❌ DOČASNĚ VYPNUTO - aktivovat až bude potřeba

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const usageDocId = `${userId}_${today}`;
  const usageRef = doc(db, 'api_usage', usageDocId);

  try {
    const usageDoc = await getDoc(usageRef);

    if (!usageDoc.exists()) {
      // První request dnes - vytvoř záznam
      await setDoc(usageRef, {
        userId,
        date: today,
        count: 1,
        createdAt: new Date(),
      });
      return { allowed: true, remaining: MAX_OCR_PER_DAY - 1, resetAt: `${today} 23:59:59` };
    }

    const currentCount = usageDoc.data().count || 0;

    if (currentCount >= MAX_OCR_PER_DAY) {
      return { allowed: false, remaining: 0, resetAt: `${today} 23:59:59` };
    }

    // Inkrement counter
    await updateDoc(usageRef, {
      count: increment(1),
    });

    return { allowed: true, remaining: MAX_OCR_PER_DAY - currentCount - 1, resetAt: `${today} 23:59:59` };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // V případě chyby povolit (fail-open)
    return { allowed: true, remaining: MAX_OCR_PER_DAY, resetAt: `${today} 23:59:59` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType, userId } = await request.json();

    console.log(`📥 OCR API: Přijat požadavek, mimeType: ${mimeType}, velikost: ${imageBase64.length} znaků`);

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Chybí obrázek nebo PDF' },
        { status: 400 }
      );
    }

    // RATE LIMITING - kontrola denního limitu (DOČASNĚ VYPNUTO)
    if (RATE_LIMITING_ENABLED && userId) {
      const rateLimit = await checkRateLimit(userId);

      if (!rateLimit.allowed) {
        console.warn(`⚠️ Rate limit exceeded for user ${userId}`);
        return NextResponse.json(
          {
            success: false,
            error: `Denní limit ${MAX_OCR_PER_DAY} OCR requestů vyčerpán. Reset: ${rateLimit.resetAt}`,
            rateLimitExceeded: true,
            resetAt: rateLimit.resetAt,
          },
          { status: 429 } // Too Many Requests
        );
      }

      console.log(`✅ Rate limit OK - zbývá ${rateLimit.remaining}/${MAX_OCR_PER_DAY} requestů`);
    }

    const extractedData = await extractDokladData(imageBase64, mimeType || 'image/jpeg');

    console.log(`✅ OCR API: Úspěšně extrahováno - ${extractedData.dodavatel_nazev}, částka: ${extractedData.celkova_castka}`);

    // Kontrola povinných polí a retry pokud chybí
    const missingFields: string[] = [];
    if (!extractedData.datum_vystaveni) missingFields.push('datum_vystaveni');
    if (!extractedData.datum_duzp) missingFields.push('datum_duzp');
    if (!extractedData.cislo_dokladu || extractedData.cislo_dokladu === 'N/A') missingFields.push('cislo_dokladu');
    if (!extractedData.dodavatel_ico || extractedData.dodavatel_ico === '') missingFields.push('dodavatel_ico');
    if (!extractedData.dodavatel_dic || extractedData.dodavatel_dic === '') missingFields.push('dodavatel_dic');

    if (missingFields.length > 0) {
      console.log(`🔄 OCR API: Chybějící pole detekováno - ${missingFields.join(', ')} - spouštím retry OCR`);

      try {
        const retryData = await retryMissingFields(imageBase64, mimeType || 'image/jpeg', missingFields);

        // Merge retry dat do původních dat (pouze pokud retry našlo hodnotu)
        Object.assign(extractedData, retryData);

        console.log(`✅ OCR API: Retry OCR úspěšný - doplněno: ${Object.keys(retryData).join(', ')}`);
      } catch (retryError: any) {
        console.warn(`⚠️ OCR API: Retry OCR selhal - ${retryError.message}`);
        // Pokračujeme s původními daty i když retry selhal
      }
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
    });

  } catch (error: any) {
    console.error('❌ OCR API Error:', error);

    // Detailní error handling s konkrétními zprávami
    let errorMessage = 'Neznámá chyba při OCR';
    let errorDetails = error.message || 'Žádné detaily';
    let statusCode = 500;

    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      errorMessage = 'Neplatný Gemini API klíč';
      errorDetails = 'Zkontroluj GEMINI_API_KEY v .env.local';
      statusCode = 401;
    } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'Překročen denní limit Gemini API';
      errorDetails = 'Zkus to za chvíli nebo upgradni Gemini plán';
      statusCode = 429;
    } else if (error.message?.includes('permission') || error.message?.includes('PERMISSION_DENIED')) {
      errorMessage = 'Firebase: Nedostatečná oprávnění';
      errorDetails = 'Zkontroluj Firebase Security Rules a přihlášení';
      statusCode = 403;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Chyba sítě - zkontroluj připojení k internetu';
      errorDetails = error.message;
      statusCode = 503;
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Časový limit vypršel - soubor je příliš velký';
      errorDetails = 'Zkus menší soubor nebo lepší kompresi';
      statusCode = 408;
    } else if (error.message?.includes('JSON')) {
      errorMessage = 'Gemini AI vrátila nevalidní odpověď';
      errorDetails = 'AI model pravděpodobně přetížen - zkus to znovu';
      statusCode = 502;
    } else {
      errorMessage = 'Chyba při OCR zpracování';
      errorDetails = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}
