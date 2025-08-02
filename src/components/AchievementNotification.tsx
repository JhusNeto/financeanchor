'use client';

import { useState, useEffect } from 'react';
import { Achievement, AchievementType } from '../types/achievement';
import { ACHIEVEMENT_CONFIGS } from '../lib/achievements';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export default function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const config = ACHIEVEMENT_CONFIGS[achievement.type as AchievementType];

  useEffect(() => {
    // Animação de entrada
    setIsVisible(true);
    setShowConfetti(true);

    // Tocar som de conquista (se disponível)
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio('/achievement-sound.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignora erro se o arquivo não existir
        });
      } catch (error) {
        // Ignora erros de áudio
      }
    }

    // Vibrar dispositivo (se disponível)
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (error) {
        // Ignora erros de vibração
      }
    }

    // Auto-close após 5 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <span className="text-2xl">
                {['🎉', '🎊', '⭐', '🏆', '💎'][Math.floor(Math.random() * 5)]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Notification Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        
        <div className={`relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}>
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Achievement Content */}
          <div className="text-center">
            {/* Icon */}
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl animate-pulse ${config?.color || 'bg-blue-500'}`}>
              {config?.icon || '🏆'}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {achievement.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-4">
              {achievement.description}
            </p>

            {/* Earned Date */}
            <p className="text-sm text-gray-500">
              Conquistado em {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
            </p>

            {/* Celebration Message */}
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
              <p className="text-sm font-medium text-orange-800">
                🎉 Parabéns! Continue assim!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook para gerenciar notificações de conquistas
export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<Achievement[]>([]);

  const addNotification = (achievement: Achievement) => {
    setNotifications(prev => [...prev, achievement]);
  };

  const removeNotification = (achievementId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== achievementId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
} 