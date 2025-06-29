'use client';

import { useState } from 'react';
import { CalculationTemplate } from '@/utils/types';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (template: Omit<CalculationTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => Promise<void>;
}

const rubros = [
  'Desarrollo Web',
  'Diseño Gráfico',
  'Marketing Digital',
  'Redacción',
  'Traducción',
  'Consultoría'
];

const experiencias = [
  '0-1 años',
  '3-5 años',
  '5-10 años'
];

export default function CreateTemplateModal({ isOpen, onClose, onCreate }: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rubro, setRubro] = useState(rubros[0]);
  const [experiencia, setExperiencia] = useState(experiencias[0]);
  const [modo, setModo] = useState<'hora' | 'proyecto'>('hora');
  // Campos para modo hora
  const [ingresosDeseados, setIngresosDeseados] = useState('');
  const [diasTrabajados, setDiasTrabajados] = useState('20');
  const [horasPorDia, setHorasPorDia] = useState('8');
  const [gastosFijos, setGastosFijos] = useState('');
  // Campos para modo proyecto
  const [presupuesto, setPresupuesto] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('');
  const [gastosProyecto, setGastosProyecto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let config: Record<string, any> = {
        rubro,
        experiencia
      };
      if (modo === 'hora') {
        config = {
          ...config,
          ingresosDeseados: Number(ingresosDeseados),
          diasTrabajados: Number(diasTrabajados),
          horasPorDia: Number(horasPorDia),
          gastosFijos: Number(gastosFijos)
        };
      } else {
        config = {
          ...config,
          presupuesto: Number(presupuesto),
          horasEstimadas: Number(horasEstimadas),
          gastosProyecto: Number(gastosProyecto)
        };
      }
      await onCreate({
        name,
        description,
        rubro,
        experiencia,
        modo,
        config,
        is_default: false,
        is_public: false
      });
      setName('');
      setDescription('');
      setRubro(rubros[0]);
      setExperiencia(experiencias[0]);
      setModo('hora');
      setIngresosDeseados('');
      setDiasTrabajados('20');
      setHorasPorDia('8');
      setGastosFijos('');
      setPresupuesto('');
      setHorasEstimadas('');
      setGastosProyecto('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear el template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Crear Template Personalizado</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre del Template</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Ej: Template para desarrollo web"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Describe el propósito de este template"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Rubro</label>
              <select
                value={rubro}
                onChange={e => setRubro(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {rubros.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Experiencia</label>
              <select
                value={experiencia}
                onChange={e => setExperiencia(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {experiencias.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de Cálculo</label>
            <select
              value={modo}
              onChange={e => setModo(e.target.value as 'hora' | 'proyecto')}
              className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="hora">Tarifa por Hora</option>
              <option value="proyecto">Simular Proyecto</option>
            </select>
          </div>
          {modo === 'hora' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Ingresos deseados (CLP)</label>
                <input
                  type="number"
                  value={ingresosDeseados}
                  onChange={e => setIngresosDeseados(e.target.value)}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="1500000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Gastos fijos (CLP)</label>
                <input
                  type="number"
                  value={gastosFijos}
                  onChange={e => setGastosFijos(e.target.value)}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="300000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Días trabajados/mes</label>
                <input
                  type="number"
                  value={diasTrabajados}
                  onChange={e => setDiasTrabajados(e.target.value)}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Horas por día</label>
                <input
                  type="number"
                  value={horasPorDia}
                  onChange={e => setHorasPorDia(e.target.value)}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="8"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Presupuesto (CLP)</label>
                <input
                  type="number"
                  value={presupuesto}
                  onChange={e => setPresupuesto(e.target.value)}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="1000000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Horas estimadas</label>
                <input
                  type="number"
                  value={horasEstimadas}
                  onChange={e => setHorasEstimadas(e.target.value)}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="40"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Gastos del proyecto (CLP)</label>
                <input
                  type="number"
                  value={gastosProyecto}
                  onChange={e => setGastosProyecto(e.target.value)}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="50000"
                />
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </div>
              ) : (
                'Crear Template'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 