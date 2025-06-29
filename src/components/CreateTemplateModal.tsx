'use client';

import { useState, useEffect } from 'react';
import { CalculationTemplate } from '@/utils/types';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (template: Omit<CalculationTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => Promise<void>;
  editTemplate?: CalculationTemplate | null;
  onUpdate?: (templateId: string, updates: Partial<CalculationTemplate>) => Promise<void>;
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

export default function CreateTemplateModal({ isOpen, onClose, onCreate, editTemplate, onUpdate }: CreateTemplateModalProps) {
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
  // NUEVOS CAMPOS
  const [nombreCompania, setNombreCompania] = useState(''); // Para modo hora
  const [nombreProyecto, setNombreProyecto] = useState(''); // Para modo proyecto
  const [duracion, setDuracion] = useState(''); // Para modo proyecto
  const [entregables, setEntregables] = useState(''); // Para modo proyecto
  const [revisiones, setRevisiones] = useState(''); // Para modo proyecto
  // NUEVO: Estado para errores de validación
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editTemplate) {
      setName(editTemplate.name || '');
      setDescription(editTemplate.description || '');
      setRubro(editTemplate.rubro || rubros[0]);
      setExperiencia(editTemplate.experiencia || experiencias[0]);
      setModo(editTemplate.modo || 'hora');
      // Campos config
      setIngresosDeseados(editTemplate.config.ingresosDeseados?.toString() || '');
      setDiasTrabajados(editTemplate.config.diasTrabajados?.toString() || '20');
      setHorasPorDia(editTemplate.config.horasPorDia?.toString() || '8');
      setGastosFijos(editTemplate.config.gastosFijos?.toString() || '');
      setPresupuesto(editTemplate.config.presupuesto?.toString() || '');
      setHorasEstimadas(editTemplate.config.horasEstimadas?.toString() || '');
      setGastosProyecto(editTemplate.config.gastosProyecto?.toString() || '');
      setNombreCompania(editTemplate.config.nombreCompania || '');
      setNombreProyecto(editTemplate.config.nombreProyecto || '');
      setDuracion(editTemplate.config.duracion?.toString() || '');
      setEntregables(editTemplate.config.entregables?.toString() || '');
      setRevisiones(editTemplate.config.revisiones?.toString() || '');
    }
  }, [editTemplate]);

  if (!isOpen) return null;

  // Validación de campos numéricos
  const validateFields = () => {
    const errors: Record<string, string> = {};
    if (modo === 'hora') {
      if (Number(ingresosDeseados) <= 0 || Number(ingresosDeseados) > 100000000) errors.ingresosDeseados = 'Debe ser mayor a 0 y hasta 100 millones CLP';
      if (Number(gastosFijos) < 0 || Number(gastosFijos) > 10000000) errors.gastosFijos = 'Debe ser entre 0 y 10 millones CLP';
      if (Number(diasTrabajados) <= 0 || Number(diasTrabajados) > 31) errors.diasTrabajados = 'Debe ser entre 1 y 31';
      if (Number(horasPorDia) <= 0 || Number(horasPorDia) > 24) errors.horasPorDia = 'Debe ser entre 1 y 24';
    } else {
      if (Number(presupuesto) < 0 || Number(presupuesto) > 100000000) errors.presupuesto = 'Debe ser entre 0 y 100 millones CLP';
      if (Number(horasEstimadas) <= 0 || Number(horasEstimadas) > 1000) errors.horasEstimadas = 'Debe ser entre 1 y 1000';
      if (Number(gastosProyecto) < 0 || Number(gastosProyecto) > 10000000) errors.gastosProyecto = 'Debe ser entre 0 y 10 millones CLP';
      if (Number(duracion) <= 0 || Number(duracion) > 365) errors.duracion = 'Debe ser entre 1 y 365 días';
      if (Number(entregables) <= 0) errors.entregables = 'Debe ser mayor a 0';
      if (Number(revisiones) < 0) errors.revisiones = 'No puede ser negativo';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!validateFields()) { setLoading(false); return; }
    try {
      let config: Record<string, any> = {
        rubro,
        experiencia
      };
      if (modo === 'hora') {
        if (!nombreCompania || !description) throw new Error('Completa todos los campos obligatorios');
        config = {
          ...config,
          ingresosDeseados: Number(ingresosDeseados),
          diasTrabajados: Number(diasTrabajados),
          horasPorDia: Number(horasPorDia),
          gastosFijos: Number(gastosFijos),
          nombreCompania,
          descripcion: description
        };
      } else {
        if (!nombreProyecto || !description || !duracion || !entregables || !revisiones) throw new Error('Completa todos los campos obligatorios');
        config = {
          ...config,
          presupuesto: Number(presupuesto),
          horasEstimadas: Number(horasEstimadas),
          gastosProyecto: Number(gastosProyecto),
          nombreProyecto,
          descripcion: description,
          duracion: Number(duracion),
          entregables: Number(entregables),
          revisiones: Number(revisiones)
        };
      }
      if (editTemplate && onUpdate) {
        await onUpdate(editTemplate.id, {
          name,
          description,
          rubro,
          experiencia,
          modo,
          config,
          is_default: false,
          is_public: false
        });
        // Limpiar y cerrar
        setName(''); setDescription(''); setRubro(rubros[0]); setExperiencia(experiencias[0]); setModo('hora'); setIngresosDeseados(''); setDiasTrabajados('20'); setHorasPorDia('8'); setGastosFijos(''); setPresupuesto(''); setHorasEstimadas(''); setGastosProyecto(''); setNombreCompania(''); setNombreProyecto(''); setDuracion(''); setEntregables(''); setRevisiones(''); onClose(); return;
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
      setNombreCompania('');
      setNombreProyecto('');
      setDuracion('');
      setEntregables('');
      setRevisiones('');
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción breve</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
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
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre de la compañía</label>
                <input
                  type="text"
                  value={nombreCompania}
                  onChange={e => setNombreCompania(e.target.value)}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Ej: Acme S.A."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Ingresos deseados (CLP)</label>
                  <input
                    type="number"
                    value={ingresosDeseados}
                    onChange={e => setIngresosDeseados(e.target.value)}
                    required
                    min={1}
                    max={100000000}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="1500000"
                  />
                  {fieldErrors.ingresosDeseados && <p className="text-red-600 text-xs mt-1">{fieldErrors.ingresosDeseados}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Gastos fijos (CLP)</label>
                  <input
                    type="number"
                    value={gastosFijos}
                    onChange={e => setGastosFijos(e.target.value)}
                    required
                    min={0}
                    max={10000000}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="300000"
                  />
                  {fieldErrors.gastosFijos && <p className="text-red-600 text-xs mt-1">{fieldErrors.gastosFijos}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Días trabajados/mes</label>
                  <input
                    type="number"
                    value={diasTrabajados}
                    onChange={e => setDiasTrabajados(e.target.value)}
                    required
                    min={1}
                    max={31}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="20"
                  />
                  {fieldErrors.diasTrabajados && <p className="text-red-600 text-xs mt-1">{fieldErrors.diasTrabajados}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Horas por día</label>
                  <input
                    type="number"
                    value={horasPorDia}
                    onChange={e => setHorasPorDia(e.target.value)}
                    required
                    min={1}
                    max={24}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="8"
                  />
                  {fieldErrors.horasPorDia && <p className="text-red-600 text-xs mt-1">{fieldErrors.horasPorDia}</p>}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre del proyecto</label>
                <input
                  type="text"
                  value={nombreProyecto}
                  onChange={e => setNombreProyecto(e.target.value)}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Ej: Rediseño web para Cliente X"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Presupuesto (CLP)</label>
                  <input
                    type="number"
                    value={presupuesto}
                    onChange={e => setPresupuesto(e.target.value)}
                    required
                    min={0}
                    max={100000000}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="1000000"
                  />
                  {fieldErrors.presupuesto && <p className="text-red-600 text-xs mt-1">{fieldErrors.presupuesto}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Horas estimadas</label>
                  <input
                    type="number"
                    value={horasEstimadas}
                    onChange={e => setHorasEstimadas(e.target.value)}
                    required
                    min={1}
                    max={1000}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="40"
                  />
                  {fieldErrors.horasEstimadas && <p className="text-red-600 text-xs mt-1">{fieldErrors.horasEstimadas}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Gastos del proyecto (CLP)</label>
                  <input
                    type="number"
                    value={gastosProyecto}
                    onChange={e => setGastosProyecto(e.target.value)}
                    required
                    min={0}
                    max={10000000}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="50000"
                  />
                  {fieldErrors.gastosProyecto && <p className="text-red-600 text-xs mt-1">{fieldErrors.gastosProyecto}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Duración estimada (días)</label>
                  <input
                    type="number"
                    value={duracion}
                    onChange={e => setDuracion(e.target.value)}
                    required
                    min={1}
                    max={365}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="30"
                  />
                  {fieldErrors.duracion && <p className="text-red-600 text-xs mt-1">{fieldErrors.duracion}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Entregables</label>
                  <input
                    type="number"
                    value={entregables}
                    onChange={e => setEntregables(e.target.value)}
                    required
                    min={1}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="2"
                  />
                  {fieldErrors.entregables && <p className="text-red-600 text-xs mt-1">{fieldErrors.entregables}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Revisiones incluidas</label>
                  <input
                    type="number"
                    value={revisiones}
                    onChange={e => setRevisiones(e.target.value)}
                    required
                    min={0}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="2"
                  />
                  {fieldErrors.revisiones && <p className="text-red-600 text-xs mt-1">{fieldErrors.revisiones}</p>}
                </div>
              </div>
            </>
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