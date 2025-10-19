import { NextRequest, NextResponse } from 'next/server';
import { extractBankStatementData } from '@/lib/bank-statement-ocr';

export async function POST(request: NextRequest) {
  try {
    const { pdfBase64 } = await request.json();

    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'PDF base64 je povinný' },
        { status: 400 }
      );
    }

    // Zpracuj PDF pomocí Gemini OCR
    const data = await extractBankStatementData(pdfBase64);

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error('Chyba při zpracování bankovního výpisu:', error);
    return NextResponse.json(
      { error: error.message || 'Chyba při zpracování' },
      { status: 500 }
    );
  }
}
