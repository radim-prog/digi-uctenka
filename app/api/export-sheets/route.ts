import { NextRequest, NextResponse } from 'next/server';
import { exportToGoogleSheets } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const { dokladData } = await request.json();

    if (!dokladData) {
      return NextResponse.json(
        { success: false, error: 'Chybí data dokladu' },
        { status: 400 }
      );
    }

    const result = await exportToGoogleSheets(dokladData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rowNumber: result.rowNumber,
    });

  } catch (error: any) {
    console.error('Export Sheets API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Chyba při exportu' },
      { status: 500 }
    );
  }
}
