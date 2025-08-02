'use client';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useState, useEffect } from 'react';

export default function OfflineNotification() {
  const { isOffline, isOnline } = useOnlineStatus();
  const [showOffline, setShowOffline] = useState(false);
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShowOffline(true);
      setShowOnline(false);
    } else if (isOnline) {
      setShowOffline(false);
      setShowOnline(true);
      // Esconder notificação online após 3 segundos
      setTimeout(() => setShowOnline(false), 3000);
    }
  }, [isOffline, isOnline]);

  if (!showOffline && !showOnline) return null;

  return (
    <>
      {/* Notificação Offline */}
      {showOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-red-600 text-white px-4 py-3 text-center safe-area-top shadow-lg">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-red-700 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">
                  Você está offline
                </span>
                <p className="text-xs opacity-90 mt-1">
                  Algumas funcionalidades podem não estar disponíveis
                </p>
              </div>
              <button
                onClick={() => setShowOffline(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificação Online */}
      {showOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-green-600 text-white px-4 py-3 text-center safe-area-top shadow-lg">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">
                  Conexão restaurada
                </span>
                <p className="text-xs opacity-90 mt-1">
                  Todas as funcionalidades estão disponíveis
                </p>
              </div>
              <button
                onClick={() => setShowOnline(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 