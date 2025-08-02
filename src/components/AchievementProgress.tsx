'use client';

import { useState, useEffect } from 'react';
import { AchievementProgress as AchievementProgressType } from '../types/achievement';
import { getAchievementProgress } from '../lib/achievements';

export default function AchievementProgress() {
  const [progress, setProgress] = useState<AchievementProgressType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const progressData = await getAchievementProgress();
      setProgress(progressData);
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (progress.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Nenhum progresso disponível
          </h3>
          <p className="text-xs text-gray-500">
            Continue usando o app para ver seu progresso
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Progresso das Conquistas
      </h3>
      
      <div className="space-y-4">
        {progress.map((item) => (
          <div key={item.type} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {item.title}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {item.currentValue}/{item.maxValue} {item.unit}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-gray-500">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 