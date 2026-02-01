import { supabase } from './supabase';
import { getCurrentUser, isGuestUser } from './auth';
import { Achievement, AchievementType, AchievementConfig, AchievementProgress } from '../types/achievement';
import { Expense } from '../types/expense';
import { Goal } from '../types/goal';
import { Debt } from '../types/debt';
import { Budget } from '../types/budget';

// Configuração das conquistas disponíveis
export const ACHIEVEMENT_CONFIGS: Record<AchievementType, AchievementConfig> = {
  primeiro_gasto: {
    type: 'primeiro_gasto',
    title: '🧠 Primeiro Passo',
    description: 'Você registrou seu primeiro gasto!',
    icon: '🧠',
    color: 'bg-blue-500',
    condition: (data: { expenses: Expense[] }) => data.expenses.length === 1
  },
  semana_orcamento: {
    type: 'semana_orcamento',
    title: '🔥 Controle Total',
    description: 'Uma semana inteira abaixo do orçamento!',
    icon: '🔥',
    color: 'bg-green-500',
    condition: (data: { weeklySpending: number; weeklyBudget: number }) => 
      data.weeklySpending <= data.weeklyBudget
  },
  meta_atingida: {
    type: 'meta_atingida',
    title: '🎯 Meta Conquistada',
    description: 'Você atingiu uma meta financeira!',
    icon: '🎯',
    color: 'bg-purple-500',
    condition: (data: { goals: Goal[] }) => 
      data.goals.some(goal => (goal.percentage_completed || 0) >= 100)
  },
  mil_economizados: {
    type: 'mil_economizados',
    title: '💸 Mil Reais Economizados',
    description: 'Você economizou R$1.000!',
    icon: '💸',
    color: 'bg-yellow-500',
    condition: (data: { totalSaved: number }) => data.totalSaved >= 1000
  },
  divida_zerada: {
    type: 'divida_zerada',
    title: '✅ Dívida Zerada',
    description: 'Você quitou uma dívida completamente!',
    icon: '✅',
    color: 'bg-red-500',
    condition: (data: { debts: Debt[] }) => 
      data.debts.some(debt => debt.remaining_amount === 0)
  },
  '30_dias_app': {
    type: '30_dias_app',
    title: '💪 30 Dias de Dedicação',
    description: '30 dias seguidos usando o app!',
    icon: '💪',
    color: 'bg-indigo-500',
    condition: (data: { consecutiveDays: number }) => data.consecutiveDays >= 30
  },
  primeira_meta: {
    type: 'primeira_meta',
    title: '🎯 Primeira Meta',
    description: 'Você criou sua primeira meta financeira!',
    icon: '🎯',
    color: 'bg-pink-500',
    condition: (data: { goals: Goal[] }) => data.goals.length === 1
  },
  orcamento_mensal: {
    type: 'orcamento_mensal',
    title: '📊 Orçamento Mensal',
    description: 'Você criou um orçamento mensal!',
    icon: '📊',
    color: 'bg-teal-500',
    condition: (data: { budgets: Budget[] }) => data.budgets.length >= 1
  },
  sem_dividas_mes: {
    type: 'sem_dividas_mes',
    title: '🆓 Mês Sem Dívidas',
    description: 'Um mês inteiro sem novas dívidas!',
    icon: '🆓',
    color: 'bg-emerald-500',
    condition: (data: { newDebtsThisMonth: number }) => data.newDebtsThisMonth === 0
  },
  economia_consistente: {
    type: 'economia_consistente',
    title: '💰 Economia Consistente',
    description: '3 meses seguidos economizando!',
    icon: '💰',
    color: 'bg-orange-500',
    condition: (data: { monthsSaving: number }) => data.monthsSaving >= 3
  }
};

// Função para obter conquistas do usuário
export async function getUserAchievements(): Promise<Achievement[]> {
  try {
    const { user } = await getCurrentUser();
    if (!user || isGuestUser(user)) {
      return [];
    }

    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar conquistas:', error);
    return [];
  }
}

// Função para verificar se usuário já tem uma conquista
export async function hasAchievement(type: AchievementType): Promise<boolean> {
  try {
    const { user } = await getCurrentUser();
    if (!user || isGuestUser(user)) return false;

    const { data, error } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', type)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Erro ao verificar conquista:', error);
    return false;
  }
}

// Função para adicionar conquista
export async function addAchievement(
  type: AchievementType,
  title: string,
  description: string
): Promise<boolean> {
  try {
    const { user } = await getCurrentUser();
    if (!user || isGuestUser(user)) return false;

    // Verifica se já tem a conquista
    const alreadyHas = await hasAchievement(type);
    if (alreadyHas) return false;

    // Adiciona a conquista
    const { error } = await supabase
      .from('achievements')
      .insert({
        user_id: user.id,
        type,
        title,
        description
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao adicionar conquista:', error);
    return false;
  }
}

// Função para verificar conquistas automaticamente
export async function checkAchievements(data: {
  expenses?: any[];
  goals?: any[];
  debts?: any[];
  budgets?: any[];
  weeklySpending?: number;
  weeklyBudget?: number;
  totalSaved?: number;
  consecutiveDays?: number;
  newDebtsThisMonth?: number;
  monthsSaving?: number;
}): Promise<AchievementType[]> {
  const newAchievements: AchievementType[] = [];

  for (const [type, config] of Object.entries(ACHIEVEMENT_CONFIGS)) {
    try {
      const userHasAchievement = await hasAchievement(type as AchievementType);
      if (!userHasAchievement && config.condition(data)) {
        const success = await addAchievement(
          type as AchievementType,
          config.title,
          config.description
        );
        if (success) {
          newAchievements.push(type as AchievementType);
        }
      }
    } catch (error) {
      console.error(`Erro ao verificar conquista ${type}:`, error);
    }
  }

  return newAchievements;
}

// Função para obter progresso das conquistas
export async function getAchievementProgress(): Promise<AchievementProgress[]> {
  const progress: AchievementProgress[] = [];

  // Progresso para mil reais economizados
  const totalSaved = 0; // TODO: Calcular baseado nos dados
  const progressMil = Math.min((totalSaved / 1000) * 100, 100);
  progress.push({
    type: 'mil_economizados',
    title: '💸 Mil Reais Economizados',
    description: 'Economize R$1.000 para ganhar esta conquista',
    icon: '💸',
    color: 'bg-yellow-500',
    progress: progressMil,
    maxValue: 1000,
    currentValue: totalSaved,
    unit: 'R$'
  });

  // Progresso para 30 dias de uso
  const consecutiveDays = 0; // TODO: Calcular baseado nos dados
  const progress30Dias = Math.min((consecutiveDays / 30) * 100, 100);
  progress.push({
    type: '30_dias_app',
    title: '💪 30 Dias de Dedicação',
    description: 'Use o app por 30 dias seguidos',
    icon: '💪',
    color: 'bg-indigo-500',
    progress: progress30Dias,
    maxValue: 30,
    currentValue: consecutiveDays,
    unit: 'dias'
  });

  return progress;
}

// Função para obter conquistas recentes (últimas 5)
export async function getRecentAchievements(): Promise<Achievement[]> {
  try {
    const achievements = await getUserAchievements();
    return achievements.slice(0, 5);
  } catch (error) {
    console.error('Erro ao buscar conquistas recentes:', error);
    return [];
  }
}

// Função para contar total de conquistas
export async function getAchievementCount(): Promise<number> {
  try {
    const achievements = await getUserAchievements();
    return achievements.length;
  } catch (error) {
    console.error('Erro ao contar conquistas:', error);
    return 0;
  }
} 
