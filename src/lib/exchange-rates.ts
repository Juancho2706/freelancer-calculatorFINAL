import { supabase } from './supabase-config';

export interface ExchangeRate {
  id: number;
  base_currency: string;
  target_currency: string;
  rate: number;
  fetched_at: string;
}

export interface ExchangeRateResponse {
  success: boolean;
  data?: ExchangeRate;
  error?: string;
  isStale?: boolean;
}

/**
 * Obtiene el tipo de cambio USD/CLP desde Supabase
 * @param maxAgeMinutes - Edad máxima en minutos para considerar el dato válido (por defecto 60 minutos)
 */
export async function getExchangeRate(maxAgeMinutes: number = 60): Promise<ExchangeRateResponse> {
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', 'USD')
      .eq('target_currency', 'CLP')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error obteniendo tipo de cambio desde Supabase:', error);
      return {
        success: false,
        error: 'No se pudo obtener el tipo de cambio desde la base de datos'
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No hay datos de tipo de cambio disponibles'
      };
    }

    // Verificar si el dato es muy antiguo
    const fetchedAt = new Date(data.fetched_at);
    const now = new Date();
    const ageInMinutes = (now.getTime() - fetchedAt.getTime()) / (1000 * 60);
    
    const isStale = ageInMinutes > maxAgeMinutes;

    return {
      success: true,
      data,
      isStale
    };

  } catch (error) {
    console.error('Error en getExchangeRate:', error);
    return {
      success: false,
      error: 'Error interno al obtener tipo de cambio'
    };
  }
}

/**
 * Obtiene el historial de tipos de cambio de los últimos días
 * @param days - Número de días de historial a obtener (por defecto 7)
 */
export async function getExchangeRateHistory(days: number = 7): Promise<{
  success: boolean;
  data?: ExchangeRate[];
  error?: string;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', 'USD')
      .eq('target_currency', 'CLP')
      .gte('fetched_at', cutoffDate.toISOString())
      .order('fetched_at', { ascending: true });

    if (error) {
      console.error('Error obteniendo historial de tipo de cambio:', error);
      return {
        success: false,
        error: 'No se pudo obtener el historial de tipos de cambio'
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Error en getExchangeRateHistory:', error);
    return {
      success: false,
      error: 'Error interno al obtener historial'
    };
  }
}

/**
 * Verifica si el tipo de cambio necesita actualización
 * @param maxAgeMinutes - Edad máxima en minutos (por defecto 60)
 */
export async function needsUpdate(maxAgeMinutes: number = 60): Promise<boolean> {
  const result = await getExchangeRate(maxAgeMinutes);
  return !result.success || result.isStale || false;
}

/**
 * Obtiene el tipo de cambio con fallback a valor por defecto
 */
export async function getExchangeRateWithFallback(): Promise<{
  rate: number;
  source: 'supabase' | 'fallback';
  timestamp: string;
  isStale: boolean;
}> {
  const result = await getExchangeRate();
  
  if (result.success && result.data) {
    return {
      rate: result.data.rate,
      source: 'supabase',
      timestamp: result.data.fetched_at,
      isStale: result.isStale || false
    };
  }

  // Fallback a valor por defecto
  console.warn('Usando valor por defecto para tipo de cambio USD/CLP');
  return {
    rate: 950, // Valor por defecto
    source: 'fallback',
    timestamp: new Date().toISOString(),
    isStale: true
  };
} 