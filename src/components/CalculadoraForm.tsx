'use client';

import { useState } from 'react';
import { DatosCalculo, calcularTarifaHora, formatearCLP } from '@/lib/calculos';
import { VALORES_DEFAULT } from '@/utils/constants';

export default function CalculadoraForm() {
  const [datos, setDatos] = useState<DatosCalculo>({
    ingresosDeseados: VALORES_DEFAULT.INGRESOS_DESEADOS,
    diasTrabajados: VALORES_DEFAULT.DIAS_TRABAJADOS,
    horasPorDia: VALORES_DEFAULT.HORAS_POR_DIA,
    gastosFijos: VALORES_DEFAULT.GASTOS_FIJOS,
  });

  const [resultado, setResultado] = useState<ReturnType<typeof calcularTarifaHora> | null>(null);

  const handleInputChange = (campo: keyof DatosCalculo, valor: number) => {
    setDatos(prev => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resultadoCalculo = calcularTarifaHora(datos);
    setResultado(resultadoCalculo);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Ingresa tus datos
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Ingresos Deseados */}
          <div>
            <label htmlFor="ingresos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ingresos deseados (CLP mensuales)
            </label>
            <input
              type="number"
              id="ingresos"
              value={datos.ingresosDeseados}
              onChange={(e) => handleInputChange('ingresosDeseados', Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="1500000"
              min="0"
            />
          </div>

          {/* Días Trabajados */}
          <div>
            <label htmlFor="dias" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Días trabajados al mes
            </label>
            <input
              type="number"
              id="dias"
              value={datos.diasTrabajados}
              onChange={(e) => handleInputChange('diasTrabajados', Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="20"
              min="1"
              max="31"
            />
          </div>

          {/* Horas por Día */}
          <div>
            <label htmlFor="horas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Horas trabajadas por día
            </label>
            <input
              type="number"
              id="horas"
              value={datos.horasPorDia}
              onChange={(e) => handleInputChange('horasPorDia', Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="8"
              min="1"
              max="24"
            />
          </div>

          {/* Gastos Fijos */}
          <div>
            <label htmlFor="gastos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gastos fijos (CLP mensuales)
            </label>
            <input
              type="number"
              id="gastos"
              value={datos.gastosFijos}
              onChange={(e) => handleInputChange('gastosFijos', Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="300000"
              min="0"
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Calcular Tarifa
          </button>
        </div>
      </form>

      {/* Resultados */}
      {resultado && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Resultados del cálculo
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Tarifas */}
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Tarifa por hora
                </h4>
                <p className="text-3xl font-bold text-blue-600">
                  {formatearCLP(resultado.tarifaHora)}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-gray-700 p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Tarifa por proyecto (40h)
                </h4>
                <p className="text-3xl font-bold text-green-600">
                  {formatearCLP(resultado.tarifaProyecto)}
                </p>
              </div>
            </div>

            {/* Desglose */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Desglose de impuestos
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">IVA (19%)</span>
                  <span className="font-semibold">{formatearCLP(resultado.desglose.iva)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Retención (13.75%)</span>
                  <span className="font-semibold">{formatearCLP(resultado.desglose.retencion)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Cotización Salud (7%)</span>
                  <span className="font-semibold">{formatearCLP(resultado.desglose.cotizacionSalud)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Gastos fijos</span>
                  <span className="font-semibold">{formatearCLP(resultado.desglose.gastosFijos)}</span>
                </div>
                <hr className="border-gray-300 dark:border-gray-600" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Ingresos netos</span>
                  <span className="text-green-600">{formatearCLP(resultado.ingresosNetos)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 