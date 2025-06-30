import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const historico = searchParams.get('historico');
    const dias = searchParams.get('dias');

    if (historico === 'true') {
      // Obtener historial de tipos de cambio
      const diasHistorial = dias ? parseInt(dias) : 30;
      const historial = await obtenerTipoCambioHistoricoFrankfurter(diasHistorial);
      
      return NextResponse.json({
        historico: true,
        datos: historial,
        dias: diasHistorial,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Obtener tipo de cambio actual
      const tipoCambio = await obtenerTipoCambioDolarFrankfurter();
      
      if (!tipoCambio) {
        return NextResponse.json(
          { error: 'No se pudo obtener el tipo de cambio desde Frankfurter' },
          { status: 503 }
        );
      }

      return NextResponse.json({
        historico: false,
        datos: tipoCambio,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error en API de tipo de cambio dólar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Obtiene específicamente el tipo de cambio USD/CLP desde Frankfurter
 */
async function obtenerTipoCambioDolarFrankfurter(): Promise<{
  clp_usd: number;
  usd_clp: number;
  fecha: string;
  fuente: string;
} | null> {
  try {
    // Obtener USD a CLP directamente desde Frankfurter
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=CLP');
    if (!response.ok) return null;
    
    const data = await response.json();
    const rates = data.rates;
    const baseDate = data.date;
    
    if (!rates || !rates.CLP) return null;
    
    const clp_usd = rates.CLP;
    const usd_clp = 1 / clp_usd;
    
    return {
      clp_usd,
      usd_clp,
      fecha: new Date(baseDate).toISOString(),
      fuente: 'frankfurter.app'
    };
  } catch (error) {
    console.warn('Error obteniendo tipo de cambio USD desde Frankfurter:', error);
    return null;
  }
}

/**
 * Obtiene tipos de cambio históricos desde Frankfurter
 */
async function obtenerTipoCambioHistoricoFrankfurter(dias: number = 30): Promise<{
  fecha: string;
  clp_usd: number;
}[]> {
  try {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    const fechaFinStr = fechaFin.toISOString().split('T')[0];
    
    const response = await fetch(
      `https://api.frankfurter.app/${fechaInicioStr}..${fechaFinStr}?from=USD&to=CLP`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const rates = data.rates;
    
    if (!rates) return [];
    
    return Object.entries(rates).map(([fecha, rateData]: [string, any]) => ({
      fecha,
      clp_usd: rateData.CLP || 0,
    })).filter(item => item.clp_usd > 0);
  } catch (error) {
    console.warn('Error obteniendo historial de tipos de cambio desde Frankfurter:', error);
    return [];
  }
} 