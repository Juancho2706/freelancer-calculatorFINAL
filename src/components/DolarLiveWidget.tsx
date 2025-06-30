import React, { useState, useEffect } from 'react';
import { getExchangeRate, getExchangeRateHistory, ExchangeRate } from '@/lib/exchange-rates';

interface DolarLiveWidgetProps {
  showHistory?: boolean;
  className?: string;
}

interface TipoCambioDolar {
  clp_usd: number;
  usd_clp: number;
  fecha: string;
  fuente: string;
}

interface HistorialDolar {
  fecha: string;
  clp_usd: number;
}

export default function DolarLiveWidget({ 
  showHistory = false, 
  className = '' 
}: DolarLiveWidgetProps) {
  const [tipoCambio, setTipoCambio] = useState<TipoCambioDolar | null>(null);
  const [historial, setHistorial] = useState<HistorialDolar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);

  const cargarTipoCambio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar tipo de cambio desde Supabase
      const result = await getExchangeRate();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar tipo de cambio');
      }

      if (!result.data) {
        throw new Error('No hay datos de tipo de cambio disponibles');
      }

      const exchangeRate = result.data;
      
      const tipoCambioData: TipoCambioDolar = {
        clp_usd: exchangeRate.rate,
        usd_clp: 1 / exchangeRate.rate,
        fecha: exchangeRate.fetched_at,
        fuente: 'Supabase Cache'
      };
      
      setTipoCambio(tipoCambioData);
      setLastUpdate(new Date());
      setIsStale(result.isStale || false);

      // Cargar historial si se solicita
      if (showHistory) {
        const historyResult = await getExchangeRateHistory(7);
        
        if (historyResult.success && historyResult.data) {
          const historialData = historyResult.data.map((item: ExchangeRate) => ({
            fecha: item.fetched_at,
            clp_usd: item.rate,
          }));
          
          setHistorial(historialData);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error cargando tipo de cambio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarTipoCambio();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(cargarTipoCambio, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [showHistory]);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calcularVariacion = () => {
    if (historial.length < 2) return null;
    
    const actual = historial[historial.length - 1].clp_usd;
    const anterior = historial[0].clp_usd;
    const variacion = actual - anterior;
    const porcentaje = (variacion / anterior) * 100;
    
    return {
      valor: variacion,
      porcentaje,
      esPositivo: variacion > 0,
    };
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-6 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-700 text-sm">Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!tipoCambio) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <span className="text-gray-500 text-sm">No hay datos disponibles</span>
      </div>
    );
  }

  const variacion = calcularVariacion();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-2">🇺🇸</span>
          <div>
            <h3 className="font-semibold text-gray-900">Dólar en Tiempo Real</h3>
            <p className="text-xs text-gray-500">Supabase Cache</p>
          </div>
        </div>
        <button
          onClick={cargarTipoCambio}
          className="text-blue-600 hover:text-blue-800 text-sm"
          disabled={isLoading}
        >
          {isLoading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Tipo de cambio actual */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          ${tipoCambio.clp_usd.toLocaleString('es-CL')}
        </div>
        <div className="text-sm text-gray-600">
          CLP por USD • Actualizado: {formatearHora(tipoCambio.fecha)}
          {isStale && (
            <span className="ml-2 text-orange-600 font-medium">
              ⚠️ Datos antiguos
            </span>
          )}
        </div>
      </div>

      {/* Variación si hay historial */}
      {showHistory && variacion && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Variación (7 días):</span>
            <div className={`flex items-center ${variacion.esPositivo ? 'text-green-600' : 'text-red-600'}`}>
              <span className="font-semibold">
                {variacion.esPositivo ? '+' : ''}{variacion.valor.toFixed(0)} CLP
              </span>
              <span className="ml-1 text-xs">
                ({variacion.esPositivo ? '+' : ''}{variacion.porcentaje.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Historial simplificado */}
      {showHistory && historial.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Últimos 7 días</h4>
          <div className="space-y-1">
            {historial.slice(-5).map((item, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-gray-600">{formatearFecha(item.fecha)}</span>
                <span className="font-medium">${item.clp_usd.toLocaleString('es-CL')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Fuente: {tipoCambio.fuente}</span>
          {lastUpdate && (
            <span>Última actualización: {formatearHora(lastUpdate.toISOString())}</span>
          )}
        </div>
        {isStale && (
          <div className="mt-1 text-orange-600">
            ⚠️ Ejecuta el script de actualización para obtener datos frescos
          </div>
        )}
      </div>
    </div>
  );
} 