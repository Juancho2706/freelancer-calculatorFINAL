import { supabase } from './supabase-config';

// Tipos para la base de datos
export interface CalculoDB {
  id?: string;
  user_id?: string;
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
  };
  created_at?: string;
  favorito?: boolean;
  titulo?: string;
}

// Función para guardar un cálculo
export async function guardarCalculo(calculo: Omit<CalculoDB, 'id' | 'user_id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');
  try {
    const { data, error } = await supabase
      .from('calculos')
      .insert([
        {
          user_id: user.id,
          modo: calculo.modo,
          inputs: calculo.inputs,
          proyecto: calculo.proyecto,
          result: calculo.result,
          favorito: false,
          titulo: calculo.titulo,
        }
      ])
      .select();

    if (error) {
      console.error('Error al guardar cálculo:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error en guardarCalculo:', error);
    throw error;
  }
}

// Función para obtener historial de cálculos del usuario autenticado
export async function obtenerHistorialCalculos() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('calculos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en obtenerHistorialCalculos:', error);
    throw error;
  }
}

// Función para obtener cálculos favoritos
export async function obtenerCalculosFavoritos() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('calculos')
      .select('*')
      .eq('user_id', user.id)
      .eq('favorito', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener favoritos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en obtenerCalculosFavoritos:', error);
    throw error;
  }
}

// Función para marcar/desmarcar como favorito
export async function toggleFavorito(calculoId: string, favorito: boolean) {
  try {
    const { data, error } = await supabase
      .from('calculos')
      .update({ favorito })
      .eq('id', calculoId)
      .select();

    if (error) {
      console.error('Error al actualizar favorito:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error en toggleFavorito:', error);
    throw error;
  }
}

// Función para eliminar un cálculo
export async function eliminarCalculo(calculoId: string) {
  try {
    const { error } = await supabase
      .from('calculos')
      .delete()
      .eq('id', calculoId);

    if (error) {
      console.error('Error al eliminar cálculo:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error en eliminarCalculo:', error);
    throw error;
  }
}

// Función para obtener estadísticas de cálculos del usuario
export async function obtenerEstadisticasCalculos() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('calculos')
      .select('result')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        totalCalculos: 0,
        promedioTarifa: 0,
        tarifaMinima: 0,
        tarifaMaxima: 0,
        totalFavoritos: 0
      };
    }

    const tarifas = data.map(calculo => calculo.result.tarifaHora);
    const promedioTarifa = tarifas.reduce((sum, tarifa) => sum + tarifa, 0) / tarifas.length;
    const tarifaMinima = Math.min(...tarifas);
    const tarifaMaxima = Math.max(...tarifas);

    // Obtener total de favoritos
    const { data: favoritosData } = await supabase
      .from('calculos')
      .select('id')
      .eq('user_id', user.id)
      .eq('favorito', true);

    return {
      totalCalculos: data.length,
      promedioTarifa: Math.round(promedioTarifa),
      tarifaMinima,
      tarifaMaxima,
      totalFavoritos: favoritosData?.length || 0
    };
  } catch (error) {
    console.error('Error en obtenerEstadisticasCalculos:', error);
    throw error;
  }
} 