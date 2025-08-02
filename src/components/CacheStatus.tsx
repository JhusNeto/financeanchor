'use client';
import { useState, useEffect } from 'react';

interface CacheInfo {
  name: string;
  size: number;
  entries: number;
}

export default function CacheStatus() {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkCacheStatus = async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const cacheData: CacheInfo[] = [];

          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            const size = keys.length;
            
            cacheData.push({
              name,
              size: size,
              entries: size
            });
          }

          setCacheInfo(cacheData);
        } catch (error) {
          console.error('Erro ao verificar cache:', error);
        }
      }
    };

    checkCacheStatus();
  }, []);

  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        setCacheInfo([]);
        alert('Cache limpo com sucesso!');
      } catch (error) {
        console.error('Erro ao limpar cache:', error);
        alert('Erro ao limpar cache');
      }
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-40 touch-target"
        title="Status do Cache"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Status do Cache PWA</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {cacheInfo.length > 0 ? (
        <div className="space-y-2 mb-3">
          {cacheInfo.map((cache) => (
            <div key={cache.name} className="flex justify-between text-xs">
              <span className="text-gray-600">{cache.name}</span>
              <span className="text-gray-900 font-medium">{cache.entries} itens</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mb-3">Nenhum cache encontrado</p>
      )}

      <div className="flex space-x-2">
        <button
          onClick={clearCache}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded transition-colors touch-target"
        >
          Limpar Cache
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded transition-colors touch-target"
        >
          Recarregar
        </button>
      </div>
    </div>
  );
} 