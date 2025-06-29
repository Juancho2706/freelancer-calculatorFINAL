import { supabase } from './supabase-config';
import { CalculationTemplate, TemplateFilters } from '@/utils/types';

// Obtener todos los templates públicos
export async function getTemplates(filters?: TemplateFilters): Promise<CalculationTemplate[]> {
  try {
    let query = supabase
      .from('calculation_templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    // Aplicar filtros
    if (filters?.rubro) {
      query = query.eq('rubro', filters.rubro);
    }
    if (filters?.experiencia) {
      query = query.eq('experiencia', filters.experiencia);
    }
    if (filters?.modo) {
      query = query.eq('modo', filters.modo);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

// Obtener templates por rubro
export async function getTemplatesByRubro(rubro: string): Promise<CalculationTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('calculation_templates')
      .select('*')
      .eq('rubro', rubro)
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching templates by rubro:', error);
    throw error;
  }
}

// Obtener templates favoritos del usuario
export async function getFavoriteTemplates(): Promise<CalculationTemplate[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Primero obtener los IDs de templates favoritos
    const { data: favorites, error: favoritesError } = await supabase
      .from('template_favorites')
      .select('template_id')
      .eq('user_id', user.id);

    if (favoritesError) throw favoritesError;
    if (!favorites || favorites.length === 0) return [];

    // Luego obtener los templates completos
    const templateIds = favorites.map(f => f.template_id);
    const { data: templates, error: templatesError } = await supabase
      .from('calculation_templates')
      .select('*')
      .in('id', templateIds);

    if (templatesError) throw templatesError;
    return templates || [];
  } catch (error) {
    console.error('Error fetching favorite templates:', error);
    throw error;
  }
}

// Agregar template a favoritos
export async function addTemplateToFavorites(templateId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('template_favorites')
      .insert([{
        user_id: user.id,
        template_id: templateId
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error adding template to favorites:', error);
    throw error;
  }
}

// Remover template de favoritos
export async function removeTemplateFromFavorites(templateId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('template_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('template_id', templateId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing template from favorites:', error);
    throw error;
  }
}

// Verificar si un template está en favoritos
export async function isTemplateFavorite(templateId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('template_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('template_id', templateId)
      .maybeSingle();

    if (error) {
      console.error('Error checking if template is favorite:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking if template is favorite:', error);
    return false;
  }
}

// Obtener todos los favoritos del usuario de una vez
export async function getUserFavorites(): Promise<Set<string>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Set();

    const { data, error } = await supabase
      .from('template_favorites')
      .select('template_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user favorites:', error);
      // Si hay un error, retornar un set vacío en lugar de fallar
      return new Set();
    }

    const favoriteIds = data?.map(item => item.template_id).filter(Boolean) || [];
    return new Set(favoriteIds);
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return new Set();
  }
}

// Incrementar contador de uso de un template
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_template_usage', {
      template_id: templateId
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing template usage:', error);
    // No lanzar error para no afectar el cálculo principal
  }
}

// Crear un nuevo template personalizado
export async function createCustomTemplate(templateData: Omit<CalculationTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<CalculationTemplate> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('calculation_templates')
      .insert([{
        ...templateData,
        created_by: user.id,
        is_public: false // Los templates personalizados son privados por defecto
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating custom template:', error);
    throw error;
  }
}

// Obtener templates del usuario
export async function getUserTemplates(): Promise<CalculationTemplate[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('calculation_templates')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user templates:', error);
    throw error;
  }
}

// Actualizar un template
export async function updateTemplate(id: string, updates: Partial<CalculationTemplate>): Promise<CalculationTemplate> {
  try {
    const { data, error } = await supabase
      .from('calculation_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

// Eliminar un template
export async function deleteTemplate(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('calculation_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// Obtener templates más populares
export async function getPopularTemplates(limit: number = 10): Promise<CalculationTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('calculation_templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching popular templates:', error);
    throw error;
  }
}

// Obtener templates recomendados basados en preferencias del usuario
export async function getRecommendedTemplates(): Promise<CalculationTemplate[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Obtener preferencias del usuario
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('rubro, experiencia')
      .eq('user_id', user.id)
      .single();

    if (!preferences) return [];

    // Obtener templates que coincidan con las preferencias
    const { data, error } = await supabase
      .from('calculation_templates')
      .select('*')
      .eq('is_public', true)
      .eq('rubro', preferences.rubro)
      .eq('experiencia', preferences.experiencia)
      .order('usage_count', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recommended templates:', error);
    return [];
  }
}

// Función de prueba para verificar la conexión a template_favorites
export async function testTemplateFavoritesConnection(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user authenticated');
      return false;
    }

    // Intentar una consulta simple
    const { data, error } = await supabase
      .from('template_favorites')
      .select('count')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error testing template_favorites connection:', error);
      return false;
    }

    console.log('Template favorites connection successful');
    return true;
  } catch (error) {
    console.error('Error testing template_favorites connection:', error);
    return false;
  }
} 