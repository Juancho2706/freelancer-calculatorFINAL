# APIs para Datos Volátiles - Calculadora Freelancer Chile

## Resumen

Este documento describe las APIs implementadas para manejar datos volátiles en la Calculadora Freelancer Chile, incluyendo tipos de cambio, impuestos y tarifas del mercado.

## APIs Implementadas

### 1. Tipos de Cambio (`/api/datos-externos?tipo=tipo_cambio`)

**Descripción:** Obtiene el tipo de cambio USD/CLP en tiempo real.

**Fuentes:**
- Principal: Exchange Rate API (https://api.exchangerate-api.com/v4/latest/USD)
- Backup: Monobank API (https://api.monobank.ua/bank/currency)
- Fallback: Valor por defecto (950 CLP/USD)

**Cache:** 1 hora

**Respuesta:**
```json
{
  "clp_usd": 950.25,
  "usd_clp": 0.001052,
  "fecha": "2024-01-15T10:30:00.000Z",
  "fuente": "exchangerate-api.com"
}
```

### 2. Impuestos Chilenos (`/api/datos-externos?tipo=impuestos`)

**Descripción:** Obtiene los impuestos y cotizaciones actuales de Chile.

**Valores actuales:**
- IVA: 19%
- Retención de boletas de honorarios: 13.75% (proyectado 2025)
- Cotización de salud: 7%

**Cache:** 24 horas

**Respuesta:**
```json
{
  "iva": 0.19,
  "retencion_boleta": 0.1375,
  "cotizacion_salud": 0.07,
  "fecha_actualizacion": "2024-01-15T10:30:00.000Z"
}
```

### 3. Tarifas del Mercado (`/api/datos-externos?tipo=tarifas`)

**Descripción:** Obtiene tarifas sugeridas por rubro y experiencia.

**Rubros disponibles:**
- diseño
- desarrollo
- marketing
- redaccion
- consultoria
- otro

**Niveles de experiencia:**
- junior
- semi
- senior

**Cache:** 1 semana

**Respuesta:**
```json
[
  {
    "rubro": "desarrollo",
    "experiencia": "senior",
    "min": 22000,
    "promedio": 32000,
    "max": 45000,
    "fecha_actualizacion": "2024-01-15T10:30:00.000Z"
  }
]
```

### 4. Todos los Datos (`/api/datos-externos?tipo=todos`)

**Descripción:** Obtiene todos los datos externos en una sola llamada.

**Respuesta:**
```json
{
  "tipo_cambio": { ... },
  "impuestos": { ... },
  "tarifas": [ ... ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 5. API de Tipo de Cambio del Dólar (Frankfurter)

**Endpoint:** `/api/tipo-cambio-dolar`

**Descripción:** Obtiene el tipo de cambio USD/CLP en tiempo real desde la API de Frankfurter, una fuente confiable y gratuita de tipos de cambio.

**Parámetros:**
- `historico` (opcional): `true` para obtener historial de tipos de cambio
- `dias` (opcional): Número de días para el historial (por defecto: 30)

**Ejemplos de uso:**

```javascript
// Obtener tipo de cambio actual
const response = await fetch('/api/tipo-cambio-dolar');
const data = await response.json();

// Obtener historial de 7 días
const response = await fetch('/api/tipo-cambio-dolar?historico=true&dias=7');
const data = await response.json();
```

**Respuesta (tipo de cambio actual):**
```json
{
  "historico": false,
  "datos": {
    "clp_usd": 1045.67,
    "usd_clp": 0.000956,
    "fecha": "2024-01-15T10:30:00.000Z",
    "fuente": "frankfurter.app"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Respuesta (historial):**
```json
{
  "historico": true,
  "datos": [
    {
      "fecha": "2024-01-08",
      "clp_usd": 1040.50
    },
    {
      "fecha": "2024-01-09", 
      "clp_usd": 1042.30
    }
  ],
  "dias": 7,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Características:**
- ✅ Actualización automática cada 5 minutos
- ✅ Historial de hasta 30 días
- ✅ Cálculo de variación y porcentajes
- ✅ Manejo de errores robusto
- ✅ Fuente confiable (Frankfurter API)

## Uso en el Frontend

### Hook Personalizado

```typescript
import { useExternalData } from '@/hooks/useExternalData';

function MiComponente() {
  const { 
    tipoCambio, 
    impuestos, 
    tarifasMercado, 
    isLoading, 
    error,
    convertirCLPaUSD,
    obtenerTarifaEspecifica 
  } = useExternalData();

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  // Usar los datos...
}
```

### Funciones Directas

```typescript
import { 
  obtenerTipoCambio, 
  obtenerImpuestos, 
  obtenerTarifasMercado 
} from '@/lib/apis';

// Obtener tipo de cambio
const tipoCambio = await obtenerTipoCambio();

// Obtener impuestos
const impuestos = await obtenerImpuestos();

// Obtener tarifas del mercado
const tarifas = await obtenerTarifasMercado();
```

## Configuración

### Variables de Entorno

```env
# APIs de tipo de cambio (opcional)
EXCHANGE_RATE_API_KEY=tu_api_key_aqui

# APIs de impuestos (futuro)
SII_API_URL=https://api.sii.cl/impuestos

# APIs de tarifas (futuro)
FREELANCER_API_URL=https://api.freelancer-chile.com/tarifas
```

### Cache

El sistema utiliza cache en memoria con las siguientes duraciones:
- Tipos de cambio: 1 hora
- Impuestos: 24 horas
- Tarifas del mercado: 1 semana

En producción, se recomienda usar Redis o similar para el cache.

## Manejo de Errores

### Fallbacks

Si las APIs externas fallan, el sistema utiliza valores por defecto:

```typescript
// Tipo de cambio por defecto
const TIPO_CAMBIO_DEFAULT = 950; // CLP/USD

// Impuestos por defecto
const IMPUESTOS_DEFAULT = {
  iva: 0.19,
  retencion_boleta: 0.1375,
  cotizacion_salud: 0.07,
};
```

### Logging

Los errores se registran en la consola del servidor:

```typescript
console.warn('Error obteniendo tipo de cambio:', error);
console.error('Error en API de datos externos:', error);
```

## Futuras Mejoras

### 1. APIs Reales de Impuestos
- Integración con API del SII para impuestos actualizados
- Webhooks para cambios en la legislación

### 2. APIs de Tarifas del Mercado
- Integración con plataformas de freelancing
- Encuestas y datos de mercado en tiempo real
- Análisis de tendencias

### 3. Más Monedas
- Soporte para EUR, GBP, y otras monedas
- APIs de múltiples fuentes para mayor confiabilidad

### 4. Cache Avanzado
- Redis para cache distribuido
- Invalidación inteligente de cache
- Métricas de uso de APIs

## Seguridad

### Rate Limiting
- Implementar rate limiting en las APIs
- Monitoreo de uso excesivo

### Validación
- Validar todas las respuestas de APIs externas
- Sanitizar datos antes de usar

### Logs
- Registrar todas las llamadas a APIs externas
- Monitorear errores y latencia

## Monitoreo

### Métricas Recomendadas
- Tiempo de respuesta de APIs externas
- Tasa de éxito/fallo
- Uso de cache vs llamadas directas
- Costos de APIs externas

### Alertas
- APIs no disponibles
- Errores frecuentes
- Latencia alta
- Uso excesivo de APIs 