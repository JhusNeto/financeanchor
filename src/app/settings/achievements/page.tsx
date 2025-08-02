'use client';

import { useState, useEffect } from 'react';
import { Achievement, AchievementProgress } from '../../../types/achievement';
import { getUserAchievements, getAchievementProgress, getAchievementCount } from '../../../lib/achievements';
import { ACHIEVEMENT_CONFIGS } from '../../../lib/achievements';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const [achievementsData, progressData, count] = await Promise.all([
        getUserAchievements(),
        getAchievementProgress(),
        getAchievementCount()
      ]);
      
      setAchievements(achievementsData);
      setProgress(progressData);
      setTotalCount(count);
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementConfig = (type: string) => {
    return ACHIEVEMENT_CONFIGS[type as keyof typeof ACHIEVEMENT_CONFIGS];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-3xl">🏆</span>
            <h1 className="text-2xl font-bold text-gray-800">Conquistas</h1>
          </div>
          <p className="text-gray-600">
            Você conquistou {totalCount} de {Object.keys(ACHIEVEMENT_CONFIGS).length} conquistas disponíveis
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
            <div className="text-sm text-gray-600">Conquistas Ganhas</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {achievements.length > 0 ? new Date(achievements[0].earned_at).toLocaleDateString('pt-BR') : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Última Conquista</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((totalCount / Object.keys(ACHIEVEMENT_CONFIGS).length) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Progresso Geral</div>
          </div>
        </div>

        {/* Earned Achievements */}
        {achievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Conquistas Ganhas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => {
                const config = getAchievementConfig(achievement.type);
                return (
                  <div
                    key={achievement.id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${config?.color || 'bg-blue-500'}`}>
                        {config?.icon || '🏆'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          Conquistado em {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Section */}
        {progress.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Próximas Conquistas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progress.map((item) => (
                <div
                  key={item.type}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${item.color}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progresso</span>
                      <span className="text-gray-800 font-medium">
                        {item.currentValue}/{item.maxValue} {item.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {Math.round(item.progress)}% completo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Available Achievements */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Todas as Conquistas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(ACHIEVEMENT_CONFIGS).map(([type, config]) => {
              const earned = achievements.some(a => a.type === type);
              return (
                <div
                  key={type}
                  className={`bg-white rounded-lg p-4 shadow-sm border ${
                    earned 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      earned ? config.color : 'bg-gray-300'
                    }`}>
                      {earned ? config.icon : '🔒'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {config.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {config.description}
                      </p>
                      {earned && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Conquistada
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {achievements.length === 0 && progress.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Nenhuma conquista ainda
            </h3>
            <p className="text-gray-600 mb-6">
              Continue usando o app para desbloquear suas primeiras conquistas!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(ACHIEVEMENT_CONFIGS).slice(0, 6).map(([type, config]) => (
                <div
                  key={type}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 opacity-60"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-lg">
                      🔒
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm">
                        {config.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 