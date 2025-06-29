-- Script para actualizar la base de datos existente
-- Ejecuta este script si ya tienes una base de datos configurada

-- Agregar campo favorito si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calculos' 
        AND column_name = 'favorito'
    ) THEN
        ALTER TABLE calculos ADD COLUMN favorito BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Agregar campo updated_at si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calculos' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE calculos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Crear índice para favoritos si no existe
CREATE INDEX IF NOT EXISTS idx_calculos_favorito ON calculos(favorito);

-- Actualizar políticas de RLS si es necesario
-- (Esto solo se ejecutará si las políticas no existen)

-- Política para actualizar cálculos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'calculos' 
        AND policyname = 'Users can update own calculations'
    ) THEN
        CREATE POLICY "Users can update own calculations" ON calculos
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Política para eliminar cálculos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'calculos' 
        AND policyname = 'Users can delete own calculations'
    ) THEN
        CREATE POLICY "Users can delete own calculations" ON calculos
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_calculos_updated_at'
    ) THEN
        CREATE TRIGGER update_calculos_updated_at 
            BEFORE UPDATE ON calculos 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar que todo esté configurado correctamente
SELECT 
    'Tabla calculos' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'calculos' 
ORDER BY ordinal_position;

-- Script SQL para actualizar la tabla calculos existente
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- Agregar columna modo con valor por defecto
ALTER TABLE calculos 
ADD COLUMN IF NOT EXISTS modo TEXT NOT NULL DEFAULT 'tarifa_hora' CHECK (modo IN ('tarifa_hora', 'simular_proyecto'));

-- Agregar columna proyecto
ALTER TABLE calculos 
ADD COLUMN IF NOT EXISTS proyecto JSONB;

-- Crear índice para la columna modo
CREATE INDEX IF NOT EXISTS idx_calculos_modo ON calculos(modo);

-- Actualizar registros existentes para que tengan el modo por defecto
UPDATE calculos 
SET modo = 'tarifa_hora' 
WHERE modo IS NULL;

-- Verificar que la actualización fue exitosa
SELECT 
  COUNT(*) as total_calculos,
  COUNT(CASE WHEN modo = 'tarifa_hora' THEN 1 END) as tarifa_hora,
  COUNT(CASE WHEN modo = 'simular_proyecto' THEN 1 END) as simular_proyecto,
  COUNT(CASE WHEN proyecto IS NOT NULL THEN 1 END) as con_proyecto
FROM calculos;

-- Script SQL para actualizar el esquema existente
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase para agregar la tabla user_preferences

-- Crear tabla de preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    rubro TEXT DEFAULT 'Desarrollo Web',
    experiencia TEXT DEFAULT '3-5 años',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 