'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { ResultadoCalculo, formatearCLP, convertirCLPaUSD } from '@/lib/calculos';
import { VALORES_DEFAULT } from '@/utils/constants';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import ResumenFlujoIngresos from './ResumenFlujoIngresos';
import { obtenerTarifaEspecifica } from '@/lib/apis';
import MultiCurrencyDisplay from './MultiCurrencyDisplay';

// Registrar componentes de Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ResultadoProps {
  resultado: ResultadoCalculo & {
    proyecto?: {
      precioRecomendado: number;
      ganancia: number;
      rentabilidad: number;
      tarifaHoraNecesaria: number;
      horasTotales: number;
    };
  };
  datosOriginales: {
    ingresosDeseados: number;
    diasTrabajados: number;
    horasPorDia: number;
    gastosFijos: number;
  };
  rubro: string;
  experiencia: string;
  modoProyecto: boolean;
  proyecto: {
    nombre: string;
    descripcion: string;
    duracion: string;
    horasTotales: string;
    entregables: string;
    revisiones: string;
    tipoCliente: string;
    presupuesto: string;
  };
}

// Mapeo de íconos para monedas
const currencyIcons: Record<string, string> = {
  CLP: '🇨🇱',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  UF: '💱',
  UTM: '💱',
  BTC: '₿',
};

export default function Resultado({ resultado, datosOriginales, rubro, experiencia, modoProyecto, proyecto }: ResultadoProps) {
  const [tarifaSugerida, setTarifaSugerida] = useState<{
    min: number;
    prom: number;
    max: number;
    fecha_actualizacion: string;
  } | null>(null);
  const [conversionUSD, setConversionUSD] = useState<{
    usd: number;
    tipoCambio: number;
    fecha: string;
    fuente: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Estado para monedas
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<any | null>(null);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  useEffect(() => {
    const cargarDatosExternos = async () => {
      try {
        // Cargar tarifa sugerida del mercado
        const tarifaMercado = await obtenerTarifaEspecifica(rubro, experiencia);
        if (tarifaMercado) {
          setTarifaSugerida({
            min: tarifaMercado.min,
            prom: tarifaMercado.promedio,
            max: tarifaMercado.max,
            fecha_actualizacion: tarifaMercado.fecha_actualizacion,
          });
        }

        // Cargar conversión a USD
        const conversion = await convertirCLPaUSD(resultado.tarifaHora);
        setConversionUSD(conversion);
      } catch (error) {
        console.warn('Error cargando datos externos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatosExternos();
  }, [resultado.tarifaHora, rubro, experiencia]);

  useEffect(() => {
    async function fetchCurrencies() {
      setLoadingCurrencies(true);
      const supabaseModule = await import('@/lib/supabase-config');
      const supabase = supabaseModule.supabase;
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('target_currency', 'CLP')
        .order('base_currency', { ascending: true });
      const now = new Date().toISOString();
      let monedas = data || [];
      // Agregar CLP manualmente como opción
      monedas = [
        { base_currency: 'CLP', target_currency: 'CLP', rate: 1, fetched_at: now },
        ...monedas
      ];
      setCurrencies(monedas);
      setSelectedCurrency(monedas[0] || null);
      setLoadingCurrencies(false);
    }
    fetchCurrencies();
  }, []);

  // Función para convertir CLP a la moneda seleccionada
  const convertir = (valorCLP: number) => {
    if (!selectedCurrency) return valorCLP.toLocaleString('es-CL') + ' CLP';
    const valor = valorCLP / selectedCurrency.rate;
    return valor.toLocaleString('es-CL', { maximumFractionDigits: 2 }) + ' ' + selectedCurrency.base_currency;
  };

  // Calcular valores en USD usando los datos ya cargados
  const tarifaHoraUSD = conversionUSD?.usd || 0;
  const tarifaProyectoUSD = conversionUSD ? (resultado.tarifaProyecto * conversionUSD.usd / resultado.tarifaHora) : 0;
  const ingresosNetosUSD = conversionUSD ? (resultado.ingresosNetos * conversionUSD.usd / resultado.tarifaHora) : 0;

  const sugeridas = tarifaSugerida || { min: 0, prom: 0, max: 0 };

  // Datos para el gráfico de torta
  const chartData = {
    labels: [
      'Ingresos Netos',
      'IVA (19%)',
      'Retención (13.75%)',
      'Cotización Salud (7%)',
      'Gastos Fijos'
    ],
    datasets: [
      {
        data: [
          resultado.ingresosNetos,
          resultado.desglose.iva,
          resultado.desglose.retencion,
          resultado.desglose.cotizacionSalud,
          resultado.desglose.gastosFijos
        ],
        backgroundColor: [
          '#10B981', // Verde - Ingresos netos
          '#EF4444', // Rojo - IVA
          '#F59E0B', // Amarillo - Retención
          '#3B82F6', // Azul - Salud
          '#8B5CF6'  // Púrpura - Gastos fijos
        ],
        borderColor: [
          '#059669',
          '#DC2626',
          '#D97706',
          '#2563EB',
          '#7C3AED'
        ],
        borderWidth: 2,
      },
    ],
  };

  // Datos para el gráfico de barras comparativo
  const barData = {
    labels: ['Tu Tarifa', 'Promedio Industria', 'Tarifa Alta'],
    datasets: [
      {
        label: 'Tarifa por Hora (USD)',
        data: [
          tarifaHoraUSD,
          25, // Promedio industria (ejemplo)
          45  // Tarifa alta (ejemplo)
        ],
        backgroundColor: [
          '#3B82F6',
          '#6B7280',
          '#10B981'
        ],
        borderColor: [
          '#2563EB',
          '#4B5563',
          '#059669'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${formatearCLP(value)}`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Comparación de Tarifas (USD/hora)',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'USD por hora'
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
      <ReactTooltip id="tooltip" />
      {/* Header con estado de éxito y selector de moneda */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-semibold text-gray-900">
            Resultados del cálculo
          </h3>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Cálculo completado
          </div>
        </div>
        {/* Selector de moneda global */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 mr-2">Moneda:</label>
          <div className="relative">
            <select
              className="border border-blue-300 rounded-lg px-3 py-2 text-base font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all shadow-sm bg-white pr-10 text-black dark:text-white appearance-none"
              value={selectedCurrency?.base_currency || ''}
              onChange={e => setSelectedCurrency(currencies.find(c => c.base_currency === e.target.value))}
              disabled={loadingCurrencies || currencies.length === 0}
            >
              {currencies.map((c) => (
                <option key={c.base_currency} value={c.base_currency} className="text-black dark:text-white bg-white dark:bg-gray-800">
                  {currencyIcons[c.base_currency] ? `${currencyIcons[c.base_currency]} ` : ''}{c.base_currency}
                </option>
              ))}
            </select>
            {/* Ícono de la moneda seleccionada sobre el select */}
            {selectedCurrency && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xl">
                {currencyIcons[selectedCurrency.base_currency] || ''}
              </span>
            )}
          </div>
          {selectedCurrency && (
            <span className="text-xs text-gray-500 ml-2">1 {currencyIcons[selectedCurrency.base_currency] ? `${currencyIcons[selectedCurrency.base_currency]} ` : ''}{selectedCurrency.base_currency} = {selectedCurrency.rate.toLocaleString('es-CL')} CLP</span>
          )}
        </div>
      </div>

      {/* Info de rubro, experiencia y modo */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
          Rubro: <b className="ml-1">{rubro}</b>
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
          Experiencia: <b className="ml-1">{experiencia}</b>
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
          {modoProyecto ? 'Simulación de proyecto' : 'Tarifa por hora'}
        </span>
        {modoProyecto && proyecto.nombre && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
            Proyecto: <b className="ml-1">{proyecto.nombre}</b>
          </span>
        )}
      </div>

      {/* Tarifas principales */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Tarifa por hora */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            {modoProyecto ? 'Tarifa por hora efectiva' : 'Tarifa por hora'}
            <span className="ml-1 cursor-pointer" data-tooltip-id="th-tip">?</span>
          </h4>
          <ReactTooltip id="th-tip" place="right" content={modoProyecto ? "La tarifa por hora que obtienes con el presupuesto del proyecto." : "La tarifa mínima que deberías cobrar por cada hora de trabajo para alcanzar tus objetivos."} />
          <p className="text-3xl font-bold text-blue-600 mb-2">
            {convertir(resultado.tarifaHora)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {modoProyecto 
              ? `Para ${proyecto.horasTotales}h totales del proyecto`
              : `Para ${datosOriginales.horasPorDia}h × ${datosOriginales.diasTrabajados} días = ${datosOriginales.horasPorDia * datosOriginales.diasTrabajados}h mensuales`
            }
          </p>
        </div>

        {/* Tarifa por proyecto */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            {modoProyecto ? `Precio del proyecto (${proyecto.horasTotales}h)` : 'Tarifa por proyecto (40h)'}
            <span className="ml-1 cursor-pointer" data-tooltip-id="tp-tip">?</span>
          </h4>
          <ReactTooltip id="tp-tip" place="right" content={modoProyecto ? "Precio total del proyecto según el presupuesto ingresado o recomendado." : "Precio recomendado para un proyecto estándar de 40 horas. Si usas el modo proyecto, se ajusta a tus datos."} />
          <p className="text-3xl font-bold text-green-600 mb-2">
            {convertir(resultado.tarifaProyecto)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {modoProyecto && proyecto.presupuesto
              ? `Presupuesto ingresado: ${convertir(Number(proyecto.presupuesto))}`
              : modoProyecto 
                ? 'Precio recomendado basado en tu tarifa por hora'
                : 'Proyecto estándar de una semana laboral'
            }
          </p>
        </div>
      </div>

      {/* Información específica del modo proyecto */}
      {modoProyecto && resultado.proyecto && (
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Análisis de Rentabilidad del Proyecto
          </h4>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Precio recomendado</p>
              <p className="text-xl font-bold text-purple-600">
                {convertir(resultado.proyecto.precioRecomendado)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Basado en tu tarifa por hora de {convertir(resultado.proyecto.tarifaHoraNecesaria)}
              </p>
            </div>
            
            {proyecto.presupuesto && Number(proyecto.presupuesto) > 0 && (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Ganancia/Perdida</p>
                  <p className={`text-xl font-bold ${resultado.proyecto.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {resultado.proyecto.ganancia >= 0 ? '+' : ''}{convertir(resultado.proyecto.ganancia)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {resultado.proyecto.ganancia >= 0 ? 'Ganancia' : 'Pérdida'} vs precio recomendado
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Rentabilidad</p>
                  <p className={`text-xl font-bold ${resultado.proyecto.rentabilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {resultado.proyecto.rentabilidad >= 0 ? '+' : ''}{resultado.proyecto.rentabilidad.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Porcentaje de ganancia/pérdida
                  </p>
                </div>
              </>
            )}
          </div>
          
          {proyecto.presupuesto && Number(proyecto.presupuesto) > 0 && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center">
                <svg className={`w-5 h-5 mr-2 ${resultado.proyecto.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  {resultado.proyecto.ganancia >= 0 ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
                <span className={`font-medium ${resultado.proyecto.ganancia >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {resultado.proyecto.ganancia >= 0 
                    ? `✅ Este proyecto es rentable. Obtienes ${resultado.proyecto.rentabilidad.toFixed(1)}% de ganancia.`
                    : `⚠️ Este proyecto no es rentable. Tienes ${Math.abs(resultado.proyecto.rentabilidad).toFixed(1)}% de pérdida.`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparativa de tarifas sugeridas */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          Comparativa de tarifas sugeridas
          <span className="ml-1 cursor-pointer" data-tooltip-id="comp-tip">?</span>
        </h4>
        <ReactTooltip id="comp-tip" place="right" content="Tarifas mínimas, promedio y máximas recomendadas para tu rubro y experiencia." />
        <div className="flex flex-wrap gap-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
            Mínima: <b className="ml-1">{convertir(sugeridas.min)}</b>
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            Promedio: <b className="ml-1">{convertir(sugeridas.prom)}</b>
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            Máxima: <b className="ml-1">{convertir(sugeridas.max)}</b>
          </span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Gráfico de torta */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Distribución de Ingresos
          </h4>
          <div className="h-64">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Gráfico de barras comparativo */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Desglose detallado */}
      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          Desglose detallado de impuestos y gastos
          <span className="ml-2 cursor-pointer" data-tooltip-id="desglose-tip">?</span>
        </h4>
        <ReactTooltip id="desglose-tip" place="right" content="Aquí puedes ver cómo se distribuyen tus ingresos entre impuestos, cotizaciones, gastos fijos y lo que realmente recibes (ingresos netos)." />
        
        {/* Resumen del flujo de ingresos */}
        <ResumenFlujoIngresos
          ingresosNetos={resultado.ingresosNetos}
          desglose={resultado.desglose}
          modoProyecto={modoProyecto}
          ingresoBrutoOverride={modoProyecto ? resultado.tarifaProyecto : undefined}
        />
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Impuestos y cotizaciones */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
              Impuestos y Cotizaciones
              <span className="ml-2 cursor-pointer" data-tooltip-id="impuestos-tip">?</span>
            </h5>
            <ReactTooltip id="impuestos-tip" place="right" content="Impuestos y cotizaciones obligatorias en Chile para freelancers." />
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border-l-4 border-red-400">
              <span className="text-gray-700 flex items-center">
                IVA (19%)
                <span className="ml-1 cursor-pointer" data-tooltip-id="iva-tip">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" /></svg>
                </span>
              </span>
              <span className="font-semibold text-red-600">{convertir(resultado.desglose.iva)}</span>
              <ReactTooltip id="iva-tip" place="right" content="Impuesto al Valor Agregado (19%) que debes agregar a tus servicios si emites factura." />
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border-l-4 border-yellow-400">
              <span className="text-gray-700 flex items-center">
                Retención (13.75%)
                <span className="ml-1 cursor-pointer" data-tooltip-id="retencion-tip">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" /></svg>
                </span>
              </span>
              <span className="font-semibold text-yellow-600">{convertir(resultado.desglose.retencion)}</span>
              <ReactTooltip id="retencion-tip" place="right" content="Retención de honorarios (13.75%) que se descuenta automáticamente si emites boleta de honorarios." />
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border-l-4 border-blue-400">
              <span className="text-gray-700 flex items-center">
                Cotización Salud (7%)
                <span className="ml-1 cursor-pointer" data-tooltip-id="salud-tip">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" /></svg>
                </span>
              </span>
              <span className="font-semibold text-blue-600">{convertir(resultado.desglose.cotizacionSalud)}</span>
              <ReactTooltip id="salud-tip" place="right" content="Cotización obligatoria de salud (7%) sobre tus ingresos brutos." />
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-red-500 mt-4">
              <span className="text-gray-900 font-semibold flex items-center">
                Total impuestos y cotizaciones
                <span className="ml-1 cursor-pointer" data-tooltip-id="totalimp-tip">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" /></svg>
                </span>
              </span>
              <span className="font-bold text-red-500">{convertir(resultado.desglose.iva + resultado.desglose.retencion + resultado.desglose.cotizacionSalud)}</span>
              <ReactTooltip id="totalimp-tip" place="right" content="Suma de todos los impuestos y cotizaciones obligatorias." />
            </div>
          </div>
          {/* Gastos y resultado */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
              Gastos fijos
              <span className="ml-2 cursor-pointer" data-tooltip-id="gastos-tip">?</span>
            </h5>
            <ReactTooltip id="gastos-tip" place="right" content="Gastos mensuales que debes cubrir (ej: arriendo, internet, software, etc)." />
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border-l-4 border-orange-400">
              <span className="text-gray-700 flex items-center">
                Gastos fijos
                <span className="ml-1 cursor-pointer" data-tooltip-id="gastosfijos-tip">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" /></svg>
                </span>
              </span>
              <span className="font-semibold text-orange-600">{convertir(resultado.desglose.gastosFijos)}</span>
              <ReactTooltip id="gastosfijos-tip" place="right" content="Gastos fijos mensuales que debes cubrir para mantener tu actividad como freelancer." />
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500 mt-4">
              <span className="text-gray-900 font-semibold flex items-center">
                Total gastos (impuestos + gastos fijos)
                <span className="ml-1 cursor-pointer" data-tooltip-id="totalgastos-tip">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" /></svg>
                </span>
              </span>
              <span className="font-bold text-orange-500">{convertir(resultado.desglose.iva + resultado.desglose.retencion + resultado.desglose.cotizacionSalud + resultado.desglose.gastosFijos)}</span>
              <ReactTooltip id="totalgastos-tip" place="right" content="Suma de todos los impuestos, cotizaciones y tus gastos fijos mensuales." />
            </div>
            <hr className="border-gray-300" />
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500 mt-2">
              <span className="text-lg font-semibold text-gray-900 flex items-center">
                Ingresos netos
                <span className="ml-1 cursor-pointer" data-tooltip-id="netos-tip">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" /></svg>
                </span>
              </span>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600 block">
                  {convertir(resultado.ingresosNetos)}
                </span>
                <span className="text-sm text-green-700">
                  ≈ ${ingresosNetosUSD.toFixed(2)} USD
                </span>
              </div>
              <ReactTooltip id="netos-tip" place="right" content="Lo que realmente recibes después de impuestos y gastos. Este es tu ingreso disponible." />
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h5 className="font-medium text-blue-900">Información importante</h5>
            <p className="text-sm text-blue-800 mt-1">
              Esta tarifa considera todos los impuestos chilenos aplicables. Recuerda que los montos pueden variar según tu situación fiscal específica y la legislación vigente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 