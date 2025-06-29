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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-4">Crear Template Personalizado</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
              <select
                value={rubro}
                onChange={e => setRubro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {rubros.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia</label>
              <select
                value={experiencia}
                onChange={e => setExperiencia(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {experiencias.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modo</label>
            <select
              value={modo}
              onChange={e => setModo(e.target.value as 'hora' | 'proyecto')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="hora">Tarifa por Hora</option>
              <option value="proyecto">Simular Proyecto</option>
            </select>
          </div>
          {modo === 'hora' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingresos deseados (CLP)</label>
                <input
                  type="number"
                  value={ingresosDeseados}
                  onChange={e => setIngresosDeseados(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gastos fijos (CLP)</label>
                <input
                  type="number"
                  value={gastosFijos}
                  onChange={e => setGastosFijos(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Días trabajados/mes</label>
                <input
                  type="number"
                  value={diasTrabajados}
                  onChange={e => setDiasTrabajados(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas por día</label>
                <input
                  type="number"
                  value={horasPorDia}
                  onChange={e => setHorasPorDia(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto (CLP)</label>
                <input
                  type="number"
                  value={presupuesto}
                  onChange={e => setPresupuesto(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas estimadas</label>
                <input
                  type="number"
                  value={horasEstimadas}
                  onChange={e => setHorasEstimadas(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gastos del proyecto (CLP)</label>
                <input
                  type="number"
                  value={gastosProyecto}
                  onChange={e => setGastosProyecto(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 