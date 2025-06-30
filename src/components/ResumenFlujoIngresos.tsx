import React from 'react';
import { Tooltip } from 'react-tooltip';
import { formatearCLP } from '@/lib/calculos';
import MultiCurrencyDisplay from './MultiCurrencyDisplay';

interface ResumenFlujoIngresosProps {
  ingresosNetos: number;
  desglose: {
    iva: number;
    retencion: number;
    cotizacionSalud: number;
    gastosFijos: number;
  };
  modoProyecto?: boolean;
  ingresoBrutoOverride?: number; // Permite forzar el ingreso bruto si se requiere
}

const ResumenFlujoIngresos: React.FC<ResumenFlujoIngresosProps> = ({ ingresosNetos, desglose, modoProyecto = false, ingresoBrutoOverride }) => {
  const totalDescuentos = desglose.iva + desglose.retencion + desglose.cotizacionSalud + desglose.gastosFijos;
  const ingresoBruto = ingresoBrutoOverride !== undefined
    ? ingresoBrutoOverride
    : ingresosNetos + totalDescuentos;

  return (
    <div className="mt-6 mb-8 p-4 bg-white rounded-lg border border-gray-200">
      <h5 className="font-medium text-gray-900 mb-3 flex items-center">
        Resumen del flujo de ingresos
        <span className="ml-2 cursor-pointer" data-tooltip-id="flujo-tip">?</span>
      </h5>
      <Tooltip id="flujo-tip" place="right" content="Flujo completo de tus ingresos: desde lo que el cliente paga hasta lo que realmente recibes después de impuestos y gastos." />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Ingreso bruto (lo que el cliente paga)</span>
          <span className="font-semibold text-gray-900">
            {formatearCLP(ingresoBruto)}
          </span>
        </div>
        <div className="flex justify-between items-center text-red-600">
          <span className="text-gray-700">- Total descuentos (impuestos + gastos)</span>
          <span className="font-semibold">
            -{formatearCLP(totalDescuentos)}
          </span>
        </div>
        <hr className="border-gray-300" />
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">= Ingresos netos (lo que recibes)</span>
          <span className="text-xl font-bold text-green-600">
            {formatearCLP(ingresosNetos)}
          </span>
        </div>
        <div className="mt-2">
          <MultiCurrencyDisplay valueCLP={ingresosNetos} className="text-xs" />
        </div>
      </div>
    </div>
  );
};

export default ResumenFlujoIngresos; 