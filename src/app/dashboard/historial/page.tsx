'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-config';
import Sidebar from '@/components/Sidebar';
import { formatearCLP } from '@/lib/calculos';
import Link from 'next/link';
import ResumenFlujoIngresos from '@/components/ResumenFlujoIngresos';

interface Calculo {
  id: string;
  titulo: string;
  modo: 'tarifa_hora' | 'simular_proyecto';
  inputs: {
    ingresosDeseados: number;
    diasTrabajados: number;
    horasPorDia: number;
    gastosFijos: number;
  };
  proyecto?: {
    nombre: string;
    descripcion: string;
    duracion: string;
    horasTotales: string;
    entregables: string;
    revisiones: string;
    tipoCliente: string;
    presupuesto: string;
  };
  result: {
    tarifaHora: number;
    tarifaProyecto: number;
    ingresosNetos: number;
    desglose: {
      iva: number;
      retencion: number;
      cotizacionSalud: number;
      gastosFijos: number;
    };
    proyecto?: {
      precioRecomendado: number;
      ganancia: number;
      rentabilidad: number;
      tarifaHoraNecesaria: number;
      horasTotales: number;
    };
  };
  created_at: string;
  favorito: boolean;
}

export default function HistorialPage() {
  const { user } = useAuth();
  const [calculos, setCalculos] = useState<Calculo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      cargarHistorial();
    }
  }, [user]);

  const cargarHistorial = async () => {
    try {
      const { data, error } = await supabase
        .from('calculos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalculos(data || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorito = async (id: string, favoritoActual: boolean) => {
    try {
      const { error } = await supabase
        .from('calculos')
        .update({ favorito: !favoritoActual })
        .eq('id', id);

      if (error) throw error;
      cargarHistorial(); // Recargar para actualizar la UI
    } catch (error) {
      console.error('Error actualizando favorito:', error);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Historial de Cálculos
          </h1>
          <p className="text-gray-600">
            Revisa todos tus cálculos anteriores y encuentra inspiración para nuevas cotizaciones
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de cálculos</p>
                <p className="text-2xl font-bold text-gray-900">{calculos.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favoritos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculos.filter(c => c.favorito).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Este mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculos.filter(c => {
                    const fecha = new Date(c.created_at);
                    const ahora = new Date();
                    return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de cálculos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Todos los cálculos</h2>
          </div>
          
          {calculos.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cálculos aún</h3>
              <p className="text-gray-600 mb-6">Comienza creando tu primer cálculo para verlo aquí</p>
              <Link
                href="/calculadora"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear cálculo
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {calculos.map((calculo) => (
                <div key={calculo.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {calculo.titulo || 'Cálculo sin título'}
                        </h3>
                        {calculo.favorito && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Favorito
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          calculo.modo === 'tarifa_hora' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {calculo.modo === 'tarifa_hora' ? 'Tarifa por hora' : 'Simular proyecto'}
                        </span>
                      </div>
                      
                      {/* Información del proyecto si es modo proyecto */}
                      {calculo.modo === 'simular_proyecto' && calculo.proyecto && (
                        <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-green-800">Proyecto: {calculo.proyecto.nombre}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-green-700">
                            <span>Duración: {calculo.proyecto.duracion} días</span>
                            <span>Horas: {calculo.proyecto.horasTotales}h</span>
                            <span>Entregables: {calculo.proyecto.entregables}</span>
                            <span>Revisiones: {calculo.proyecto.revisiones}</span>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500 mb-3">
                        {formatearFecha(calculo.created_at)}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Tarifa por hora</p>
                          <p className="font-semibold text-gray-900">
                            {calculo.result && typeof calculo.result.tarifaHora === 'number' ? formatearCLP(calculo.result.tarifaHora) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {calculo.modo === 'simular_proyecto' && calculo.proyecto 
                              ? `Tarifa por proyecto (${calculo.proyecto.horasTotales}h)` 
                              : 'Tarifa por proyecto (40h)'}
                          </p>
                          <p className="font-semibold text-gray-900">
                            {calculo.result && typeof calculo.result.tarifaProyecto === 'number' ? formatearCLP(calculo.result.tarifaProyecto) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Ingresos netos</p>
                          <p className="font-semibold text-green-600">
                            {calculo.result && typeof calculo.result.ingresosNetos === 'number' ? formatearCLP(calculo.result.ingresosNetos) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <button
                        onClick={() => toggleFavorito(calculo.id, calculo.favorito)}
                        className={`p-2 rounded-lg transition-colors ${
                          calculo.favorito 
                            ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                        }`}
                      >
                        <svg className="w-5 h-5" fill={calculo.favorito ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      
                      <Link
                        href={`/dashboard/calculo/${calculo.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Ver detalles
                      </Link>
                    </div>
                  </div>
                  <ResumenFlujoIngresos
                    ingresosNetos={calculo.result.ingresosNetos}
                    desglose={calculo.result.desglose}
                    modoProyecto={calculo.modo === 'simular_proyecto'}
                    ingresoBrutoOverride={calculo.modo === 'simular_proyecto' ? calculo.result.tarifaProyecto : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 