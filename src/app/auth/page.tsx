'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthModal from '@/components/AuthModal';
import Link from 'next/link';

export default function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Si el usuario está autenticado, redirigir al dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    } else {
      // Abrir el modal automáticamente si no está autenticado
      setIsModalOpen(true);
    }
  }, [user, router]);

  const handleAuthSuccess = (user: any) => {
    // El modal se cerrará automáticamente y el useEffect redirigirá
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Redirigir a la página principal si cierra el modal
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Accede a tu cuenta para guardar tus cálculos
          </p>
        </div>

        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Volver al inicio
        </Link>
      </div>

      <AuthModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
} 