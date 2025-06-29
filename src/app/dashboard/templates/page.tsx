'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { CalculationTemplate } from '@/utils/types';
import { 
  getTemplates, 
  getFavoriteTemplates, 
  getUserTemplates,
  addTemplateToFavorites, 
  removeTemplateFromFavorites,
  getUserFavorites,
  incrementTemplateUsage,
  createCustomTemplate,
  deleteTemplate
} from '@/lib/templates';
import CreateTemplateModal from '@/components/CreateTemplateModal';

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<CalculationTemplate[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'my'>('all');
  const [filterRubro, setFilterRubro] = useState<string>('');
  const [filterModo, setFilterModo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user, activeTab, filterRubro, filterModo, searchTerm]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      let templatesData: CalculationTemplate[] = [];

      if (activeTab === 'all') {
        // Traer públicos y privados del usuario
        const [publicTemplates, userTemplates] = await Promise.all([
          getTemplates({
            rubro: filterRubro || undefined,
            modo: filterModo as 'hora' | 'proyecto' || undefined,
            search: searchTerm || undefined
          }),
          getUserTemplates()
        ]);
        // Unir y eliminar duplicados por id
        const allTemplates = [...publicTemplates, ...userTemplates.filter(ut => !publicTemplates.some(pt => pt.id === ut.id))];
        templatesData = allTemplates;
      } else {
        switch (activeTab) {
          case 'favorites':
            templatesData = await getFavoriteTemplates();
            break;
          case 'my':
            templatesData = await getUserTemplates();
            break;
          default:
            templatesData = await getTemplates({
              rubro: filterRubro || undefined,
              modo: filterModo as 'hora' | 'proyecto' || undefined,
              search: searchTerm || undefined
            });
        }
      }

      setTemplates(templatesData);

      // Cargar estado de favoritos de una vez
      const favoritesSet = await getUserFavorites();
      setFavorites(favoritesSet);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (templateId: string) => {
    try {
      if (favorites.has(templateId)) {
        await removeTemplateFromFavorites(templateId);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(templateId);
          return newSet;
        });
      } else {
        await addTemplateToFavorites(templateId);
        setFavorites(prev => new Set(prev).add(templateId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleUseTemplate = async (template: CalculationTemplate) => {
    try {
      await incrementTemplateUsage(template.id);
      
      // Redirect to calculator with template data
      const params = new URLSearchParams();
      Object.entries(template.config).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
      params.append('modo', template.modo);
      
      window.location.href = `/calculadora?${params.toString()}`;
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este template?')) {
      try {
        await deleteTemplate(templateId);
        loadTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const getModoIcon = (modo: string) => {
    if (modo === 'hora') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    }
  };

  const getRubroColor = (rubro: string) => {
    switch (rubro) {
      case 'Desarrollo Web': return 'bg-blue-100 text-blue-700';
      case 'Diseño Gráfico': return 'bg-purple-100 text-purple-700';
      case 'Marketing Digital': return 'bg-green-100 text-green-700';
      case 'Redacción': return 'bg-yellow-100 text-yellow-700';
      case 'Traducción': return 'bg-indigo-100 text-indigo-700';
      case 'Consultoría': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatConfig = (config: any) => {
    const entries = Object.entries(config);
    return entries.map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return `${label}: ${typeof value === 'number' ? value.toLocaleString('es-CL') : value}`;
    }).join(', ');
  };

  const handleCreateTemplate = async (templateData: Omit<CalculationTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => {
    try {
      await createCustomTemplate(templateData);
      setShowCreateModal(false);
      // Forzar recarga de templates y cambiar a la pestaña "Mis Templates"
      setActiveTab('my');
      await loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
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

  // Filtrar templates personalizados SOLO del usuario autenticado
  const myTemplates = templates.filter(t => !t.is_default && t.created_by === user?.id);
  const defaultTemplates = templates.filter(t => t.is_default);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTemplate}
      />
      <main className="p-6 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
              <p className="text-gray-600 mt-2">Templates predefinidos para cálculos rápidos</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Crear Template
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'all', label: 'Todos los Templates' },
                { key: 'favorites', label: 'Mis Favoritos' },
                { key: 'my', label: 'Mis Templates' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            {activeTab === 'all' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rubro</label>
                  <select
                    value={filterRubro}
                    onChange={(e) => setFilterRubro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los rubros</option>
                    <option value="Desarrollo Web">Desarrollo Web</option>
                    <option value="Diseño Gráfico">Diseño Gráfico</option>
                    <option value="Marketing Digital">Marketing Digital</option>
                    <option value="Redacción">Redacción</option>
                    <option value="Traducción">Traducción</option>
                    <option value="Consultoría">Consultoría</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modo</label>
                  <select
                    value={filterModo}
                    onChange={(e) => setFilterModo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los modos</option>
                    <option value="hora">Tarifa por Hora</option>
                    <option value="proyecto">Simular Proyecto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar templates..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay templates disponibles
              </h3>
              <p className="text-gray-500">
                {activeTab === 'favorites' 
                  ? 'No tienes templates favoritos aún'
                  : activeTab === 'my'
                  ? 'No has creado templates personalizados'
                  : 'No se encontraron templates con los filtros aplicados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Mis Templates - SOLO los del usuario autenticado */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Mis Templates</h2>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {myTemplates.length}
                  </span>
                </div>
                {myTemplates.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No has creado templates personalizados aún.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              {getModoIcon(template.modo)}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {template.name}
                            </h3>
                          </div>
                          <button
                            onClick={() => handleToggleFavorite(template.id)}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                            title={favorites.has(template.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          >
                            {favorites.has(template.id) ? (
                              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {template.description && (
                          <p className="text-gray-600 mb-4 text-sm">
                            {template.description}
                          </p>
                        )}

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRubroColor(template.rubro)}`}>
                              {template.rubro}
                            </span>
                            <span className="text-xs text-gray-500">
                              {template.experiencia}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatConfig(template.config)}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{template.usage_count} usos</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUseTemplate(template)}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                          >
                            Usar Template
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Eliminar template"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Templates por defecto - SEGUNDO */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Templates por Defecto</h2>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {defaultTemplates.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {defaultTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            {getModoIcon(template.modo)}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {template.name}
                          </h3>
                        </div>
                        <button
                          onClick={() => handleToggleFavorite(template.id)}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                          title={favorites.has(template.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        >
                          {favorites.has(template.id) ? (
                            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {template.description && (
                        <p className="text-gray-600 mb-4 text-sm">
                          {template.description}
                        </p>
                      )}

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRubroColor(template.rubro)}`}>
                            {template.rubro}
                          </span>
                          <span className="text-xs text-gray-500">
                            {template.experiencia}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatConfig(template.config)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{template.usage_count} usos</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        Usar Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 