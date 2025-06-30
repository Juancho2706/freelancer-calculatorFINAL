import { NextRequest, NextResponse } from 'next/server';
import { obtenerTipoCambio, obtenerImpuestos, obtenerTarifasMercado } from '@/lib/apis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');

    switch (tipo) {
      case 'tipo_cambio':
        const tipoCambio = await obtenerTipoCambio();
        return NextResponse.json(tipoCambio);

      case 'impuestos':
        const impuestos = await obtenerImpuestos();
        return NextResponse.json(impuestos);

      case 'tarifas':
        const tarifas = await obtenerTarifasMercado();
        return NextResponse.json(tarifas);

      case 'todos':
        const [tipoCambioData, impuestosData, tarifasData] = await Promise.all([
          obtenerTipoCambio(),
          obtenerImpuestos(),
          obtenerTarifasMercado(),
        ]);

        return NextResponse.json({
          tipo_cambio: tipoCambioData,
          impuestos: impuestosData,
          tarifas: tarifasData,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Tipo de datos no especificado. Usa: tipo_cambio, impuestos, tarifas, o todos' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en API de datos externos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 