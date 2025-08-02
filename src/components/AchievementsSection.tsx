'use client';

import { useState, useEffect } from 'react';
import { Achievement, AchievementProgress } from '../types/achievement';
import { getRecentAchievements, getAchievementProgress, getAchievementCount } from '../lib/achievements';

export default function AchievementsSection() {
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const [achievements, progressData, count] = await Promise.all([
        getRecentAchievements(),
        getAchievementProgress(),
        getAchievementCount()
      ]);
      
      setRecentAchievements(achievements);
      setProgress(progressData);
      setTotalCount(count);
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
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
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🏆</span>
          <h3 className="text-lg font-semibold text-gray-800">Conquistas</h3>
        </div>
        <div className="text-sm text-gray-500">
          {totalCount} conquistadas
        </div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Conquistas Recentes</h4>
          <div className="space-y-2">
            {recentAchievements.slice(0, 3).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
              >
                <div className="text-2xl">{achievement.title.split(' ')[0]}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {achievement.title.split(' ').slice(1).join(' ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Section */}
      {progress.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-3">Próximas Conquistas</h4>
          <div className="space-y-3">
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
      )}

      {/* Empty State */}
      {recentAchievements.length === 0 && progress.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎯</div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Nenhuma conquista ainda
          </h4>
          <p className="text-xs text-gray-500">
            Continue usando o app para desbloquear suas primeiras conquistas!
          </p>
        </div>
      )}

      {/* View All Button */}
      {totalCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => window.location.href = '/settings'}
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Ver todas as conquistas →
          </button>
        </div>
      )}
    </div>
  );
} 