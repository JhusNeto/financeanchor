'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            FinanceAnchor
          </h1>
          <p className="text-gray-600 mb-8">
            Seu pulso financeiro diário
          </p>
          
          {/* Teste de cores do Tailwind */}
          <div className="space-y-4 mb-8">
            <div className="bg-blue-600 text-white p-4 rounded-lg">
              Azul - Tailwind funcionando!
            </div>
            <div className="bg-green-600 text-white p-4 rounded-lg">
              Verde - Tailwind funcionando!
            </div>
            <div className="bg-red-600 text-white p-4 rounded-lg">
              Vermelho - Tailwind funcionando!
            </div>
          </div>
          
          <div className="space-y-4">
            <Link
              href="/auth/login"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors block"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors block"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
