'use client';

import { useState, useEffect } from 'react';
import { DatosCalculo, calcularTarifa, formatearCLP, validarDatosCalculo, ResultadoCalculo } from '@/lib/calculos';
import { VALORES_DEFAULT, MENSAJES } from '@/utils/constants';
import { guardarCalculo } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Resultado from './Resultado';
import { Tooltip } from 'react-tooltip';

interface ErroresValidacion {
  ingresosDeseados?: string;
  diasTrabajados?: string;
  horasPorDia?: string;
  gastosFijos?: string;
  titulo?: string;
}

interface DatosCalculoConTitulo extends DatosCalculo {
  titulo: string;
}

const RUBROS = [
  { value: 'diseño', label: 'Diseño' },
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'redaccion', label: 'Redacción' },
  { value: 'consultoria', label: 'Consultoría' },
  { value: 'otro', label: 'Otro' },
];
const EXPERIENCIAS = [
  { value: 'junior', label: 'Junior' },
  { value: 'semi', label: 'Semi Senior' },
  { value: 'senior', label: 'Senior' },
];
const CLIENTES = [
  { value: 'pyme', label: 'PyME' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'particular', label: 'Particular' },
  { value: 'agencia', label: 'Agencia' },
];

export default function FormularioCalculadora() {
  const { user } = useAuth();
  const [datos, setDatos] = useState<DatosCalculoConTitulo>({
    ingresosDeseados: VALORES_DEFAULT.INGRESOS_DESEADOS,
    diasTrabajados: VALORES_DEFAULT.DIAS_TRABAJADOS,
    horasPorDia: VALORES_DEFAULT.HORAS_POR_DIA,
    gastosFijos: VALORES_DEFAULT.GASTOS_FIJOS,
    titulo: '',
  });

  const [errores, setErrores] = useState<ErroresValidacion>({});
  const [erroresProyecto, setErroresProyecto] = useState<{[key: string]: string}>({});
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [isCalculando, setIsCalculando] = useState(false);
  const [isGuardando, setIsGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string>('');
  const [modoProyecto, setModoProyecto] = useState(false);
  const [proyecto, setProyecto] = useState({
    nombre: '',
    descripcion: '',
    duracion: '',
    horasTotales: '',
    entregables: '',
    revisiones: '',
    tipoCliente: '',
    presupuesto: '',
  });
  const [rubro, setRubro] = useState('diseño');
  const [experiencia, setExperiencia] = useState('junior');

  // Validación en tiempo real
  const validarCampo = (campo: keyof typeof datos, valor: any): string | undefined => {
    if (campo === 'titulo') {
      if (!valor || valor.trim().length < 3) return 'El título debe tener al menos 3 caracteres';
    }
    switch (campo) {
      case 'ingresosDeseados':
        if (valor <= 0) return MENSAJES.ERROR.INGRESOS_INVALIDOS;
        if (valor > 100000000) return 'Los ingresos no pueden superar los 100 millones CLP';
        break;
      
      case 'diasTrabajados':
        if (valor <= 0 || valor > 31) return MENSAJES.ERROR.DIAS_INVALIDOS;
        break;
      
      case 'horasPorDia':
        if (valor <= 0 || valor > 24) return MENSAJES.ERROR.HORAS_INVALIDAS;
        break;
      
      case 'gastosFijos':
        if (valor < 0) return MENSAJES.ERROR.GASTOS_INVALIDOS;
        if (valor > 10000000) return 'Los gastos fijos no pueden superar los 10 millones CLP';
        break;
    }
    return undefined;
  };

  // Validación específica para campos del proyecto
  const validarCampoProyecto = (campo: string, valor: any): string | undefined => {
    switch (campo) {
      case 'nombre':
        if (!valor || valor.trim().length < 3) return 'El nombre del proyecto debe tener al menos 3 caracteres';
        break;
      case 'horasTotales':
        if (!valor || Number(valor) <= 0) return 'Las horas totales deben ser mayores a 0';
        if (Number(valor) > 1000) return 'Las horas totales no pueden superar las 1000 horas';
        break;
      case 'duracion':
        if (!valor || Number(valor) <= 0) return 'La duración debe ser mayor a 0 días';
        if (Number(valor) > 365) return 'La duración no puede superar los 365 días';
        break;
      case 'entregables':
        if (!valor || Number(valor) <= 0) return 'El número de entregables debe ser mayor a 0';
        break;
      case 'revisiones':
        if (valor && Number(valor) < 0) return 'Las revisiones no pueden ser negativas';
        break;
      case 'presupuesto':
        if (valor && Number(valor) < 0) return 'El presupuesto no puede ser negativo';
        if (valor && Number(valor) > 100000000) return 'El presupuesto no puede superar los 100 millones CLP';
        break;
    }
    return undefined;
  };

  const handleInputChange = (campo: keyof typeof datos, valor: any) => {
    const nuevoDatos = {
      ...datos,
      [campo]: valor,
    };
    
    setDatos(nuevoDatos);
    
    // Validar el campo específico
    const error = validarCampo(campo, valor);
    setErrores(prev => ({
      ...prev,
      [campo]: error,
    }));
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: ErroresValidacion = {};
    let esValido = true;

    // Validar campos básicos
    Object.keys(datos).forEach((campo) => {
      const error = validarCampo(campo as keyof typeof datos, datos[campo as keyof typeof datos]);
      if (error) {
        nuevosErrores[campo as keyof typeof datos] = error;
        esValido = false;
      }
    });

    // Validar campos del proyecto si está en modo proyecto
    if (modoProyecto) {
      const camposProyecto = ['nombre', 'horasTotales', 'duracion', 'entregables'];
      camposProyecto.forEach((campo) => {
        const error = validarCampoProyecto(campo, proyecto[campo as keyof typeof proyecto]);
        if (error) {
          // Agregar error al estado de errores del proyecto
          setErroresProyecto(prev => ({
            ...prev,
            [campo]: error,
          }));
          esValido = false;
        }
      });
    }

    setErrores(nuevosErrores);
    return esValido;
  };

  // NUEVO: función para calcular según modo
  const calcularResultado = () => {
    if (!modoProyecto) {
      // Modo tarifa por hora normal - cálculo mensual
      return calcularTarifa(datos);
    } else {
      // Modo proyecto - cálculo de rentabilidad y desglose real
      const horasTotales = Number(proyecto.horasTotales) || 1;
      const presupuestoProyecto = Number(proyecto.presupuesto) || 0;
      const resultadoBase = calcularTarifa(datos);
      const tarifaHoraNecesaria = resultadoBase.tarifaHora;
      const precioRecomendado = Math.round(tarifaHoraNecesaria * horasTotales);
      // Usar presupuesto si existe, si no, recomendado
      const montoProyecto = presupuestoProyecto > 0 ? presupuestoProyecto : precioRecomendado;
      // Calcular impuestos y gastos sobre el monto del proyecto
      const iva = Math.round(montoProyecto * 0.19);
      const retencion = Math.round(montoProyecto * 0.1375);
      const cotizacionSalud = Math.round(montoProyecto * 0.07);
      const gastosFijos = datos.gastosFijos;
      const totalImpuestosYGastos = iva + retencion + cotizacionSalud + gastosFijos;
      const ingresosNetos = montoProyecto - totalImpuestosYGastos;
      // Rentabilidad
      const ganancia = presupuestoProyecto > 0 ? presupuestoProyecto - precioRecomendado : 0;
      const rentabilidad = presupuestoProyecto > 0 ? (ganancia / presupuestoProyecto) * 100 : 0;
      const tarifaHoraEfectiva = presupuestoProyecto > 0 ? presupuestoProyecto / horasTotales : tarifaHoraNecesaria;
      return {
        tarifaHora: Math.round(tarifaHoraEfectiva),
        tarifaProyecto: montoProyecto,
        ingresosNetos: ingresosNetos,
        desglose: {
          iva,
          retencion,
          cotizacionSalud,
          gastosFijos,
        },
        proyecto: {
          precioRecomendado,
          ganancia,
          rentabilidad,
          tarifaHoraNecesaria,
          horasTotales,
        }
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setIsCalculando(true);
    setMensajeGuardado('');
    
    try {
      // Simular un pequeño delay para mejor UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Usar la nueva función diferenciada según el modo
      const resultadoCalculo = calcularResultado();
      setResultado(resultadoCalculo);
      
      // Guardar en Supabase solo si el usuario está autenticado
      if (user) {
        setIsGuardando(true);
        await guardarCalculo({
          modo: modoProyecto ? 'simular_proyecto' : 'tarifa_hora',
          inputs: {
            ingresosDeseados: datos.ingresosDeseados,
            diasTrabajados: datos.diasTrabajados,
            horasPorDia: datos.horasPorDia,
            gastosFijos: datos.gastosFijos,
          },
          proyecto: modoProyecto ? proyecto : undefined,
          result: resultadoCalculo,
          titulo: datos.titulo,
        });
        
        setMensajeGuardado('✅ Cálculo guardado exitosamente');
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setMensajeGuardado('');
        }, 3000);
      } else {
        setMensajeGuardado('💡 Inicia sesión para guardar tus cálculos automáticamente');
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => {
          setMensajeGuardado('');
        }, 5000);
      }
      
    } catch (error) {
      console.error('Error al calcular o guardar:', error);
      setMensajeGuardado('⚠️ Error al guardar el cálculo');
      
      // Limpiar mensaje de error después de 5 segundos
      setTimeout(() => {
        setMensajeGuardado('');
      }, 5000);
    } finally {
      setIsCalculando(false);
      setIsGuardando(false);
    }
  };

  // Limpiar resultado cuando cambie el modo
  const handleModoChange = (nuevoModo: boolean) => {
    setModoProyecto(nuevoModo);
    setResultado(null); // Limpiar resultado anterior
    setErroresProyecto({}); // Limpiar errores del proyecto
  };

  // Manejar cambios en campos del proyecto con validación
  const handleProyectoChange = (campo: keyof typeof proyecto, valor: any) => {
    const nuevoProyecto = {
      ...proyecto,
      [campo]: valor,
    };
    
    setProyecto(nuevoProyecto);
    
    // Validar el campo específico del proyecto
    const error = validarCampoProyecto(campo, valor);
    if (error) {
      setErroresProyecto(prev => ({
        ...prev,
        [campo]: error,
      }));
    } else {
      setErroresProyecto(prev => {
        const nuevosErrores = { ...prev };
        delete nuevosErrores[campo];
        return nuevosErrores;
      });
    }
  };

  // Determinar si hay errores reales (solo si hay mensajes de error activos)
  const hayErrores = Object.values(errores).some(Boolean);
  const hayErroresProyecto = Object.values(erroresProyecto).some(Boolean);
  
  // Validar campos del proyecto si está en modo proyecto
  const proyectoValido = !modoProyecto || (
    proyecto.nombre.trim().length >= 3 &&
    Number(proyecto.horasTotales) > 0 &&
    Number(proyecto.duracion) > 0 &&
    Number(proyecto.entregables) > 0
    // presupuesto es opcional
  );
  
  const formularioValido = !hayErrores && 
    !hayErroresProyecto &&
    datos.ingresosDeseados > 0 && 
    datos.diasTrabajados > 0 && 
    datos.horasPorDia > 0 && 
    datos.gastosFijos >= 0 &&
    datos.titulo.trim().length >= 3 &&
    proyectoValido;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Toggle modo */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex rounded-full bg-blue-50 border-2 border-blue-200 shadow-sm overflow-hidden">
          <button
            type="button"
            className={`px-6 py-3 font-semibold text-base flex items-center gap-2 transition-all duration-150 focus:outline-none ${!modoProyecto ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-700 hover:bg-blue-100'}`}
            onClick={() => handleModoChange(false)}
          >
            Tarifa por Hora
            <span className="ml-1" data-tooltip-id="tip-tarifa-hora">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#3B82F6"/><text x="10" y="15" textAnchor="middle" fontSize="13" fill="white">i</text></svg>
            </span>
          </button>
          <button
            type="button"
            className={`px-6 py-3 font-semibold text-base flex items-center gap-2 transition-all duration-150 focus:outline-none ${modoProyecto ? 'bg-green-600 text-white shadow-lg' : 'text-green-700 hover:bg-green-100'}`}
            onClick={() => handleModoChange(true)}
          >
            Simulador de Proyecto
            <span className="ml-1" data-tooltip-id="tip-sim-proyecto">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#3B82F6"/><text x="10" y="15" textAnchor="middle" fontSize="13" fill="white">i</text></svg>
            </span>
          </button>
        </div>
        <Tooltip id="tip-tarifa-hora" place="bottom" content="Calcula la tarifa mínima por hora que necesitas para alcanzar tus objetivos mensuales." />
        <Tooltip id="tip-sim-proyecto" place="bottom" content="Simula la rentabilidad de un proyecto específico, considerando presupuesto, horas y gastos." />
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        {/* Rubro y experiencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="rubro" className="block text-sm font-semibold text-gray-700 flex items-center">
              Rubro
              <span className="ml-1 cursor-pointer" data-tooltip-id="rubro-tip">?</span>
            </label>
            <select id="rubro" value={rubro} onChange={e => setRubro(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-gray-900">
              {RUBROS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <Tooltip id="rubro-tip" place="right" content="Selecciona el área profesional para mostrar recomendaciones de tarifas según el mercado." />
          </div>
          <div>
            <label htmlFor="experiencia" className="block text-sm font-semibold text-gray-700 flex items-center">
              Experiencia
              <span className="ml-1 cursor-pointer" data-tooltip-id="exp-tip">?</span>
            </label>
            <select id="experiencia" value={experiencia} onChange={e => setExperiencia(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-gray-900">
              {EXPERIENCIAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
            <Tooltip id="exp-tip" place="right" content="Selecciona tu nivel de experiencia para ajustar las recomendaciones de tarifas." />
          </div>
        </div>
        {/* Inputs principales y modo proyecto */}
        {!modoProyecto ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Ingresos Deseados */}
            <div>
              <label htmlFor="ingresos" className="block text-sm font-semibold text-gray-700 flex items-center">
                Ingresos deseados
                <span className="ml-1 cursor-pointer" data-tooltip-id="ingresos-tip">?</span>
              </label>
              <input type="number" id="ingresos" value={datos.ingresosDeseados} onChange={e => handleInputChange('ingresosDeseados', Number(e.target.value))} className="w-full pl-8 pr-4 py-4 border-2 rounded-2xl text-lg text-gray-900" placeholder="1500000" min="0" step="1000" />
              <Tooltip id="ingresos-tip" place="right" content="El monto total que deseas recibir al mes, antes de impuestos y descuentos." />
            </div>
            {/* Días trabajados */}
            <div>
              <label htmlFor="dias" className="block text-sm font-semibold text-gray-700 flex items-center">
                Días trabajados al mes
                <span className="ml-1 cursor-pointer" data-tooltip-id="dias-tip">?</span>
              </label>
              <input type="number" id="dias" value={datos.diasTrabajados} onChange={e => handleInputChange('diasTrabajados', Number(e.target.value))} className="w-full px-4 py-4 border-2 rounded-2xl text-lg text-gray-900" placeholder="20" min="1" max="31" />
              <Tooltip id="dias-tip" place="right" content="Cuántos días planeas trabajar al mes en promedio." />
            </div>
            {/* Horas por día */}
            <div>
              <label htmlFor="horas" className="block text-sm font-semibold text-gray-700 flex items-center">
                Horas trabajadas por día
                <span className="ml-1 cursor-pointer" data-tooltip-id="horas-tip">?</span>
              </label>
              <input type="number" id="horas" value={datos.horasPorDia} onChange={e => handleInputChange('horasPorDia', Number(e.target.value))} className="w-full px-4 py-4 border-2 rounded-2xl text-lg text-gray-900" placeholder="8" min="1" max="24" />
              <Tooltip id="horas-tip" place="right" content="Cuántas horas efectivas trabajas cada día." />
            </div>
            {/* Gastos fijos */}
            <div>
              <label htmlFor="gastos" className="block text-sm font-semibold text-gray-700 flex items-center">
                Gastos fijos mensuales (CLP)
                <span className="ml-1 cursor-pointer" data-tooltip-id="gastos-tip">?</span>
              </label>
              <input type="number" id="gastos" value={datos.gastosFijos} onChange={e => handleInputChange('gastosFijos', Number(e.target.value))} className="w-full pl-8 pr-4 py-4 border-2 rounded-2xl text-lg text-gray-900" placeholder="300000" min="0" step="1000" />
              <Tooltip id="gastos-tip" place="right" content="Suma de todos tus gastos mensuales fijos (arriendo, internet, software, etc.)." />
            </div>
            {/* Título del cálculo */}
            <div className="md:col-span-2">
              <label htmlFor="titulo" className="block text-sm font-semibold text-gray-700 flex items-center">
                Título del cálculo
                <span className="ml-1 cursor-pointer" data-tooltip-id="titulo-tip">?</span>
              </label>
              <input type="text" id="titulo" value={datos.titulo} onChange={e => handleInputChange('titulo', e.target.value)} className="w-full px-4 py-4 border-2 rounded-2xl text-lg text-gray-900" placeholder="Ej: Cotización para cliente X" minLength={3} maxLength={100} />
              <Tooltip id="titulo-tip" place="right" content="Ponle un nombre a este cálculo para identificarlo en tu historial." />
            </div>
          </div>
        ) : (
          <div className="space-y-6 mb-6">
            <div>
              <label htmlFor="nombre-proyecto" className="block text-sm font-semibold text-gray-700 flex items-center">
                Nombre del proyecto
                <span className="ml-1 cursor-pointer" data-tooltip-id="nombre-proy-tip">?</span>
              </label>
              <input 
                type="text" 
                id="nombre-proyecto" 
                value={proyecto.nombre} 
                onChange={e => handleProyectoChange('nombre', e.target.value)} 
                className={`w-full px-4 py-4 border-2 rounded-2xl text-lg text-gray-900 ${erroresProyecto.nombre ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Ej: Landing page para empresa X" 
              />
              {erroresProyecto.nombre && (
                <p className="text-red-600 text-sm mt-1">{erroresProyecto.nombre}</p>
              )}
              <Tooltip id="nombre-proy-tip" place="right" content="Nombre identificador del proyecto que vas a cotizar." />
            </div>
            <div>
              <label htmlFor="desc-proyecto" className="block text-sm font-semibold text-gray-700 flex items-center">
                Descripción breve
                <span className="ml-1 cursor-pointer" data-tooltip-id="desc-proy-tip">?</span>
              </label>
              <textarea id="desc-proyecto" value={proyecto.descripcion} onChange={e => handleProyectoChange('descripcion', e.target.value)} className="w-full px-4 py-4 border-2 rounded-2xl text-lg text-gray-900" placeholder="Describe brevemente el alcance del proyecto" rows={2} />
              <Tooltip id="desc-proy-tip" place="right" content="Describe en pocas palabras el objetivo y alcance del proyecto." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="duracion" className="block text-sm font-semibold text-gray-700 flex items-center">
                  Duración estimada (días)
                  <span className="ml-1 cursor-pointer" data-tooltip-id="duracion-tip">?</span>
                </label>
                <input 
                  type="number" 
                  id="duracion" 
                  value={proyecto.duracion} 
                  onChange={e => handleProyectoChange('duracion', e.target.value)} 
                  className={`w-full px-4 py-4 border-2 rounded-2xl text-lg text-gray-900 ${erroresProyecto.duracion ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="10" 
                  min="1" 
                />
                {erroresProyecto.duracion && (
                  <p className="text-red-600 text-sm mt-1">{erroresProyecto.duracion}</p>
                )}
                <Tooltip id="duracion-tip" place="right" content="Cuántos días estimas que durará el proyecto completo." />
              </div>
              <div>
                <label htmlFor="horas-totales" className="block text-sm font-semibold text-gray-700 flex items-center">
                  Total de horas estimadas
                  <span className="ml-1 cursor-pointer" data-tooltip-id="horas-tot-tip">?</span>
                </label>
                <input 
                  type="number" 
                  id="horas-totales" 
                  value={proyecto.horasTotales} 
                  onChange={e => handleProyectoChange('horasTotales', e.target.value)} 
                  className={`w-full px-4 py-4 border-2 rounded-2xl text-lg text-gray-900 ${erroresProyecto.horasTotales ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="40" 
                  min="1" 
                />
                {erroresProyecto.horasTotales && (
                  <p className="text-red-600 text-sm mt-1">{erroresProyecto.horasTotales}</p>
                )}
                <Tooltip id="horas-tot-tip" place="right" content="Cantidad total de horas que dedicarás al proyecto (incluye reuniones, revisiones, etc.)." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="entregables" className="block text-sm font-semibold text-gray-700 flex items-center">
                  Número de entregables
                  <span className="ml-1 cursor-pointer" data-tooltip-id="entregables-tip">?</span>
                </label>
                <input 
                  type="number" 
                  id="entregables" 
                  value={proyecto.entregables} 
                  onChange={e => handleProyectoChange('entregables', e.target.value)} 
                  className={`w-full px-4 py-4 border-2 rounded-2xl text-lg text-gray-900 ${erroresProyecto.entregables ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="2" 
                  min="1" 
                />
                {erroresProyecto.entregables && (
                  <p className="text-red-600 text-sm mt-1">{erroresProyecto.entregables}</p>
                )}
                <Tooltip id="entregables-tip" place="right" content="Cuántos entregables principales tendrá el proyecto (ej: páginas, piezas gráficas, etc.)." />
              </div>
              <div>
                <label htmlFor="revisiones" className="block text-sm font-semibold text-gray-700 flex items-center">
                  Revisiones incluidas
                  <span className="ml-1 cursor-pointer" data-tooltip-id="revisiones-tip">?</span>
                </label>
                <input type="number" id="revisiones" value={proyecto.revisiones} onChange={e => handleProyectoChange('revisiones', e.target.value)} className="w-full px-4 py-4 border-2 rounded-2xl text-lg text-gray-900" placeholder="2" min="0" />
                <Tooltip id="revisiones-tip" place="right" content="Cuántas rondas de revisiones están incluidas en el precio." />
              </div>
            </div>
            <div>
              <label htmlFor="tipo-cliente" className="block text-sm font-semibold text-gray-700 flex items-center">
                Tipo de cliente
                <span className="ml-1 cursor-pointer" data-tooltip-id="cliente-tip">?</span>
              </label>
              <select id="tipo-cliente" value={proyecto.tipoCliente} onChange={e => handleProyectoChange('tipoCliente', e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-gray-900">
                <option value="">Selecciona tipo de cliente</option>
                {CLIENTES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <Tooltip id="cliente-tip" place="right" content="Selecciona el tipo de cliente para ajustar la recomendación de tarifa." />
            </div>
            <div>
              <label htmlFor="presupuesto" className="block text-sm font-semibold text-gray-700 flex items-center">
                Presupuesto del proyecto (CLP)
                <span className="ml-1 cursor-pointer" data-tooltip-id="presupuesto-tip">?</span>
              </label>
              <input type="number" id="presupuesto" value={proyecto.presupuesto} onChange={e => handleProyectoChange('presupuesto', e.target.value)} className="w-full px-4 py-4 border-2 rounded-2xl text-lg text-gray-900" placeholder="1000000" min="0" step="1000" />
              <Tooltip id="presupuesto-tip" place="right" content="Monto total que esperas gastar en el proyecto." />
            </div>
          </div>
        )}
        {/* Botón calcular */}
        <div className="mt-8 flex justify-end">
          <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center justify-center disabled:opacity-50" disabled={isCalculando || isGuardando || !formularioValido}>
            {isCalculando ? 'Calculando...' : 'Calcular tarifa'}
          </button>
        </div>
        {/* Mensaje de guardado */}
        {mensajeGuardado && (
          <div className="mt-4 text-center text-green-700 font-medium animate-fade-in">
            {mensajeGuardado}
          </div>
        )}
      </form>
      {/* Resultado */}
      {resultado && (
        <Resultado resultado={resultado} datosOriginales={datos} rubro={rubro} experiencia={experiencia} modoProyecto={modoProyecto} proyecto={proyecto} />
      )}
    </div>
  );
} 