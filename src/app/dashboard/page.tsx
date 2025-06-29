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
      const calculosPorHora = calculos?.filter(c => c.modo === 'hora' && c.resultado?.tarifaHora) || [];
      const calculosProyecto = calculos?.filter(c => c.modo === 'proyecto' && c.resultado?.ingresosNetos) || [];
      
      const promedioTarifaHora = calculosPorHora.length > 0
        ? calculosPorHora.reduce((sum, c) => sum + c.resultado.tarifaHora, 0) / calculosPorHora.length
        : 0;
      
      const promedioProyecto = calculosProyecto.length > 0
        ? calculosProyecto.reduce((sum, c) => sum + c.resultado.ingresosNetos, 0) / calculosProyecto.length
        : 0;

      // Determinar modo más usado
      const modoCounts = calculos?.reduce((acc, c) => {
        acc[c.modo || 'hora'] = (acc[c.modo || 'hora'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      const modoMasUsado = Object.keys(modoCounts).reduce((a, b) => modoCounts[a] > modoCounts[b] ? a : b, 'hora');

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
        modoMasUsado: modoMasUsado === 'hora' ? 'Tarifa por Hora' : 'Simular Proyecto',
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Bienvenido de vuelta, {user?.user_metadata?.full_name || user?.email}</p>
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
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">¡Bienvenido de vuelta!</h3>
                  <p className="text-green-700">Has iniciado sesión exitosamente. ¿Qué te gustaría calcular hoy?</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          {!isLoading && !error && estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {estadisticas.totalCalculos}
                    </p>
                    <p className="text-sm text-gray-600">
                      Cálculos Totales
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatearCLP(estadisticas.promedioTarifaHora)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Tarifa Promedio
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatearCLP(estadisticas.promedioProyecto)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Tarifa Máxima
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {estadisticas.favoritos}
                    </p>
                    <p className="text-sm text-gray-600">
                      Favoritos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando dashboard...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recordatorios Widget */}
            <RemindersWidget maxItems={3} />
            
            {/* Templates Widget */}
            <TemplatesWidget maxItems={3} showRecommended={true} />
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link
              href="/calculadora"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Nuevo Cálculo</h3>
                  <p className="text-sm text-gray-600">Calcular tarifa o proyecto</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/historial"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Historial</h3>
                  <p className="text-sm text-gray-600">Ver cálculos anteriores</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/favoritos"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Favoritos</h3>
                  <p className="text-sm text-gray-600">Cálculos guardados</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/perfil"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mi Perfil</h3>
                  <p className="text-sm text-gray-600">Configurar preferencias</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Promedios por modo */}
          {!isLoading && !error && estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Promedio Tarifa por Hora</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-2">{formatearCLP(estadisticas.promedioTarifaHora)}</p>
                <p className="text-sm text-gray-500">Basado en tus cálculos de tarifa por hora</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Promedio por Proyecto</h3>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-2">{formatearCLP(estadisticas.promedioProyecto)}</p>
                <p className="text-sm text-gray-500">Ingresos netos promedio por proyecto</p>
              </div>
            </div>
          )}

          {/* Consejos rápidos */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Consejos para freelancers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Actualiza tus preferencias</strong> en tu perfil para obtener recomendaciones más precisas.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Guarda tus cálculos favoritos</strong> para acceder rápidamente a ellos más tarde.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Revisa tu historial</strong> para analizar tendencias en tus tarifas y proyectos.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Considera ambos modos</strong> de cálculo para diferentes tipos de proyectos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 