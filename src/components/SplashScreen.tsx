'use client';
import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simular progresso de carregamento
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsVisible(false), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          FinanceAnchor
        </h1>
        <p className="text-blue-100 text-center text-lg">
          Copiloto Financeiro
        </p>
      </div>

      {/* Barra de Progresso */}
      <div className="w-64 bg-white/20 rounded-full h-2 mb-4">
        <div 
          className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Texto de Status */}
      <p className="text-blue-100 text-sm">
        {progress < 30 && "Inicializando..."}
        {progress >= 30 && progress < 60 && "Carregando dados..."}
        {progress >= 60 && progress < 90 && "Conectando..."}
        {progress >= 90 && "Pronto!"}
      </p>

      {/* Indicador de Carregamento */}
      <div className="mt-6">
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 