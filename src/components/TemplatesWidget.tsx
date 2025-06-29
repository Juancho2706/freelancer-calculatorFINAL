'use client';

import { useState, useEffect } from 'react';
import { CalculationTemplate } from '@/utils/types';
import { 
  getRecommendedTemplates, 
  getPopularTemplates, 
  addTemplateToFavorites, 
  removeTemplateFromFavorites, 
  getUserFavorites,
  incrementTemplateUsage 
} from '@/lib/templates';

interface TemplatesWidgetProps {
  maxItems?: number;
  showRecommended?: boolean;
}

export default function TemplatesWidget({ maxItems = 3, showRecommended = true }: TemplatesWidgetProps) {
  const [templates, setTemplates] = useState<CalculationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (showRecommended) {
      loadTemplates();
    }
  }, [showRecommended]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      let templatesData: CalculationTemplate[] = [];

      if (showRecommended) {
        templatesData = await getRecommendedTemplates();
        // Si no hay recomendados, mostrar populares
        if (templatesData.length === 0) {
          templatesData = await getPopularTemplates(maxItems);
        }
      } else {
        templatesData = await getPopularTemplates(maxItems);
      }

      setTemplates(templatesData.slice(0, maxItems));

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
      setLoadingFavorites(prev => new Set(prev).add(templateId));
      
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
    } finally {
      setLoadingFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }
  };

  const handleUseTemplate = async (template: CalculationTemplate) => {
    try {
      // Incrementar contador de uso
      await incrementTemplateUsage(template.id);
      
      // Redirigir a la calculadora con los datos del template
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

  const getModoIcon = (modo: string) => {
    if (modo === 'hora') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {showRecommended ? 'Templates Recomendados' : 'Templates Populares'}
          </h3>
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {showRecommended ? 'Templates Recomendados' : 'Templates Populares'}
        </h3>
        <span className="text-sm text-gray-500">{templates.length} disponibles</span>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            {showRecommended 
              ? 'Configura tus preferencias para ver templates recomendados'
              : 'No hay templates disponibles en este momento'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getModoIcon(template.modo)}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {template.name}
                  </h4>
                </div>
                <button
                  onClick={() => handleToggleFavorite(template.id)}
                  disabled={loadingFavorites.has(template.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-yellow-500 transition-colors disabled:opacity-50"
                  title={favorites.has(template.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {loadingFavorites.has(template.id) ? (
                    <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : favorites.has(template.id) ? (
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {template.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRubroColor(template.rubro)}`}>
                    {template.rubro}
                  </span>
                  <span className="text-xs text-gray-500">
                    {template.experiencia}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {template.usage_count} usos
                </span>
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
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => window.location.href = '/dashboard/templates'}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Ver todos los templates →
        </button>
      </div>
    </div>
  );
} 