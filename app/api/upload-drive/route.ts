import { NextRequest, NextResponse } from 'next/server';
import { uploadToGoogleDrive } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, fileName, firmaNazev, year } = await request.json();

    if (!imageBase64 || !fileName || !firmaNazev || !year) {
      return NextResponse.json(
        { success: false, error: 'Chybí povinné parametry' },
        { status: 400 }
      );
    }

    const result = await uploadToGoogleDrive(imageBase64, fileName, firmaNazev, year);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
    });

  } catch (error: any) {
    console.error('Upload Drive API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Chyba při uploadu' },
      { status: 500 }
    );
  }
}
