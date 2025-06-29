-- Script para verificar y corregir las políticas de template_favorites
-- Ejecuta este script en el SQL Editor de Supabase

-- Primero, verificar si las políticas existen
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'template_favorites';

-- Eliminar políticas existentes si hay problemas
DROP POLICY IF EXISTS "Users can view their own template favorites" ON template_favorites;
DROP POLICY IF EXISTS "Users can insert their own template favorites" ON template_favorites;
DROP POLICY IF EXISTS "Users can delete their own template favorites" ON template_favorites;

-- Recrear las políticas correctamente
CREATE POLICY "Users can view their own template favorites" ON template_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own template favorites" ON template_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own template favorites" ON template_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Verificar que RLS esté habilitado
ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'template_favorites' 
ORDER BY ordinal_position; 