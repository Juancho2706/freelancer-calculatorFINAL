import { createClient } from '@supabase/supabase-js';

// Verificar que las variables de entorno estén definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Variables de entorno de Supabase no configuradas. ' +
    'Crea un archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Crear cliente de Supabase
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Función para verificar la conexión
export async function verificarConexionSupabase() {
  try {
    const { data, error } = await supabase
      .from('calculos')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Error de conexión a Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error al verificar conexión:', error);
    return false;
  }
}

// Función para obtener información de la tabla
export async function obtenerInfoTabla() {
  try {
    const { data, error } = await supabase
      .from('calculos')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error al obtener información de la tabla:', error);
      return null;
    }

    return {
      tablaExiste: true,
      registros: data?.length || 0
    };
  } catch (error) {
    console.error('Error al obtener información de la tabla:', error);
    return null;
  }
} 