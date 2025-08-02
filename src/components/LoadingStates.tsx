'use client';
import { useState, useEffect } from 'react';

interface LoadingStatesProps {
  children: React.ReactNode;
}

export default function LoadingStates({ children }: LoadingStatesProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Carregando...');

  useEffect(() => {
    // Simular progresso de carregamento
    const loadingSteps = [
      { progress: 20, message: 'Inicializando...' },
      { progress: 40, message: 'Carregando dados...' },
      { progress: 60, message: 'Conectando...' },
      { progress: 80, message: 'Finalizando...' },
      { progress: 100, message: 'Pronto!' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setLoadingProgress(step.progress);
        setLoadingMessage(step.message);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex flex-col items-center justify-center">
        {/* Logo animado */}
        <div className="mb-8 animate-bounce-in">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white text-center">
            FinanceAnchor
          </h1>
        </div>

        {/* Barra de progresso */}
        <div className="w-64 bg-white/20 rounded-full h-3 mb-4 overflow-hidden">
          <div 
            className="bg-white h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>

        {/* Mensagem de status */}
        <p className="text-blue-100 text-sm font-medium mb-6">
          {loadingMessage}
        </p>

        {/* Indicadores de carregamento */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-white/60 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        {/* Dicas de carregamento */}
        <div className="mt-8 text-center">
          <p className="text-blue-200 text-xs opacity-75">
            Dica: Você pode instalar este app no seu dispositivo
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Componente para loading states específicos
export function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
}

// Componente para loading de cards
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

// Componente para loading de listas
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente para loading de botões
export function ButtonSkeleton() {
  return (
    <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-24"></div>
  );
} 