'use client';

import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">FinanceAnchor</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Transações
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Relatórios
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Configurações
            </a>
          </nav>

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

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Dashboard
              </a>
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Transações
              </a>
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Relatórios
              </a>
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Configurações
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 