'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isGuestUser, useAuth } from '@/lib/auth';
import { Cog6ToothIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const isGuest = isGuestUser(user);

  const handleSignOut = async () => {
    await signOut();
    router.push('/dashboard');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              FinanceAnchor
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/expenses')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Despesas
            </button>
            <button
              onClick={() => router.push('/budget')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Orçamento
            </button>
            <button
              onClick={() => router.push('/goal')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Metas
            </button>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="hidden md:block text-sm text-gray-700">
                    {isGuest ? 'Visitante' : user.email}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {isGuest && (
                      <div className="px-4 py-2 text-xs text-blue-600">
                        Modo visitante
                      </div>
                    )}
                    <button
                      onClick={() => {
                        router.push('/settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                      <span>Configurações</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push('/settings/export');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Exportar Dados</span>
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <button
                onClick={() => {
                  router.push('/dashboard');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  router.push('/expenses');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                Despesas
              </button>
              <button
                onClick={() => {
                  router.push('/budget');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                Orçamento
              </button>
              <button
                onClick={() => {
                  router.push('/goal');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                Metas
              </button>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => {
                  router.push('/settings');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                Configurações
              </button>
              <button
                onClick={() => {
                  router.push('/settings/export');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                Exportar Dados
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 
