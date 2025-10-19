import { NextRequest, NextResponse } from 'next/server';
import { extractDokladData } from '@/lib/gemini-ocr';
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

    return NextResponse.json({
      success: true,
      data: extractedData,
    });

  } catch (error: any) {
    console.error('OCR API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Chyba při OCR' },
      { status: 500 }
    );
  }
}
