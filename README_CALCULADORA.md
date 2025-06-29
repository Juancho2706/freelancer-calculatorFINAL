# Calculadora de Precios para Freelancers Chilenos

Esta aplicación web ayuda a freelancers de Chile a calcular tarifas justas y realistas para sus servicios, considerando todos los factores relevantes del contexto local.

## ¿Qué hace esta calculadora?

- **Calcula tu tarifa por hora y por proyecto** de forma personalizada, considerando:
  - Ingresos mensuales deseados
  - Días trabajados al mes
  - Horas trabajadas por día
  - Gastos fijos mensuales
  - Impuestos y cotizaciones obligatorias en Chile:
    - IVA (19%)
    - Retención de boletas de honorarios (13.75%)
    - Cotización de salud (7%)
- **Desglose visual y detallado** de todos los componentes del cálculo (impuestos, gastos, ingresos netos, etc.)
- **Conversión automática a USD** para referencia internacional
- **Gráficos interactivos** (torta y barras) para visualizar la composición de tus tarifas
- **Historial de cálculos**: guarda y revisa tus cálculos anteriores
- **Favoritos**: marca tus cálculos más importantes para acceso rápido
- **Exporta resultados a PDF** para compartir con clientes
- **Autenticación segura** (email/contraseña y Google) usando Supabase
- **Dashboard moderno** con estadísticas y navegación lateral
- **Mobile-first y diseño profesional**

## Características principales

- **Fácil de usar**: interfaz intuitiva, validaciones claras y experiencia fluida
- **Cálculos robustos**: considera todos los impuestos y cotizaciones relevantes para freelancers en Chile
- **Visualización atractiva**: gráficos y desglose de resultados
- **Gestión de usuario**: historial, favoritos, perfil y cierre de sesión
- **Seguridad**: autenticación y almacenamiento seguro con Supabase
- **Exportación**: descarga tus resultados en PDF

## Opciones y sugerencias para mejorarla

1. **Comparador de tarifas por rubro**
   - Permitir comparar tu tarifa con promedios de la industria o de otros freelancers en tu área
2. **Notificaciones y recordatorios**
   - Enviar emails o alertas sobre cambios en impuestos, nuevas funcionalidades, etc.
3. **Webhooks y automatización**
   - Integrar con sistemas de facturación, contabilidad o bancos
4. **Más opciones de exportación**
   - Exportar a Excel, CSV o compartir por WhatsApp
5. **Personalización avanzada**
   - Permitir agregar otros tipos de gastos, seguros, o cotizaciones voluntarias
6. **Simulador de escenarios**
   - Probar diferentes combinaciones de días, horas y gastos para ver el impacto en tu tarifa
7. **Integración con APIs de tipo de cambio en tiempo real**
   - Mostrar valores en USD siempre actualizados
8. **Soporte para otros países**
   - Adaptar la calculadora para freelancers de otros países latinoamericanos
9. **Sistema de suscripciones/pagos**
   - Permitir acceso premium a funcionalidades avanzadas (ej: reportes, comparativas, etc.)
10. **Accesibilidad y temas**
    - Mejorar accesibilidad, agregar modo oscuro/tema personalizado

## Tecnologías utilizadas
- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth)
- Chart.js
- jsPDF

---

¿Tienes ideas para mejorarla? ¡Contribuciones y sugerencias son bienvenidas! 