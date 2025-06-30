import React from 'react';

interface ApiInfoWidgetProps {
  impuestos?: {
    fecha_actualizacion: string;
  };
  tipo_cambio?: {
    fecha: string;
    fuente: string;
  };
  tarifas_mercado?: {
    fecha_actualizacion: string;
  };
}

export default function ApiInfoWidget({ impuestos, tipo_cambio, tarifas_mercado }: ApiInfoWidgetProps) {
  if (!impuestos && !tipo_cambio && !tarifas_mercado) {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Información de datos utilizados
      </h4>
      <div className="text-xs text-blue-700 space-y-1">
        {impuestos && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Impuestos:</span>
            <span>Actualizados el {new Date(impuestos.fecha_actualizacion).toLocaleDateString('es-CL')}</span>
          </div>
        )}
        {tipo_cambio && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Tipo de cambio:</span>
            <span>{tipo_cambio.fuente} - {new Date(tipo_cambio.fecha).toLocaleDateString('es-CL')}</span>
          </div>
        )}
        {tarifas_mercado && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Tarifas del mercado:</span>
            <span>Actualizadas el {new Date(tarifas_mercado.fecha_actualizacion).toLocaleDateString('es-CL')}</span>
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-blue-600">
        <p>Los datos se actualizan automáticamente desde fuentes oficiales y APIs confiables.</p>
      </div>
    </div>
  );
} 