/**
 * Constantes de la aplicación Calculadora Freelancer Chile
 */

// Impuestos y cotizaciones chilenos
export const IMPUESTOS = {
  IVA: 0.19, // 19%
  RETENCION_BOLETA: 0.1375, // 13.75% (proyectado 2025)
  COTIZACION_SALUD: 0.07, // 7%
} as const;

// Valores por defecto para la calculadora
export const VALORES_DEFAULT = {
  INGRESOS_DESEADOS: 1500000, // 1.5M CLP
  DIAS_TRABAJADOS: 20, // 20 días al mes
  HORAS_POR_DIA: 8, // 8 horas por día
  GASTOS_FIJOS: 300000, // 300K CLP
  TIPO_CAMBIO_USD: 950, // CLP por USD (aproximado)
} as const;

// Configuración de la aplicación
export const APP_CONFIG = {
  NOMBRE: 'Calculadora Freelancer Chile',
  VERSION: '1.0.0',
  DESCRIPCION: 'Calcula tus tarifas considerando impuestos chilenos',
} as const;

// Mensajes de validación
export const MENSAJES = {
  ERROR: {
    INGRESOS_INVALIDOS: 'Los ingresos deben ser mayores a 0',
    DIAS_INVALIDOS: 'Los días trabajados deben estar entre 1 y 31',
    HORAS_INVALIDAS: 'Las horas por día deben estar entre 1 y 24',
    GASTOS_INVALIDOS: 'Los gastos fijos no pueden ser negativos',
  },
  EXITO: {
    CALCULO_COMPLETADO: 'Cálculo completado exitosamente',
  },
} as const; 