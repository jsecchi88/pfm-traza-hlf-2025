'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navLinks = [
    { name: 'Inicio', href: '/' },
    { name: 'Trazabilidad', href: '/trazabilidad' },
  ];

  // Menús específicos según el rol del usuario
  const roleSpecificLinks = user ? getRoleLinks(user.role) : [];

  return (
    <nav className="bg-indigo-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="font-bold text-xl">PFM Traza HLF</span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium
                      ${isActive(link.href) ? 'bg-indigo-900 text-white' : 'text-gray-300 hover:bg-indigo-700 hover:text-white'}
                    `}
                  >
                    {link.name}
                  </Link>
                ))}
                {roleSpecificLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium
                      ${isActive(link.href) ? 'bg-indigo-900 text-white' : 'text-gray-300 hover:bg-indigo-700 hover:text-white'}
                    `}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300">
                    {user.name} ({user.role})
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-indigo-700 hover:text-white"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-indigo-700 hover:text-white"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-indigo-700 focus:outline-none"
            >
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`
                  block px-3 py-2 rounded-md text-base font-medium
                  ${isActive(link.href) ? 'bg-indigo-900 text-white' : 'text-gray-300 hover:bg-indigo-700 hover:text-white'}
                `}
              >
                {link.name}
              </Link>
            ))}
            {roleSpecificLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`
                  block px-3 py-2 rounded-md text-base font-medium
                  ${isActive(link.href) ? 'bg-indigo-900 text-white' : 'text-gray-300 hover:bg-indigo-700 hover:text-white'}
                `}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-indigo-700">
            {user ? (
              <div className="px-2 space-y-1">
                <div className="block px-3 py-2 text-base font-medium text-gray-300">
                  {user.name} ({user.role})
                </div>
                <button
                  onClick={logout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-indigo-700 hover:text-white"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-indigo-700 hover:text-white"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// Función para obtener enlaces específicos según el rol
function getRoleLinks(role: string) {
  switch (role) {
    case 'viticultor':
      return [
        { name: 'Mis Cosechas', href: '/cosechas' },
        { name: 'Nueva Cosecha', href: '/cosechas/nueva' }
      ];
    case 'bodega':
      return [
        { name: 'Productos', href: '/productos' },
        { name: 'Elaboración', href: '/elaboracion' }
      ];
    case 'transportista':
      return [
        { name: 'Mis Transportes', href: '/transportes' },
        { name: 'Incidencias', href: '/incidencias' }
      ];
    case 'distribuidor':
      return [
        { name: 'Lotes', href: '/lotes' },
        { name: 'Recepción', href: '/recepcion' }
      ];
    case 'minorista':
      return [
        { name: 'Inventario', href: '/inventario' },
        { name: 'Ventas', href: '/ventas' }
      ];
    case 'regulador':
      return [
        { name: 'Verificaciones', href: '/verificaciones' },
        { name: 'Certificados', href: '/certificados' }
      ];
    default:
      return [];
  }
}
