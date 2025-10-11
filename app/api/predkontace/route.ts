import { NextRequest, NextResponse } from 'next/server';
import { generatePredkontace } from '@/lib/predkontace-ai';

export async function POST(request: NextRequest) {
  try {
    const doklad = await request.json();

    if (!doklad) {
      return NextResponse.json(
        { success: false, error: 'Chybí data dokladu' },
        { status: 400 }
      );
    }

    const predkontace = await generatePredkontace(doklad);

    return NextResponse.json({
      success: true,
      data: predkontace,
    });

  } catch (error: any) {
    console.error('Predkontace API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Chyba při generování předkontace' },
      { status: 500 }
    );
  }
}
