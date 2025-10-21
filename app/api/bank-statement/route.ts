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
    console.error('❌ Bank Statement API Error:', error);

    // Detailní error handling
    let errorMessage = 'Neznámá chyba při zpracování výpisu';
    let errorDetails = error.message || 'Žádné detaily';
    let statusCode = 500;

    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      errorMessage = 'Neplatný Gemini API klíč';
      errorDetails = 'Zkontroluj GEMINI_API_KEY v .env.local';
      statusCode = 401;
    } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'Překročen denní limit Gemini API';
      errorDetails = 'Zkus to za chvíli nebo upgradni plán';
      statusCode = 429;
    } else if (error.message?.includes('PDF') || error.message?.includes('parse')) {
      errorMessage = 'Chyba při čtení PDF souboru';
      errorDetails = 'Zkontroluj že PDF není poškozený nebo chráněný heslem';
      statusCode = 400;
    } else if (error.message?.includes('JSON')) {
      errorMessage = 'Gemini AI vrátila nevalidní odpověď';
      errorDetails = 'AI model pravděpodobně nepochopil formát výpisu - zkus jiný výpis';
      statusCode = 502;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Chyba sítě';
      errorDetails = 'Zkontroluj připojení k internetu';
      statusCode = 503;
    } else {
      errorMessage = 'Chyba při zpracování bankovního výpisu';
      errorDetails = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}
