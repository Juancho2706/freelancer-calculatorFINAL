-- Script SQL para crear la tabla calculos en Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- Crear tabla de cálculos
CREATE TABLE IF NOT EXISTS calculos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    modo TEXT NOT NULL DEFAULT 'tarifa_hora' CHECK (modo IN ('tarifa_hora', 'simular_proyecto')),
    inputs JSONB NOT NULL,
    proyecto JSONB,
    result JSONB NOT NULL,
    favorito BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    titulo TEXT
);

-- Crear tabla de preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    rubro TEXT DEFAULT 'Desarrollo Web',
    experiencia TEXT DEFAULT '3-5 años',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_calculos_user_id ON calculos(user_id);
CREATE INDEX IF NOT EXISTS idx_calculos_created_at ON calculos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculos_favorito ON calculos(favorito);
CREATE INDEX IF NOT EXISTS idx_calculos_modo ON calculos(modo);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE calculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para calculos
CREATE POLICY "Users can view own calculations" ON calculos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations" ON calculos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calculations" ON calculos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations" ON calculos
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_calculos_updated_at 
    BEFORE UPDATE ON calculos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 