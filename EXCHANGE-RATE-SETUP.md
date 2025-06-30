# Sistema de Cache de Tipo de Cambio USD/CLP

## 📋 Resumen

Este sistema implementa un cache persistente del tipo de cambio USD/CLP usando Supabase como almacenamiento. La API externa (Frankfurter) se consulta solo cuando es necesario, y los datos se almacenan en Supabase para uso rápido y confiable.

## 🏗️ Arquitectura

```
Frankfurter API → Script de Actualización → Supabase → Frontend/Backend
     (cada hora)         (Node.js)         (Cache)     (Lectura rápida)
```

## 📦 Componentes Implementados

### 1. **Tabla Supabase: `exchange_rates`**
```sql
create table exchange_rates (
  id serial primary key,
  base_currency text not null,
  target_currency text not null,
  rate numeric not null,
  fetched_at timestamptz not null default now(),
  unique (base_currency, target_currency)
);
```

### 2. **Script de Actualización: `scripts/update-exchange-rate.ts`**
- Consulta Frankfurter API
- Guarda el resultado en Supabase
- Manejo de errores y logging

### 3. **Funciones de Lectura: `src/lib/exchange-rates.ts`**
- `getExchangeRate()` - Obtiene el último valor
- `getExchangeRateHistory()` - Obtiene historial
- `needsUpdate()` - Verifica si necesita actualización
- `getExchangeRateWithFallback()` - Con valor por defecto

### 4. **Widget Actualizado: `src/components/DolarLiveWidget.tsx`**
- Lee desde Supabase en lugar de API externa
- Muestra advertencia si los datos son antiguos
- Historial desde la base de datos

### 5. **Endpoint de Actualización: `/api/update-exchange-rate`**
- POST: Actualiza el tipo de cambio
- GET: Verifica el estado actual

## 🚀 Configuración

### Variables de Entorno Requeridas

En tu `.env.local`:
```env
# Supabase (ya las tienes)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Nueva variable para el script de actualización
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # Service Role Key de Supabase

# Opcional: API Key para proteger el endpoint de actualización
UPDATE_API_KEY=tu-api-key-secreta
```

### Obtener Service Role Key

1. Ve a tu proyecto en Supabase
2. Settings → API
3. Copia la "Service Role Key" (NO la anon key)

## 📝 Uso

### Actualizar Tipo de Cambio

**Opción 1: Script local**
```bash
npm run update-dolar
```

**Opción 2: Endpoint HTTP**
```bash
curl -X POST http://localhost:3000/api/update-exchange-rate \
  -H "Authorization: Bearer tu-api-key"
```

### Verificar Estado

```bash
npm run check-dolar
```

O visitar: `http://localhost:3000/api/update-exchange-rate`

### Usar en el Frontend

```typescript
import { getExchangeRate } from '@/lib/exchange-rates';

const result = await getExchangeRate();
if (result.success) {
  console.log(`1 USD = ${result.data.rate} CLP`);
}
```

## ⏰ Automatización

### Opción 1: Cron Job Local
```bash
# Agregar a crontab (Linux/Mac)
0 * * * * cd /path/to/project && npm run update-dolar

# Windows Task Scheduler
# Crear tarea que ejecute: npm run update-dolar
```

### Opción 2: Vercel Cron Jobs
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/update-exchange-rate",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Opción 3: Servicios Externos
- **GitHub Actions**: Workflow que ejecute el script
- **Railway**: Cron job en Railway
- **Heroku**: Scheduler add-on

## 🔧 Mantenimiento

### Verificar Estado del Sistema
```bash
# Ver último valor guardado
npm run check-dolar

# Ver logs del script
npm run update-dolar
```

### Limpiar Datos Antiguos
```sql
-- Eliminar datos de más de 30 días
DELETE FROM exchange_rates 
WHERE fetched_at < NOW() - INTERVAL '30 days';
```

### Monitoreo
- El widget muestra advertencia si los datos son > 60 minutos
- Los logs del script muestran errores detallados
- El endpoint GET permite verificar el estado

## 🛡️ Seguridad

### Permisos de Supabase
- **Lectura**: Pública (anon/authenticated)
- **Escritura**: Solo service_role
- **RLS**: Activado con policy de lectura pública

### Protección del Endpoint
- API Key opcional para el endpoint de actualización
- Rate limiting recomendado en producción

## 📊 Beneficios

1. **Rendimiento**: Lectura instantánea desde Supabase
2. **Confiabilidad**: Fallback a valor por defecto
3. **Eficiencia**: Una consulta por hora vs múltiples por minuto
4. **Historial**: Datos históricos disponibles
5. **Escalabilidad**: No depende de límites de API externa

## 🐛 Troubleshooting

### Error: "No hay datos disponibles"
- Ejecutar `npm run update-dolar` para poblar la tabla
- Verificar permisos de Supabase

### Error: "Datos antiguos"
- Los datos tienen > 60 minutos
- Ejecutar actualización manual o verificar automatización

### Error: "No autorizado"
- Verificar UPDATE_API_KEY en variables de entorno
- O remover la verificación temporalmente

### Error de conexión a Frankfurter
- Verificar conectividad a internet
- Frankfurter puede estar temporalmente caído
- El sistema continuará funcionando con datos antiguos

## 🔄 Migración desde Sistema Anterior

1. **Crear tabla**: Ejecutar SQL en Supabase
2. **Poblar datos**: Ejecutar `npm run update-dolar`
3. **Actualizar frontend**: El widget ya está actualizado
4. **Configurar automatización**: Elegir método preferido
5. **Monitorear**: Verificar que todo funcione correctamente

## 📈 Próximas Mejoras

- [ ] Soporte para múltiples monedas
- [ ] Gráficos de tendencias
- [ ] Alertas de cambio significativo
- [ ] Webhooks para actualizaciones
- [ ] Dashboard de administración 