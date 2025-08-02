'use client';
import { useState, useEffect } from 'react';

export default function PushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Verificar se notificações são suportadas
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Configurar notificações
        setupNotifications();
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    }
  };

  const setupNotifications = () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    // Registrar service worker para notificações
    navigator.serviceWorker.ready.then((registration) => {
      console.log('Service Worker pronto para notificações');
    });
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      requireInteraction: false,
      ...options,
    });

    // Adicionar listeners para interação
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  };

  const scheduleNotification = (title: string, delay: number, options?: NotificationOptions) => {
    setTimeout(() => {
      sendNotification(title, options);
    }, delay);
  };

  // Expor funções globalmente para uso em outros componentes
  useEffect(() => {
    (window as any).sendNotification = sendNotification;
    (window as any).scheduleNotification = scheduleNotification;
  }, [permission]);

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      {permission === 'default' && (
        <div className="bg-blue-600 text-white rounded-xl p-4 shadow-lg animate-slide-in-bottom">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Notificações</h3>
              <p className="text-xs opacity-90">Receba lembretes importantes</p>
            </div>
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-white text-blue-600 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Ativar
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 