'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerHistorialCalculos, obtenerEstadisticasCalculos, toggleFavorito, CalculoDB } from '@/lib/supabase';
import { formatearCLP } from '@/lib/calculos';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useRouter, useSearchParams } from 'next/navigation';
import RemindersWidget from '@/components/RemindersWidget';
import TemplatesWidget from '@/components/TemplatesWidget';
import DolarLiveWidget from '@/components/DolarLiveWidget';
import { supabase } from '@/lib/supabase-config';

interface Estadisticas {
  totalCalculos: number;
  favoritos: number;
  esteMes: number;
  promedioTarifaHora: number;
  promedioProyecto: number;
  modoMasUsado: string;
  rubroMasUsado: string;
  experienciaPromedio: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [calculos, setCalculos] = useState<CalculoDB[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [user]);

  useEffect(() => {
    // Mostrar mensaje de bienvenida si viene del login
    if (searchParams.get('login') === 'success') {
      setShowWelcomeMessage(true);
      // Limpiar el parámetro de la URL
      router.replace('/dashboard');
      // Ocultar el mensaje después de 5 segundos
      setTimeout(() => setShowWelcomeMessage(false), 5000);
    }
  }, [searchParams, router]);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Cargar datos en paralelo
      const [calculosData, estadisticasData] = await Promise.all([
        obtenerHistorialCalculos(),
        cargarEstadisticas()
      ]);
      
      setCalculos(calculosData.slice(0, 5)); // Solo los 5 más recientes
      setEstadisticas(estadisticasData);
    } catch (err) {
      setError('Error al cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarEstadisticas = async (): Promise<Estadisticas | null> => {
    try {
      const { data: calculos, error } = await supabase
        .from('calculos')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      const totalCalculos = calculos?.length || 0;
      const favoritos = calculos?.filter(c => c.favorito).length || 0;
      const ahora = new Date();
      const esteMes = calculos?.filter(c => {
        const fecha = new Date(c.created_at);
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      }).length || 0;

      // Separar cálculos por modo
      const calculosPorHora = calculos?.filter(c => c.modo === 'tarifa_hora' && c.result?.tarifaHora) || [];
      const calculosProyecto = calculos?.filter(c => c.modo === 'simular_proyecto' && c.result?.ingresosNetos) || [];
      
      const promedioTarifaHora = calculosPorHora.length > 0
        ? calculosPorHora.reduce((sum, c) => sum + (c.result?.tarifaHora || 0), 0) / calculosPorHora.length
        : 0;
      
      const promedioProyecto = calculosProyecto.length > 0
        ? calculosProyecto.reduce((sum, c) => sum + (c.result?.ingresosNetos || 0), 0) / calculosProyecto.length
        : 0;

      // Determinar modo más usado
      const modoCounts = calculos?.reduce((acc, c) => {
        const modo = c.modo || 'tarifa_hora';
        acc[modo] = (acc[modo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      const modoMasUsado = Object.keys(modoCounts).reduce((a, b) => modoCounts[a] > modoCounts[b] ? a : b, 'tarifa_hora');

      // Determinar rubro más usado
      const rubroCounts = calculos?.reduce((acc, c) => {
        const rubro = c.rubro || 'Desarrollo Web';
        acc[rubro] = (acc[rubro] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      const rubroMasUsado = Object.keys(rubroCounts).reduce((a, b) => rubroCounts[a] > rubroCounts[b] ? a : b, 'Desarrollo Web');

      // Determinar experiencia promedio
      const experiencias = calculos?.map(c => c.experiencia).filter(Boolean) || [];
      const experienciaPromedio = experiencias.length > 0 ? experiencias[0] : '3-5 años';

      return {
        totalCalculos,
        favoritos,
        esteMes,
        promedioTarifaHora,
        promedioProyecto,
        modoMasUsado: modoMasUsado === 'tarifa_hora' ? 'Tarifa por Hora' : 'Simular Proyecto',
        rubroMasUsado,
        experienciaPromedio
      };
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      return null;
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggleFavorito = async (id: string, favorito: boolean) => {
    try {
      await toggleFavorito(id, favorito);
      // Actualizar el estado local
      setCalculos(prev => prev.map(calculo => 
        calculo.id === id ? { ...calculo, favorito } : calculo
      ));
      // Recargar estadísticas para actualizar el contador de favoritos
      const estadisticasData = await cargarEstadisticas();
      setEstadisticas(estadisticasData);
    } catch (err) {
      console.error('Error al actualizar favorito:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      <Sidebar />
      
      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">Bienvenido de vuelta, {user?.user_metadata?.full_name || user?.email}</p>
            </div>
            <Link
              href="/calculadora"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Cálculo
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="p-6">
          {/* Mensaje de bienvenida */}
          {showWelcomeMessage && (
            <div className="mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 transition-colors">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800 dark:text-green-200 transition-colors">
                    ¡Bienvenido! Tu sesión se ha iniciado correctamente.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 transition-colors">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 dark:text-red-200 transition-colors">{error}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Total Cálculos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{estadisticas.totalCalculos}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Favoritos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{estadisticas.favoritos}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Este Mes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{estadisticas.esteMes}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Promedio/Hora</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                      {estadisticas.promedioTarifaHora > 0 ? formatearCLP(estadisticas.promedioTarifaHora) : 'N/A'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Calculations */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">Cálculos Recientes</h2>
                    <Link
                      href="/dashboard/historial"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Ver todos
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : calculos.length > 0 ? (
                    <div className="space-y-4">
                      {calculos.map((calculo) => (
                        <div key={calculo.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium text-gray-900 dark:text-white transition-colors">
                                {calculo.titulo || `${calculo.modo === 'tarifa_hora' ? 'Tarifa por Hora' : 'Simulación de Proyecto'}`}
                              </h3>
                              {calculo.favorito && (
                                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                              {calculo.modo === 'tarifa_hora' 
                                ? `Tarifa: ${formatearCLP(calculo.result?.tarifaHora || 0)}/hora`
                                : `Ingresos: ${formatearCLP(calculo.result?.ingresosNetos || 0)}`
                              }
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 transition-colors">
                              {formatearFecha(calculo.created_at || '')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleFavorito(calculo.id || '', !calculo.favorito)}
                              className={`p-2 rounded-lg transition-colors ${
                                calculo.favorito 
                                  ? 'text-red-500 hover:text-red-600' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                            >
                              <svg className="w-4 h-4" fill={calculo.favorito ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                            <Link
                              href={`/dashboard/calculo/${calculo.id || ''}`}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400 transition-colors">No hay cálculos recientes</p>
                      <Link
                        href="/calculadora"
                        className="mt-2 inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Hacer tu primer cálculo
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Widgets Column */}
            <div className="space-y-6">
              <DolarLiveWidget />
              <RemindersWidget />
              <TemplatesWidget />
            </div>
          </div>

          {/* Insights Section */}
          {estadisticas && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">Insights de tu Actividad</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Modo más usado</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">{estadisticas.modoMasUsado}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Rubro principal</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">{estadisticas.rubroMasUsado}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Experiencia</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">{estadisticas.experienciaPromedio}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 