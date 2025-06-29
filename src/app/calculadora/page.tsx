'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import FormularioCalculadora from '@/components/FormularioCalculadora';
import Link from 'next/link';

export default function CalculadoraPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const authRequired = searchParams.get('auth') === 'required';
  const loginSuccess = searchParams.get('login') === 'success';
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Limpiar el parámetro auth=required cuando el usuario ya está autenticado
  useEffect(() => {
    if (user && authRequired) {
      // Remover el parámetro auth=required de la URL
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      router.replace(url.pathname + url.search);
    }
  }, [user, authRequired, router]);

  // Mostrar mensaje de bienvenida solo cuando el usuario acaba de hacer login
  useEffect(() => {
    if (user && !showWelcomeMessage) {
      // Verificar si el usuario acaba de hacer login (por ejemplo, si viene de una redirección)
      const hasJustLoggedIn = authRequired || loginSuccess || sessionStorage.getItem('justLoggedIn');
      
      if (hasJustLoggedIn) {
        setShowWelcomeMessage(true);
        sessionStorage.removeItem('justLoggedIn');
        
        // Limpiar parámetros de URL
        if (loginSuccess) {
          const url = new URL(window.location.href);
          url.searchParams.delete('login');
          router.replace(url.pathname + url.search);
        }
        
        // Ocultar el mensaje después de 5 segundos
        setTimeout(() => {
          setShowWelcomeMessage(false);
        }, 5000);
      }
    }
  }, [user, authRequired, loginSuccess, showWelcomeMessage, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Freelancer Chile
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Calculadora de{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Tarifas
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Calcula tus tarifas por hora y proyecto considerando impuestos chilenos, 
            gastos fijos y cotizaciones previsionales
          </p>
        </header>

        {/* Mensaje de autenticación requerida - solo mostrar si no está autenticado */}
        {authRequired && !user && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800 font-medium">
                  Necesitas iniciar sesión para acceder a esa página
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de bienvenida para usuarios autenticados - solo mostrar cuando acaban de hacer login */}
        {user && showWelcomeMessage && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800">
                  ¡Bienvenido, {user.user_metadata?.full_name || user.email}! Tus cálculos se guardarán automáticamente.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de Calculadora */}
        <FormularioCalculadora />

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            Desarrollado para freelancers chilenos • Considera la legislación vigente
          </p>
        </footer>
      </div>
    </div>
  );
} 