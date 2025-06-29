# Configuración de Autenticación - Calculadora Freelancer Chile

## Configuración de Supabase Auth

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (opcional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2. Configuración en Supabase Dashboard

#### Habilitar Proveedores de Autenticación

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Authentication** > **Providers**
3. Habilita los siguientes proveedores:

**Email/Password:**
- ✅ Enable email confirmations
- ✅ Enable secure email change
- ✅ Enable double confirm changes

**Google OAuth:**
- ✅ Enable Google provider
- Configura tu Google Client ID y Secret

#### Configurar URLs de Redirección

En **Authentication** > **URL Configuration**:

```
Site URL: http://localhost:3000 (desarrollo)
Redirect URLs: 
- http://localhost:3000/auth/callback
- https://tu-dominio.com/auth/callback (producción)
```

### 3. Configuración de Google OAuth (Opcional)

Si quieres habilitar el login con Google:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ 
4. Crea credenciales OAuth 2.0
5. Configura las URLs autorizadas:
   - `http://localhost:3000/auth/callback`
   - `https://tu-dominio.com/auth/callback`
6. Copia el Client ID y Secret a Supabase

### 4. Configuración de Email Templates

En **Authentication** > **Email Templates**, personaliza:

- **Confirm signup**: Email de confirmación de cuenta
- **Reset password**: Email de recuperación de contraseña
- **Change email address**: Email de cambio de email

### 5. Políticas de Seguridad (RLS)

Las políticas RLS ya están configuradas en `supabase-schema.sql`:

```sql
-- Permitir inserción de cálculos para usuarios autenticados
CREATE POLICY "Users can insert their own calculations" ON calculos
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir lectura de cálculos propios
CREATE POLICY "Users can view their own calculations" ON calculos
FOR SELECT USING (auth.uid() = user_id);
```

## Funcionalidades Implementadas

### ✅ Autenticación por Email/Password
- Registro de usuarios
- Inicio de sesión
- Recuperación de contraseña
- Confirmación de email

### ✅ Autenticación con Google
- Login con Google OAuth
- Manejo automático de sesiones

### ✅ Middleware de Protección
- Rutas protegidas: `/dashboard`, `/perfil`, `/historial`
- Redirección automática al login
- Manejo de sesiones en el servidor

### ✅ Contexto de Autenticación
- Estado global del usuario
- Función de logout
- Actualización automática del estado

### ✅ Componentes de UI
- Modal de autenticación completo
- Header con estado de usuario
- Indicadores de estado de conexión

## Flujo de Usuario

1. **Usuario no autenticado:**
   - Puede usar la calculadora
   - Ve mensaje para iniciar sesión
   - Los cálculos no se guardan

2. **Usuario autenticado:**
   - Ve su nombre en el header
   - Los cálculos se guardan automáticamente
   - Acceso a dashboard e historial

3. **Protección de rutas:**
   - Middleware verifica autenticación
   - Redirección automática si no está autenticado
   - Mensajes informativos

## Próximos Pasos

### Funcionalidades Futuras
- [ ] Perfil de usuario editable
- [ ] Historial completo de cálculos
- [ ] Exportación de datos
- [ ] Notificaciones por email
- [ ] Integración con Transbank para pagos

### Mejoras de Seguridad
- [ ] Rate limiting en autenticación
- [ ] Verificación de email obligatoria
- [ ] Logs de auditoría
- [ ] Backup automático de datos

## Troubleshooting

### Problemas Comunes

**Error: "Invalid login credentials"**
- Verifica que el usuario esté confirmado
- Revisa las políticas RLS

**Error: "Google OAuth failed"**
- Verifica las URLs de redirección
- Confirma que el Client ID sea correcto

**Error: "Middleware redirect loop"**
- Verifica la configuración del middleware
- Confirma las rutas protegidas

### Logs de Debug

Para debuggear problemas de autenticación:

```javascript
// En el navegador
console.log('User:', user);
console.log('Session:', session);

// En el servidor
console.log('Auth headers:', request.headers);
```

## Recursos Adicionales

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs) 