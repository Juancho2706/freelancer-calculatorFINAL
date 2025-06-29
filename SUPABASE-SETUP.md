# Configuración de Supabase para Calculadora Freelancer Chile

## Paso 1: Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Elige una región cercana (ej: South America)
5. Espera a que se complete la configuración

## Paso 2: Obtener credenciales

1. En tu proyecto de Supabase, ve a **Settings** > **API**
2. Copia la **URL** y la **anon public key**
3. Crea un archivo `.env.local` en la raíz de tu proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## Paso 3: Crear la tabla

1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Copia y pega el contenido del archivo `supabase-schema.sql`
3. Ejecuta el script

## Paso 4: Verificar la configuración

1. Reinicia tu servidor de desarrollo: `npm run dev`
2. Abre la aplicación y haz un cálculo
3. Verifica en la consola del navegador que no hay errores
4. Ve a **Table Editor** en Supabase para ver los datos guardados

## Estructura de la tabla

La tabla `calculos` tiene los siguientes campos:

- `id`: Identificador único (auto-incremento)
- `user_id`: ID del usuario (para futura autenticación)
- `inputs`: JSON con los datos de entrada
- `resultado`: JSON con los resultados del cálculo
- `fecha`: Timestamp de cuando se realizó el cálculo
- `created_at`: Timestamp de creación del registro

## Funcionalidades implementadas

✅ **Guardado automático**: Cada cálculo se guarda automáticamente
✅ **Manejo de errores**: Mensajes claros si hay problemas de conexión
✅ **Validación**: Verificación de conexión y estructura de datos
✅ **Estadísticas**: Funciones para obtener estadísticas de cálculos

## Próximas mejoras

🔄 **Historial de cálculos**: Ver cálculos anteriores
🔄 **Autenticación**: Sistema de usuarios
🔄 **Comparación**: Comparar con promedios de la industria
🔄 **Exportación**: Exportar resultados a PDF

## Solución de problemas

### Error: "Variables de entorno no configuradas"
- Verifica que el archivo `.env.local` existe
- Asegúrate de que las variables están correctamente nombradas
- Reinicia el servidor de desarrollo

### Error: "Table does not exist"
- Ejecuta el script SQL en Supabase
- Verifica que la tabla se creó correctamente

### Error: "Permission denied"
- Verifica las políticas RLS en Supabase
- Asegúrate de que las políticas permiten inserción sin autenticación 