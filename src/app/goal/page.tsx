'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getGoalSummary, updateGoalProgress } from '@/lib/goals';
import { GoalSummary, formatCurrency, getMotivationalText, getGoalEmoji, formatTimeRemaining, getGoalProgressColor } from '@/types/goal';

export default function GoalPage() {
  const [goalSummary, setGoalSummary] = useState<GoalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newAmount, setNewAmount] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user: currentUser, error } = await getCurrentUser();

      if (error || !currentUser) {
        router.push('/auth/login');
        return;
      }

      await loadGoal();
      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      router.push('/auth/login');
    }
  };

  const loadGoal = async () => {
    try {
      const { goalSummary: summaryData, error } = await getGoalSummary();
      
      if (error) {
        console.error('Erro ao carregar meta:', error);
      } else {
        setGoalSummary(summaryData);
        if (summaryData) {
          setNewAmount(summaryData.current_amount.toString());
        }
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar meta:', error);
    }
  };

  const handleUpdateProgress = async () => {
    if (!goalSummary || !newAmount) return;

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Por favor, insira um valor válido.');
      return;
    }

    if (amount > goalSummary.target_amount) {
      alert('O valor atual não pode ser maior que o valor alvo.');
      return;
    }

    setUpdating(true);
    try {
      const { goal, error } = await updateGoalProgress(goalSummary.goal_id, amount);
      
      if (error) {
        console.error('Erro ao atualizar progresso:', error);
        alert('Erro ao atualizar progresso. Tente novamente.');
        return;
      }

      if (goal) {
        await loadGoal(); // Recarregar dados
        alert('Progresso atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro inesperado ao atualizar progresso:', error);
      alert('Erro inesperado. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando sua meta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Minha Meta</h1>
            </div>
            <Link
              href="/goal/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nova Meta</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!goalSummary ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nenhuma meta definida</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Defina sua meta principal para começar a visualizar seu progresso e receber motivação para alcançar seus sonhos.
            </p>
            <Link
              href="/goal/new"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Criar Primeira Meta</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Meta Principal */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Imagem da meta */}
              {goalSummary.image_url && (
                <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 relative">
                  <img
                    src={goalSummary.image_url}
                    alt={goalSummary.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                </div>
              )}

              <div className="p-6">
                {/* Cabeçalho da meta */}
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">{getGoalEmoji(goalSummary.title)}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{goalSummary.title}</h2>
                    <p className="text-gray-600">Prazo: {new Date(goalSummary.deadline).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Progresso */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progresso</span>
                    <span className="text-sm font-bold text-gray-900">
                      {goalSummary.percentage_completed.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 ease-out ${
                        goalSummary.percentage_completed >= 100 ? 'bg-green-500' :
                        goalSummary.percentage_completed >= 75 ? 'bg-blue-500' :
                        goalSummary.percentage_completed >= 50 ? 'bg-yellow-500' :
                        goalSummary.percentage_completed >= 25 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(goalSummary.percentage_completed, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Valor Alvo</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(goalSummary.target_amount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Valor Atual</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(goalSummary.current_amount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Faltam</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(goalSummary.amount_remaining)}
                    </p>
                  </div>
                </div>

                {/* Tempo e economia diária */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 mb-1">Tempo Restante</p>
                    <p className="text-lg font-bold text-blue-800">
                      {formatTimeRemaining(goalSummary.days_remaining)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">Economia Diária</p>
                    <p className="text-lg font-bold text-green-800">
                      {formatCurrency(goalSummary.daily_savings_needed)}
                    </p>
                  </div>
                </div>

                {/* Mensagem motivacional */}
                <div className={`rounded-lg p-4 mb-6 ${getGoalProgressColor(goalSummary.percentage_completed)}`}>
                  <p className="text-center font-medium">
                    {getMotivationalText(goalSummary.percentage_completed, goalSummary.days_remaining)}
                  </p>
                </div>

                {/* Atualizar progresso */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Atualizar Progresso</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label htmlFor="newAmount" className="block text-sm font-medium text-gray-700 mb-2">
                        Valor Atual
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">R$</span>
                        <input
                          type="number"
                          id="newAmount"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                          max={goalSummary.target_amount}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleUpdateProgress}
                      disabled={updating}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Atualizando...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Atualizar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-center space-x-4">
              <Link
                href={`/goal/edit/${goalSummary.goal_id}`}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Editar Meta</span>
              </Link>
              <Link
                href="/goal/new"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nova Meta</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 