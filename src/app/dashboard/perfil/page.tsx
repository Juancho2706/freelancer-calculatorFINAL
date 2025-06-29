'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-config';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

interface UserStats {
  totalCalculos: number;
  favoritos: number;
  esteMes: number;
  promedioTarifaHora: number;
  promedioProyecto: number;
  modoMasUsado: string;
  rubroMasUsado: string;
  experienciaPromedio: string;
}

interface UserPreferences {
  rubro: string;
  experiencia: string;
}

export default function PerfilPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    totalCalculos: 0,
    favoritos: 0,
    esteMes: 0,
    promedioTarifaHora: 0,
    promedioProyecto: 0,
    modoMasUsado: 'Tarifa por Hora',
    rubroMasUsado: 'Desarrollo Web',
    experienciaPromedio: '3-5 años'
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    rubro: 'Desarrollo Web',
    experiencia: '3-5 años'
  });
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    if (user) {
      cargarEstadisticas();
      cargarPreferencias();
    }
  }, [user]);

  const cargarEstadisticas = async () => {
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

      setStats({
        totalCalculos,
        favoritos,
        esteMes,
        promedioTarifaHora,
        promedioProyecto,
        modoMasUsado: modoMasUsado === 'hora' ? 'Tarifa por Hora' : 'Simular Proyecto',
        rubroMasUsado,
        experienciaPromedio
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarPreferencias = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data && !error) {
        setPreferences({
          rubro: data.rubro || 'Desarrollo Web',
          experiencia: data.experiencia || '3-5 años'
        });
      }
    } catch (error) {
      console.error('Error cargando preferencias:', error);
    }
  };

  const guardarPreferencias = async () => {
    setSavingPreferences(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          rubro: preferences.rubro,
          experiencia: preferences.experiencia,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error guardando preferencias:', error);
    } finally {
      setSavingPreferences(false);
    }
  };

  const formatearCLP = (valor: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-gray-200 rounded-2xl"></div>
              <div className="h-64 bg-gray-200 rounded-2xl"></div>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu cuenta, preferencias y revisa tus estadísticas de uso</p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total cálculos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCalculos}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.favoritos}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.esteMes}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Modo preferido</p>
                <p className="text-lg font-bold text-gray-900">{stats.modoMasUsado}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Promedios por modo */}
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
            <p className="text-3xl font-bold text-blue-600 mb-2">{formatearCLP(stats.promedioTarifaHora)}</p>
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
            <p className="text-3xl font-bold text-green-600 mb-2">{formatearCLP(stats.promedioProyecto)}</p>
            <p className="text-sm text-gray-500">Ingresos netos promedio por proyecto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información de la cuenta */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información de la cuenta</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user?.user_metadata?.full_name || 'Usuario'}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Miembro desde</p>
                    <p className="text-gray-900">{user?.created_at ? formatearFecha(user.created_at) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Último acceso</p>
                    <p className="text-gray-900">{user?.last_sign_in_at ? formatearFecha(user.last_sign_in_at) : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferencias de cálculo */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferencias de cálculo</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rubro principal
                  <span className="ml-1 text-gray-400" title="Este rubro se usa para las recomendaciones de tarifas del mercado">ⓘ</span>
                </label>
                <select
                  value={preferences.rubro}
                  onChange={(e) => setPreferences({...preferences, rubro: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Desarrollo Web">Desarrollo Web</option>
                  <option value="Diseño Gráfico">Diseño Gráfico</option>
                  <option value="Marketing Digital">Marketing Digital</option>
                  <option value="Redacción">Redacción</option>
                  <option value="Traducción">Traducción</option>
                  <option value="Consultoría">Consultoría</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Años de experiencia
                  <span className="ml-1 text-gray-400" title="Tu nivel de experiencia afecta las recomendaciones de tarifas">ⓘ</span>
                </label>
                <select
                  value={preferences.experiencia}
                  onChange={(e) => setPreferences({...preferences, experiencia: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0-1 años">0-1 años</option>
                  <option value="1-3 años">1-3 años</option>
                  <option value="3-5 años">3-5 años</option>
                  <option value="5-10 años">5-10 años</option>
                  <option value="10+ años">10+ años</option>
                </select>
              </div>

              <button
                onClick={guardarPreferencias}
                disabled={savingPreferences}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
              >
                {savingPreferences ? 'Guardando...' : 'Guardar preferencias'}
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Estadísticas adicionales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 mb-2">{stats.rubroMasUsado}</div>
              <p className="text-sm text-gray-600">Rubro más usado</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600 mb-2">{stats.experienciaPromedio}</div>
              <p className="text-sm text-gray-600">Experiencia promedio</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 mb-2">{Math.round((stats.favoritos / Math.max(stats.totalCalculos, 1)) * 100)}%</div>
              <p className="text-sm text-gray-600">Cálculos favoritos</p>
            </div>
          </div>
        </div>

        {/* Botón cerrar sesión */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
} 