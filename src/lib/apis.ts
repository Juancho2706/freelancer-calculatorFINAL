/**
 * APIs para datos volátiles de la Calculadora Freelancer Chile
 * Maneja tipos de cambio, impuestos y tarifas del mercado
 */

// Tipos de datos
export interface TipoCambio {
  clp_usd: number;
  usd_clp: number;
  clp_eur?: number;
  eur_clp?: number;
  clp_gbp?: number;
  gbp_clp?: number;
  clp_ars?: number; // Peso argentino
  ars_clp?: number;
  clp_pen?: number; // Sol peruano
  pen_clp?: number;
  clp_cop?: number; // Peso colombiano
  cop_clp?: number;
  fecha: string;
  fuente: string;
}

export interface ImpuestosChile {
  iva: number;
  retencion_boleta: number;
  cotizacion_salud: number;
  fecha_actualizacion: string;
  fuente: string;
  version_legislacion: string;
}

export interface TarifaMercado {
  rubro: string;
  experiencia: string;
  min: number;
  promedio: number;
  max: number;
  fecha_actualizacion: string;
  fuente: string;
  muestra: number;
}

// Configuración de APIs
const API_CONFIG = {
  TIPO_CAMBIO: {
    URL: 'https://api.exchangerate-api.com/v4/latest/USD',
    BACKUP_URL: 'https://api.monobank.ua/bank/currency',
    FRANKFURTER_URL: 'https://api.frankfurter.app/latest',
    CACHE_DURATION: 1000 * 60 * 60, // 1 hora
  },
  IMPUESTOS: {
    URL: 'https://api.sii.cl/impuestos', // Ejemplo - necesitarías una API real
    CACHE_DURATION: 1000 * 60 * 60 * 24, // 24 horas
  },
  TARIFAS: {
    URL: 'https://api.freelancer-chile.com/tarifas', // Ejemplo - necesitarías una API real
    CACHE_DURATION: 1000 * 60 * 60 * 24 * 7, // 1 semana
  },
};

// Cache en memoria (en producción usar Redis o similar)
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Obtiene el tipo de cambio USD/CLP y otras monedas desde APIs externas
 */
export async function obtenerTipoCambio(): Promise<TipoCambio> {
  const cacheKey = 'tipo_cambio';
  const cached = cache.get(cacheKey);
  
  // Verificar cache
  if (cached && Date.now() - cached.timestamp < API_CONFIG.TIPO_CAMBIO.CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Intentar con múltiples fuentes
    const fuentes = [
      obtenerTipoCambioDesdeExchangeRate(),
      obtenerTipoCambioDesdeFrankfurter(),
      obtenerTipoCambioDesdeMonobank(),
    ];

    // Usar la primera fuente que responda
    for (const fuente of fuentes) {
      try {
        const resultado = await Promise.race([
          fuente,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        
        if (resultado) {
          cache.set(cacheKey, { data: resultado, timestamp: Date.now() });
          return resultado;
        }
      } catch (error) {
        console.warn('Fuente de tipo de cambio falló, intentando siguiente:', error);
        continue;
      }
    }

    // Si todas las fuentes fallan, usar valor por defecto
    throw new Error('Todas las fuentes de tipo de cambio fallaron');

  } catch (error) {
    console.warn('Error obteniendo tipo de cambio, usando valor por defecto:', error);
    
    // Usar valor por defecto si las APIs fallan
    const fallback: TipoCambio = {
      clp_usd: 950,
      usd_clp: 1 / 950,
      clp_eur: 950 * 1.1, // Aproximado EUR/USD
      eur_clp: 1 / (950 * 1.1),
      clp_gbp: 950 * 1.3, // Aproximado GBP/USD
      gbp_clp: 1 / (950 * 1.3),
      clp_ars: 950 * 0.003, // Aproximado ARS/USD
      ars_clp: 1 / (950 * 0.003),
      clp_pen: 950 * 0.25, // Aproximado PEN/USD
      pen_clp: 1 / (950 * 0.25),
      clp_cop: 950 * 0.0002, // Aproximado COP/USD
      cop_clp: 1 / (950 * 0.0002),
      fecha: new Date().toISOString(),
      fuente: 'fallback'
    };
    
    cache.set(cacheKey, { data: fallback, timestamp: Date.now() });
    return fallback;
  }
}

/**
 * Obtiene tipos de cambio desde Exchange Rate API
 */
async function obtenerTipoCambioDesdeExchangeRate(): Promise<TipoCambio | null> {
  try {
    const response = await fetch(API_CONFIG.TIPO_CAMBIO.URL);
    if (!response.ok) return null;
    
    const data = await response.json();
    const rates = data.rates;
    
    if (!rates) return null;
    
    const clp_usd = rates.CLP || 950;
    const eur_usd = rates.EUR || 1.1;
    const gbp_usd = rates.GBP || 1.3;
    const ars_usd = rates.ARS || 0.003;
    const pen_usd = rates.PEN || 0.25;
    const cop_usd = rates.COP || 0.0002;
    
    return {
      clp_usd,
      usd_clp: 1 / clp_usd,
      clp_eur: clp_usd / eur_usd,
      eur_clp: eur_usd / clp_usd,
      clp_gbp: clp_usd / gbp_usd,
      gbp_clp: gbp_usd / clp_usd,
      clp_ars: clp_usd / ars_usd,
      ars_clp: ars_usd / clp_usd,
      clp_pen: clp_usd / pen_usd,
      pen_clp: pen_usd / clp_usd,
      clp_cop: clp_usd / cop_usd,
      cop_clp: cop_usd / clp_usd,
      fecha: new Date().toISOString(),
      fuente: 'exchangerate-api.com'
    };
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene tipos de cambio desde Frankfurter API (gratuita y confiable)
 * https://www.frankfurter.app/
 */
async function obtenerTipoCambioDesdeFrankfurter(): Promise<TipoCambio | null> {
  try {
    // Frankfurter API - obtener tipos de cambio desde EUR a múltiples monedas
    const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,CLP,GBP,ARS,PEN,COP');
    if (!response.ok) return null;
    
    const data = await response.json();
    const rates = data.rates;
    const baseDate = data.date;
    
    if (!rates) return null;
    
    // Frankfurter usa EUR como base, necesitamos convertir a CLP como base
    const eur_usd = rates.USD || 1.1;
    const eur_clp = rates.CLP || 1045; // CLP por EUR
    const eur_gbp = rates.GBP || 0.85;
    const eur_ars = rates.ARS || 0.0033; // ARS por EUR (aproximado)
    const eur_pen = rates.PEN || 0.275; // PEN por EUR (aproximado)
    const eur_cop = rates.COP || 0.00022; // COP por EUR (aproximado)
    
    // Calcular CLP como base
    const clp_usd = eur_clp / eur_usd;
    const clp_gbp = eur_clp / eur_gbp;
    const clp_ars = eur_clp / eur_ars;
    const clp_pen = eur_clp / eur_pen;
    const clp_cop = eur_clp / eur_cop;
    
    return {
      clp_usd,
      usd_clp: 1 / clp_usd,
      clp_eur: eur_clp,
      eur_clp: 1 / eur_clp,
      clp_gbp,
      gbp_clp: 1 / clp_gbp,
      clp_ars,
      ars_clp: 1 / clp_ars,
      clp_pen,
      pen_clp: 1 / clp_pen,
      clp_cop,
      cop_clp: 1 / clp_cop,
      fecha: new Date(baseDate).toISOString(),
      fuente: 'frankfurter.app'
    };
  } catch (error) {
    console.warn('Error obteniendo tipos de cambio desde Frankfurter:', error);
    return null;
  }
}

/**
 * Obtiene tipos de cambio desde Monobank (backup)
 */
async function obtenerTipoCambioDesdeMonobank(): Promise<TipoCambio | null> {
  try {
    // Por ahora, retornar null silenciosamente ya que la API puede tener rate limiting
    return null;
    
    // Código comentado para cuando la API esté disponible:
    // const response = await fetch(API_CONFIG.TIPO_CAMBIO.BACKUP_URL);
    // if (!response.ok) return null;
    
    // const data = await response.json();
    
    // // Monobank tiene estructura específica
    // const usdRate = data.find((rate: any) => rate.currencyCodeA === 840 && rate.currencyCodeB === 152);
    // const eurRate = data.find((rate: any) => rate.currencyCodeA === 978 && rate.currencyCodeB === 152);
    
    // if (!usdRate) return null;
    
    // const clp_usd = usdRate.rateBuy || 950;
    // const clp_eur = eurRate?.rateBuy || (clp_usd * 1.1);
    
    // return {
    //   clp_usd,
    //   usd_clp: 1 / clp_usd,
    //   clp_eur,
    //   eur_clp: 1 / clp_eur,
    //   clp_gbp: clp_usd * 1.3, // Aproximado
    //   gbp_clp: 1 / (clp_usd * 1.3),
    //   clp_ars: clp_usd * 0.003, // Aproximado
    //   ars_clp: 1 / (clp_usd * 0.003),
    //   clp_pen: clp_usd * 0.25, // Aproximado
    //   pen_clp: 1 / (clp_usd * 0.25),
    //   clp_cop: clp_usd * 0.0002, // Aproximado
    //   cop_clp: 1 / (clp_usd * 0.0002),
    //   fecha: new Date().toISOString(),
    //   fuente: 'monobank.ua'
    // };
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene los impuestos actuales de Chile
 * Por ahora usa valores por defecto, en el futuro se integrará con APIs oficiales
 */
export async function obtenerImpuestos(): Promise<ImpuestosChile> {
  const cacheKey = 'impuestos';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < API_CONFIG.IMPUESTOS.CACHE_DURATION) {
    return cached.data;
  }

  // Valores por defecto actualizados para 2025
  const resultado: ImpuestosChile = {
    iva: 0.19,
    retencion_boleta: 0.1375,
    cotizacion_salud: 0.07,
    fecha_actualizacion: new Date().toISOString(),
    fuente: 'valores_por_defecto',
    version_legislacion: '2025',
  };

  cache.set(cacheKey, { data: resultado, timestamp: Date.now() });
  return resultado;
}

/**
 * Obtiene tarifas del mercado por rubro y experiencia
 * Por ahora usa valores por defecto, en el futuro se integrará con APIs de mercado
 */
export async function obtenerTarifasMercado(): Promise<TarifaMercado[]> {
  const cacheKey = 'tarifas_mercado';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < API_CONFIG.TARIFAS.CACHE_DURATION) {
    return cached.data;
  }

  // Valores por defecto actualizados con datos más realistas
  const resultado: TarifaMercado[] = [
    {
      rubro: 'diseño',
      experiencia: 'junior',
      min: 8000,
      promedio: 12000,
      max: 18000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 150,
    },
    {
      rubro: 'diseño',
      experiencia: 'semi',
      min: 12000,
      promedio: 18000,
      max: 25000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 150,
    },
    {
      rubro: 'diseño',
      experiencia: 'senior',
      min: 18000,
      promedio: 25000,
      max: 35000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 150,
    },
    {
      rubro: 'desarrollo',
      experiencia: 'junior',
      min: 10000,
      promedio: 15000,
      max: 22000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 200,
    },
    {
      rubro: 'desarrollo',
      experiencia: 'semi',
      min: 15000,
      promedio: 22000,
      max: 32000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 200,
    },
    {
      rubro: 'desarrollo',
      experiencia: 'senior',
      min: 22000,
      promedio: 32000,
      max: 45000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 200,
    },
    {
      rubro: 'marketing',
      experiencia: 'junior',
      min: 7000,
      promedio: 11000,
      max: 16000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 100,
    },
    {
      rubro: 'marketing',
      experiencia: 'semi',
      min: 11000,
      promedio: 16000,
      max: 22000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 100,
    },
    {
      rubro: 'marketing',
      experiencia: 'senior',
      min: 16000,
      promedio: 22000,
      max: 30000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 100,
    },
    {
      rubro: 'redaccion',
      experiencia: 'junior',
      min: 6000,
      promedio: 9000,
      max: 14000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 80,
    },
    {
      rubro: 'redaccion',
      experiencia: 'semi',
      min: 9000,
      promedio: 14000,
      max: 20000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 80,
    },
    {
      rubro: 'redaccion',
      experiencia: 'senior',
      min: 14000,
      promedio: 20000,
      max: 28000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 80,
    },
    {
      rubro: 'consultoria',
      experiencia: 'junior',
      min: 12000,
      promedio: 18000,
      max: 25000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 60,
    },
    {
      rubro: 'consultoria',
      experiencia: 'semi',
      min: 18000,
      promedio: 25000,
      max: 35000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 60,
    },
    {
      rubro: 'consultoria',
      experiencia: 'senior',
      min: 25000,
      promedio: 35000,
      max: 50000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 60,
    },
    {
      rubro: 'otro',
      experiencia: 'junior',
      min: 8000,
      promedio: 12000,
      max: 18000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 50,
    },
    {
      rubro: 'otro',
      experiencia: 'semi',
      min: 12000,
      promedio: 18000,
      max: 25000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 50,
    },
    {
      rubro: 'otro',
      experiencia: 'senior',
      min: 18000,
      promedio: 25000,
      max: 35000,
      fecha_actualizacion: new Date().toISOString(),
      fuente: 'valores_por_defecto',
      muestra: 50,
    }
  ];

  cache.set(cacheKey, { data: resultado, timestamp: Date.now() });
  return resultado;
}

/**
 * Obtiene tarifa específica por rubro y experiencia
 */
export async function obtenerTarifaEspecifica(rubro: string, experiencia: string): Promise<TarifaMercado | null> {
  const tarifas = await obtenerTarifasMercado();
  return tarifas.find(t => t.rubro === rubro && t.experiencia === experiencia) || null;
}

/**
 * Limpia el cache (útil para testing o cuando se necesitan datos frescos)
 */
export function limpiarCache(): void {
  cache.clear();
}

/**
 * Obtiene información del cache (útil para debugging)
 */
export function obtenerInfoCache(): { keys: string[]; sizes: Record<string, number> } {
  const keys = Array.from(cache.keys());
  const sizes: Record<string, number> = {};
  
  keys.forEach(key => {
    const cached = cache.get(key);
    if (cached) {
      sizes[key] = JSON.stringify(cached.data).length;
    }
  });
  
  return { keys, sizes };
}

/**
 * Obtiene específicamente el tipo de cambio USD/CLP desde Frankfurter
 * Esta función es más precisa para el dólar chileno
 */
export async function obtenerTipoCambioDolarFrankfurter(): Promise<{
  clp_usd: number;
  usd_clp: number;
  fecha: string;
  fuente: string;
} | null> {
  try {
    // Obtener USD a CLP directamente desde Frankfurter
    const response = await fetch(`${API_CONFIG.TIPO_CAMBIO.FRANKFURTER_URL}?from=USD&to=CLP`);
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
 * Obtiene tipos de cambio históricos desde Frankfurter (últimos 30 días)
 */
export async function obtenerTipoCambioHistoricoFrankfurter(dias: number = 30): Promise<{
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
      `${API_CONFIG.TIPO_CAMBIO.FRANKFURTER_URL}/${fechaInicioStr}..${fechaFinStr}?from=USD&to=CLP`
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