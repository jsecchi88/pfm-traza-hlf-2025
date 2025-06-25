'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function RouteGuard({ children, allowedRoles = [] }: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Si está cargando, espera a que termine
    if (isLoading) return;

    // Si no hay usuario y no estamos en login o la página principal, redirige a login
    if (!user && pathname !== '/login' && pathname !== '/') {
      router.push('/login');
      return;
    }

    // Si hay roles permitidos y el usuario no tiene un rol permitido, redirige a inicio
    if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, isLoading, router, pathname, allowedRoles]);

  // Mientras se verifica el usuario, muestra un indicador de carga
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Si hay roles permitidos y el usuario no tiene uno de esos roles, no muestra nada
  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    return null;
  }

  // Si no hay usuario y no estamos en login o la página principal, no muestra nada
  if (!user && pathname !== '/login' && pathname !== '/') {
    return null;
  }

  // Todo está bien, muestra el contenido
  return <>{children}</>;
}
