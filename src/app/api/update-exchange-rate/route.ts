import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Faltan variables de entorno para Supabase');
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Service Role Key no configurada. Agrega SUPABASE_SERVICE_ROLE_KEY a tu .env.local'
        },
        { status: 500 }
      );
    }

    // Verificar que sea una petición autorizada (puedes agregar autenticación aquí)
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.UPDATE_API_KEY;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('🔄 Actualizando tipo de cambio USD/CLP...');

    // 1. Obtener el tipo de cambio desde Frankfurter
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=CLP');
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.rates || !data.rates.CLP) {
      throw new Error('No se pudo obtener el tipo de cambio CLP');
    }
    
    const rate = data.rates.CLP;
    const now = new Date().toISOString();
    
    console.log(`📊 Tipo de cambio obtenido: 1 USD = ${rate} CLP`);

    // 2. Guardar o actualizar el valor en Supabase
    const { error } = await supabase
      .from('exchange_rates')
      .upsert([
        {
          base_currency: 'USD',
          target_currency: 'CLP',
          rate,
          fetched_at: now,
        }
      ], { 
        onConflict: 'base_currency,target_currency',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('❌ Error guardando en Supabase:', error);
      throw error;
    }

    console.log('✅ Dólar actualizado exitosamente en Supabase');

    return NextResponse.json({
      success: true,
      data: {
        rate,
        timestamp: now,
        source: 'frankfurter.app'
      },
      message: 'Tipo de cambio actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando dólar:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// También permitir GET para verificar el estado
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Service Role Key no configurada',
          instructions: 'Agrega SUPABASE_SERVICE_ROLE_KEY a tu .env.local'
        },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', 'USD')
      .eq('target_currency', 'CLP')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No hay datos disponibles',
          hint: 'Ejecuta POST /api/update-exchange-rate para poblar datos'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        rate: data.rate,
        timestamp: data.fetched_at,
        age_minutes: Math.floor((Date.now() - new Date(data.fetched_at).getTime()) / (1000 * 60))
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
} 