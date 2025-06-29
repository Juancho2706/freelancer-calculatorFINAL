/**
 * Funciones de cálculo para la Calculadora Freelancer Chile
 * Considera impuestos chilenos y cotizaciones previsionales
 */

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
}

// Constantes de impuestos chilenos
const IVA = 0.19; // 19%
const RETENCION_BOLETA = 0.1375; // 13.75% (proyectado 2025)
const COTIZACION_SALUD = 0.07; // 7%

/**
 * Función principal de cálculo según Día 3
 * Sigue la lógica: base imponible (ingreso * 1.19) + cotización (7%) + gastos fijos / horas
 */
export function calcularTarifa(datos: DatosCalculo): ResultadoCalculo {
  const { ingresosDeseados, diasTrabajados, horasPorDia, gastosFijos } = datos;
  
  // 1. Calcular base imponible (ingreso * 1.19)
  const baseImponible = ingresosDeseados * (1 + IVA);
  
  // 2. Añadir cotización previsional (7% de la base)
  const cotizacionPrevisional = baseImponible * COTIZACION_SALUD;
  
  // 3. Sumar gastos fijos
  const totalConGastos = baseImponible + cotizacionPrevisional + gastosFijos;
  
  // 4. Dividir por horas trabajadas (días * horas por día)
  const horasMensuales = diasTrabajados * horasPorDia;
  const tarifaHora = totalConGastos / horasMensuales;
  
  // Calcular tarifa por proyecto (40 horas)
  const tarifaProyecto = tarifaHora * 40;
  
  // Calcular desglose para mostrar al usuario
  const iva = ingresosDeseados * IVA;
  const retencion = ingresosDeseados * RETENCION_BOLETA;
  const cotizacionSalud = ingresosDeseados * COTIZACION_SALUD;
  
  return {
    tarifaHora: Math.round(tarifaHora),
    tarifaProyecto: Math.round(tarifaProyecto),
    ingresosNetos: ingresosDeseados,
    desglose: {
      iva: Math.round(iva),
      retencion: Math.round(retencion),
      cotizacionSalud: Math.round(cotizacionSalud),
      gastosFijos: gastosFijos,
    },
  };
}

/**
 * Calcula la tarifa por hora necesaria para alcanzar los ingresos deseados
 * Versión mejorada con cálculo más preciso de impuestos
 */
export function calcularTarifaHora(datos: DatosCalculo): ResultadoCalculo {
  const { ingresosDeseados, diasTrabajados, horasPorDia, gastosFijos } = datos;
  
  // Horas totales trabajadas al mes
  const horasMensuales = diasTrabajados * horasPorDia;
  
  // Ingresos brutos necesarios (incluyendo impuestos y gastos)
  const ingresosBrutos = ingresosDeseados + gastosFijos;
  
  // Aplicar impuestos y cotizaciones
  const iva = ingresosBrutos * IVA;
  const retencion = ingresosBrutos * RETENCION_BOLETA;
  const cotizacionSalud = ingresosBrutos * COTIZACION_SALUD;
  
  // Total de impuestos y cotizaciones
  const totalImpuestos = iva + retencion + cotizacionSalud;
  
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
      iva: Math.round(iva),
      retencion: Math.round(retencion),
      cotizacionSalud: Math.round(cotizacionSalud),
      gastosFijos: gastosFijos,
    },
  };
}

/**
 * Función simplificada para cálculo rápido
 * Usa la lógica del Día 3: base imponible + cotización + gastos / horas
 */
export function calcularTarifaSimple(ingresosDeseados: number, diasTrabajados: number, gastosFijos: number = 0): number {
  // Base imponible (ingreso * 1.19)
  const baseImponible = ingresosDeseados * (1 + IVA);
  
  // Cotización previsional (7% de base)
  const cotizacionPrevisional = baseImponible * COTIZACION_SALUD;
  
  // Total con gastos fijos
  const total = baseImponible + cotizacionPrevisional + gastosFijos;
  
  // Dividir por horas trabajadas (días * 8)
  const horasMensuales = diasTrabajados * 8;
  
  return Math.round(total / horasMensuales);
}

/**
 * Convierte CLP a USD usando un tipo de cambio aproximado
 * En producción, esto debería usar una API de tipo de cambio en tiempo real
 */
export function convertirCLPaUSD(clp: number, tipoCambio: number = 950): number {
  return clp / tipoCambio;
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