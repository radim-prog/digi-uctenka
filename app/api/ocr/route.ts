import { NextRequest, NextResponse } from 'next/server';
import { extractDokladData } from '@/lib/gemini-ocr';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Chybí obrázek nebo PDF' },
        { status: 400 }
      );
    }

    const extractedData = await extractDokladData(imageBase64, mimeType || 'image/jpeg');

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
