import { NextRequest, NextResponse } from 'next/server';
import { generatePredkontace } from '@/lib/predkontace-ai';

export async function POST(request: NextRequest) {
  try {
    const { doklady } = await request.json();

    if (!doklady || !Array.isArray(doklady)) {
      return NextResponse.json(
        { success: false, error: 'Chybí pole dokladů' },
        { status: 400 }
      );
    }

    console.log(`Zpracovávám ${doklady.length} dokladů hromadně...`);

    // Zpracuj všechny doklady paralelně
    const results = await Promise.allSettled(
      doklady.map(async (doklad) => {
        try {
          const predkontace = await generatePredkontace(doklad);
          return {
            id: doklad.id,
            success: true,
            predkontace,
          };
        } catch (error: any) {
          console.error(`Chyba u dokladu ${doklad.id}:`, error);
          return {
            id: doklad.id,
            success: false,
            error: error.message,
          };
        }
      })
    );

    // Extrahuj výsledky
    const processed = results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: 'unknown',
          success: false,
          error: result.reason?.message || 'Neznámá chyba',
        };
      }
    });

    const successCount = processed.filter(r => r.success).length;
    const failCount = processed.length - successCount;

    console.log(`Hotovo: ${successCount} úspěšných, ${failCount} selhalo`);

    return NextResponse.json({
      success: true,
      data: processed,
      summary: {
        total: doklady.length,
        success: successCount,
        failed: failCount,
      },
    });

  } catch (error: any) {
    console.error('Batch Predkontace API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Chyba při hromadném generování předkontace' },
      { status: 500 }
    );
  }
}
