/**
 * Funciones de cálculo para la Calculadora Freelancer Chile
 * Considera impuestos chilenos y cotizaciones previsionales
 */

import { obtenerImpuestos, obtenerTipoCambio } from './apis';

export interface DatosCalculo {
  ingresosDeseados: number; // CLP mensuales
  diasTrabajados: number; // Días trabajados al mes
  horasPorDia: number; // Horas trabajadas por día
  gastosFijos: number; // CLP mensuales
}

export interface ResultadoCalculo {
  tarifaHora: number; // CLP por hora
  tarifaProyecto: number; // CLP por proyecto (ejemplo: 40 horas)
  ingresosNetos: number; // CLP después de impuestos
  desglose: {
    iva: number;
    retencion: number;
    cotizacionSalud: number;
    gastosFijos: number;
  };
  metadata?: {
    impuestos: {
      iva: number;
      retencion_boleta: number;
      cotizacion_salud: number;
      fecha_actualizacion: string;
    };
    tipo_cambio?: {
      clp_usd: number;
      fecha: string;
      fuente: string;
    };
  };
  proyecto?: {
    precioRecomendado: number;
    ganancia: number;
    rentabilidad: number;
    tarifaHoraNecesaria: number;
    horasTotales: number;
  };
}

// Valores por defecto (fallback si las APIs fallan)
const IMPUESTOS_DEFAULT = {
  IVA: 0.19,
  RETENCION_BOLETA: 0.1375,
  COTIZACION_SALUD: 0.07,
};

/**
 * Función principal de cálculo según Día 3
 * Sigue la lógica: base imponible (ingreso * 1.19) + cotización (7%) + gastos fijos / horas
 */
export async function calcularTarifa(datos: DatosCalculo): Promise<ResultadoCalculo> {
  const { ingresosDeseados, diasTrabajados, horasPorDia, gastosFijos } = datos;
  
  // Obtener impuestos actuales desde API
  const impuestos = await obtenerImpuestos();
  const iva = impuestos.iva;
  const cotizacionSalud = impuestos.cotizacion_salud;
  
  // 1. Calcular base imponible (ingreso * 1.19)
  const baseImponible = ingresosDeseados * (1 + iva);
  
  // 2. Añadir cotización previsional (7% de la base)
  const cotizacionPrevisional = baseImponible * cotizacionSalud;
  
  // 3. Sumar gastos fijos
  const totalConGastos = baseImponible + cotizacionPrevisional + gastosFijos;
  
  // 4. Dividir por horas trabajadas (días * horas por día)
  const horasMensuales = diasTrabajados * horasPorDia;
  const tarifaHora = totalConGastos / horasMensuales;
  
  // Calcular tarifa por proyecto (40 horas)
  const tarifaProyecto = tarifaHora * 40;
  
  // Calcular desglose para mostrar al usuario
  const ivaCalculado = ingresosDeseados * iva;
  const retencion = ingresosDeseados * impuestos.retencion_boleta;
  const cotizacionSaludCalculado = ingresosDeseados * cotizacionSalud;
  
  return {
    tarifaHora: Math.round(tarifaHora),
    tarifaProyecto: Math.round(tarifaProyecto),
    ingresosNetos: ingresosDeseados,
    desglose: {
      iva: Math.round(ivaCalculado),
      retencion: Math.round(retencion),
      cotizacionSalud: Math.round(cotizacionSaludCalculado),
      gastosFijos: gastosFijos,
    },
    metadata: {
      impuestos,
    },
  };
}

/**
 * Calcula la tarifa por hora necesaria para alcanzar los ingresos deseados
 * Versión mejorada con cálculo más preciso de impuestos
 */
export async function calcularTarifaHora(datos: DatosCalculo): Promise<ResultadoCalculo> {
  const { ingresosDeseados, diasTrabajados, horasPorDia, gastosFijos } = datos;
  
  // Obtener impuestos actuales desde API
  const impuestos = await obtenerImpuestos();
  const iva = impuestos.iva;
  const retencionBoleta = impuestos.retencion_boleta;
  const cotizacionSalud = impuestos.cotizacion_salud;
  
  // Horas totales trabajadas al mes
  const horasMensuales = diasTrabajados * horasPorDia;
  
  // Ingresos brutos necesarios (incluyendo impuestos y gastos)
  const ingresosBrutos = ingresosDeseados + gastosFijos;
  
  // Aplicar impuestos y cotizaciones
  const ivaCalculado = ingresosBrutos * iva;
  const retencion = ingresosBrutos * retencionBoleta;
  const cotizacionSaludCalculado = ingresosBrutos * cotizacionSalud;
  
  // Total de impuestos y cotizaciones
  const totalImpuestos = ivaCalculado + retencion + cotizacionSaludCalculado;
  
  // Ingresos brutos totales necesarios
  const ingresosBrutosTotales = ingresosBrutos + totalImpuestos;
  
  // Tarifa por hora
  const tarifaHora = ingresosBrutosTotales / horasMensuales;
  
  // Tarifa por proyecto (ejemplo: 40 horas)
  const tarifaProyecto = tarifaHora * 40;
  
  return {
    tarifaHora: Math.round(tarifaHora),
    tarifaProyecto: Math.round(tarifaProyecto),
    ingresosNetos: ingresosDeseados,
    desglose: {
      iva: Math.round(ivaCalculado),
      retencion: Math.round(retencion),
      cotizacionSalud: Math.round(cotizacionSaludCalculado),
      gastosFijos: gastosFijos,
    },
    metadata: {
      impuestos,
    },
  };
}

/**
 * Función simplificada para cálculo rápido
 * Usa la lógica del Día 3: base imponible + cotización + gastos / horas
 */
export async function calcularTarifaSimple(ingresosDeseados: number, diasTrabajados: number, gastosFijos: number = 0): Promise<number> {
  // Obtener impuestos actuales desde API
  const impuestos = await obtenerImpuestos();
  const iva = impuestos.iva;
  const cotizacionSalud = impuestos.cotizacion_salud;
  
  // Base imponible (ingreso * 1.19)
  const baseImponible = ingresosDeseados * (1 + iva);
  
  // Cotización previsional (7% de base)
  const cotizacionPrevisional = baseImponible * cotizacionSalud;
  
  // Total con gastos fijos
  const total = baseImponible + cotizacionPrevisional + gastosFijos;
  
  // Dividir por horas trabajadas (días * 8)
  const horasMensuales = diasTrabajados * 8;
  
  return Math.round(total / horasMensuales);
}

/**
 * Convierte CLP a USD usando tipo de cambio en tiempo real
 */
export async function convertirCLPaUSD(clp: number): Promise<{ usd: number; tipoCambio: number; fecha: string; fuente: string }> {
  try {
    const tipoCambio = await obtenerTipoCambio();
    const usd = clp * tipoCambio.usd_clp;
    
    return {
      usd: Math.round(usd * 100) / 100, // Redondear a 2 decimales
      tipoCambio: tipoCambio.clp_usd,
      fecha: tipoCambio.fecha,
      fuente: tipoCambio.fuente,
    };
  } catch (error) {
    console.warn('Error obteniendo tipo de cambio, usando valor por defecto:', error);
    
    // Fallback con valor por defecto
    const tipoCambioDefault = 950;
    const usd = clp / tipoCambioDefault;
    
    return {
      usd: Math.round(usd * 100) / 100,
      tipoCambio: tipoCambioDefault,
      fecha: new Date().toISOString(),
      fuente: 'fallback',
    };
  }
}

/**
 * Convierte USD a CLP usando tipo de cambio en tiempo real
 */
export async function convertirUSDaCLP(usd: number): Promise<{ clp: number; tipoCambio: number; fecha: string; fuente: string }> {
  try {
    const tipoCambio = await obtenerTipoCambio();
    const clp = usd * tipoCambio.clp_usd;
    
    return {
      clp: Math.round(clp),
      tipoCambio: tipoCambio.clp_usd,
      fecha: tipoCambio.fecha,
      fuente: tipoCambio.fuente,
    };
  } catch (error) {
    console.warn('Error obteniendo tipo de cambio, usando valor por defecto:', error);
    
    // Fallback con valor por defecto
    const tipoCambioDefault = 950;
    const clp = usd * tipoCambioDefault;
    
    return {
      clp: Math.round(clp),
      tipoCambio: tipoCambioDefault,
      fecha: new Date().toISOString(),
      fuente: 'fallback',
    };
  }
}

/**
 * Formatea números en formato chileno (con puntos para miles)
 */
export function formatearCLP(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto);
}

/**
 * Valida que los datos de entrada sean correctos
 */
export function validarDatosCalculo(datos: DatosCalculo): { esValido: boolean; errores: string[] } {
  const errores: string[] = [];
  
  if (datos.ingresosDeseados <= 0) {
    errores.push('Los ingresos deseados deben ser mayores a 0');
  }
  
  if (datos.diasTrabajados <= 0 || datos.diasTrabajados > 31) {
    errores.push('Los días trabajados deben estar entre 1 y 31');
  }
  
  if (datos.horasPorDia <= 0 || datos.horasPorDia > 24) {
    errores.push('Las horas por día deben estar entre 1 y 24');
  }
  
  if (datos.gastosFijos < 0) {
    errores.push('Los gastos fijos no pueden ser negativos');
  }
  
  return {
    esValido: errores.length === 0,
    errores
  };
}

/**
 * Convierte CLP a múltiples monedas usando tipos de cambio en tiempo real
 */
export async function convertirCLPaMultiplesMonedas(clp: number): Promise<{
  usd: number;
  eur?: number;
  gbp?: number;
  ars?: number;
  pen?: number;
  cop?: number;
  tipoCambio: {
    clp_usd: number;
    clp_eur?: number;
    clp_gbp?: number;
    clp_ars?: number;
    clp_pen?: number;
    clp_cop?: number;
    fecha: string;
    fuente: string;
  };
}> {
  try {
    const tipoCambio = await obtenerTipoCambio();
    
    const resultado: {
      usd: number;
      eur?: number;
      gbp?: number;
      ars?: number;
      pen?: number;
      cop?: number;
      tipoCambio: {
        clp_usd: number;
        clp_eur?: number;
        clp_gbp?: number;
        clp_ars?: number;
        clp_pen?: number;
        clp_cop?: number;
        fecha: string;
        fuente: string;
      };
    } = {
      usd: Math.round(clp * tipoCambio.usd_clp * 100) / 100,
      tipoCambio: {
        clp_usd: tipoCambio.clp_usd,
        fecha: tipoCambio.fecha,
        fuente: tipoCambio.fuente,
      },
    };

    // Agregar otras monedas si están disponibles
    if (tipoCambio.eur_clp) {
      resultado.eur = Math.round(clp * tipoCambio.eur_clp * 100) / 100;
      resultado.tipoCambio.clp_eur = tipoCambio.clp_eur;
    }
    
    if (tipoCambio.gbp_clp) {
      resultado.gbp = Math.round(clp * tipoCambio.gbp_clp * 100) / 100;
      resultado.tipoCambio.clp_gbp = tipoCambio.clp_gbp;
    }
    
    if (tipoCambio.ars_clp) {
      resultado.ars = Math.round(clp * tipoCambio.ars_clp);
      resultado.tipoCambio.clp_ars = tipoCambio.clp_ars;
    }
    
    if (tipoCambio.pen_clp) {
      resultado.pen = Math.round(clp * tipoCambio.pen_clp * 100) / 100;
      resultado.tipoCambio.clp_pen = tipoCambio.clp_pen;
    }
    
    if (tipoCambio.cop_clp) {
      resultado.cop = Math.round(clp * tipoCambio.cop_clp);
      resultado.tipoCambio.clp_cop = tipoCambio.clp_cop;
    }

    return resultado;
  } catch (error) {
    console.warn('Error obteniendo tipos de cambio múltiples, usando valores por defecto:', error);
    
    // Fallback con valores por defecto
    const tipoCambioDefault = 950;
    const eurDefault = tipoCambioDefault * 1.1;
    const gbpDefault = tipoCambioDefault * 1.3;
    const arsDefault = tipoCambioDefault * 0.003;
    const penDefault = tipoCambioDefault * 0.25;
    const copDefault = tipoCambioDefault * 0.0002;
    
    return {
      usd: Math.round(clp / tipoCambioDefault * 100) / 100,
      eur: Math.round(clp / eurDefault * 100) / 100,
      gbp: Math.round(clp / gbpDefault * 100) / 100,
      ars: Math.round(clp / arsDefault),
      pen: Math.round(clp / penDefault * 100) / 100,
      cop: Math.round(clp / copDefault),
      tipoCambio: {
        clp_usd: tipoCambioDefault,
        clp_eur: eurDefault,
        clp_gbp: gbpDefault,
        clp_ars: arsDefault,
        clp_pen: penDefault,
        clp_cop: copDefault,
        fecha: new Date().toISOString(),
        fuente: 'fallback',
      },
    };
  }
}

/**
 * Convierte múltiples monedas a CLP usando tipos de cambio en tiempo real
 */
export async function convertirMultiplesMonedasACLP(montos: {
  usd?: number;
  eur?: number;
  gbp?: number;
  ars?: number;
  pen?: number;
  cop?: number;
}): Promise<{
  clp: number;
  tipoCambio: {
    clp_usd: number;
    clp_eur?: number;
    clp_gbp?: number;
    clp_ars?: number;
    clp_pen?: number;
    clp_cop?: number;
    fecha: string;
    fuente: string;
  };
}> {
  try {
    const tipoCambio = await obtenerTipoCambio();
    let totalCLP = 0;

    if (montos.usd) totalCLP += montos.usd * tipoCambio.clp_usd;
    if (montos.eur && tipoCambio.clp_eur) totalCLP += montos.eur * tipoCambio.clp_eur;
    if (montos.gbp && tipoCambio.clp_gbp) totalCLP += montos.gbp * tipoCambio.clp_gbp;
    if (montos.ars && tipoCambio.clp_ars) totalCLP += montos.ars * tipoCambio.clp_ars;
    if (montos.pen && tipoCambio.clp_pen) totalCLP += montos.pen * tipoCambio.clp_pen;
    if (montos.cop && tipoCambio.clp_cop) totalCLP += montos.cop * tipoCambio.clp_cop;

    return {
      clp: Math.round(totalCLP),
      tipoCambio: {
        clp_usd: tipoCambio.clp_usd,
        clp_eur: tipoCambio.clp_eur,
        clp_gbp: tipoCambio.clp_gbp,
        clp_ars: tipoCambio.clp_ars,
        clp_pen: tipoCambio.clp_pen,
        clp_cop: tipoCambio.clp_cop,
        fecha: tipoCambio.fecha,
        fuente: tipoCambio.fuente,
      },
    };
  } catch (error) {
    console.warn('Error obteniendo tipos de cambio múltiples, usando valores por defecto:', error);
    
    // Fallback con valores por defecto
    const tipoCambioDefault = 950;
    const eurDefault = tipoCambioDefault * 1.1;
    const gbpDefault = tipoCambioDefault * 1.3;
    const arsDefault = tipoCambioDefault * 0.003;
    const penDefault = tipoCambioDefault * 0.25;
    const copDefault = tipoCambioDefault * 0.0002;
    
    let totalCLP = 0;
    if (montos.usd) totalCLP += montos.usd * tipoCambioDefault;
    if (montos.eur) totalCLP += montos.eur * eurDefault;
    if (montos.gbp) totalCLP += montos.gbp * gbpDefault;
    if (montos.ars) totalCLP += montos.ars * arsDefault;
    if (montos.pen) totalCLP += montos.pen * penDefault;
    if (montos.cop) totalCLP += montos.cop * copDefault;

    return {
      clp: Math.round(totalCLP),
      tipoCambio: {
        clp_usd: tipoCambioDefault,
        clp_eur: eurDefault,
        clp_gbp: gbpDefault,
        clp_ars: arsDefault,
        clp_pen: penDefault,
        clp_cop: copDefault,
        fecha: new Date().toISOString(),
        fuente: 'fallback',
      },
    };
  }
} 