// =====================================================
// FUNÇÕES SUPABASE PARA METAS - FINANCEANCHOR
// =====================================================

import { supabase } from './supabase';
import { getCurrentUser, isGuestUser } from './auth';
import { Goal, CreateGoalData, UpdateGoalData, GoalSummary } from '@/types/goal';

// Criar nova meta
export async function createGoal(goalData: CreateGoalData): Promise<{ goal: Goal | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { goal: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { goal: null, error: { message: 'Modo visitante: criação desabilitada' } };
    }

    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        ...goalData,
        current_amount: goalData.current_amount || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar meta:', error);
      return { goal: null, error };
    }

    return { goal, error: null };
  } catch (error) {
    console.error('Erro inesperado ao criar meta:', error);
    return { goal: null, error };
  }
}

// Buscar resumo da meta principal
export async function getGoalSummary(): Promise<{ goalSummary: GoalSummary | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { goalSummary: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { goalSummary: null, error: null };
    }

    const { data, error } = await supabase
      .rpc('get_goal_summary', {
        p_user_id: user.id
      });

    if (error) {
      console.error('Erro ao buscar resumo da meta:', error);
      return { goalSummary: null, error };
    }

    // A função retorna um array, pegamos o primeiro item
    const summary = data && data.length > 0 ? data[0] : null;

    return { goalSummary: summary, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar resumo da meta:', error);
    return { goalSummary: null, error };
  }
}

// Buscar todas as metas do usuário
export async function getUserGoals(): Promise<{ goals: Goal[] | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { goals: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { goals: [], error: null };
    }

    const { data, error } = await supabase
      .rpc('get_user_goals', {
        p_user_id: user.id
      });

    if (error) {
      console.error('Erro ao buscar metas:', error);
      return { goals: null, error };
    }

    return { goals: data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar metas:', error);
    return { goals: null, error };
  }
}

// Buscar meta por ID
export async function getGoalById(id: string): Promise<{ goal: Goal | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { goal: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { goal: null, error: null };
    }

    const { data: goal, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar meta:', error);
      return { goal: null, error };
    }

    return { goal, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar meta:', error);
    return { goal: null, error };
  }
}

// Atualizar meta
export async function updateGoal(id: string, updates: UpdateGoalData): Promise<{ goal: Goal | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { goal: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { goal: null, error: { message: 'Modo visitante: edição desabilitada' } };
    }

    const { data: goal, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar meta:', error);
      return { goal: null, error };
    }

    return { goal, error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar meta:', error);
    return { goal: null, error };
  }
}

// Deletar meta
export async function deleteGoal(id: string): Promise<{ success: boolean; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { success: false, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { success: false, error: { message: 'Modo visitante: exclusão desabilitada' } };
    }

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar meta:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro inesperado ao deletar meta:', error);
    return { success: false, error };
  }
}

// Upload de imagem para meta
export async function uploadGoalImage(file: File): Promise<{ url: string | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { url: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { url: null, error: { message: 'Modo visitante: upload desabilitado' } };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('goals')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return { url: null, error };
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('goals')
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Erro inesperado ao fazer upload da imagem:', error);
    return { url: null, error };
  }
}

// Atualizar valor atual da meta
export async function updateGoalProgress(id: string, newAmount: number): Promise<{ goal: Goal | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { goal: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { goal: null, error: { message: 'Modo visitante: atualização desabilitada' } };
    }

    // Buscar meta atual para validar
    const { data: currentGoal, error: fetchError } = await supabase
      .from('goals')
      .select('target_amount')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar meta:', fetchError);
      return { goal: null, error: fetchError };
    }

    // Validar se o novo valor não excede o alvo
    if (newAmount > currentGoal.target_amount) {
      return { goal: null, error: { message: 'Valor atual não pode ser maior que o valor alvo' } };
    }

    const { data: goal, error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar progresso da meta:', error);
      return { goal: null, error };
    }

    return { goal, error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar progresso da meta:', error);
    return { goal: null, error };
  }
}

// Buscar estatísticas das metas
export async function getGoalStats(): Promise<{ stats: any; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { stats: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data: goals, error } = await supabase
      .from('goals')
      .select('target_amount, current_amount, deadline')
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao buscar estatísticas das metas:', error);
      return { stats: null, error };
    }

    const stats = {
      totalGoals: goals.length,
      totalTargetAmount: goals.reduce((sum, goal) => sum + goal.target_amount, 0),
      totalCurrentAmount: goals.reduce((sum, goal) => sum + goal.current_amount, 0),
      averageProgress: goals.length > 0 ? 
        goals.reduce((sum, goal) => sum + (goal.current_amount / goal.target_amount) * 100, 0) / goals.length : 0
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Erro inesperado ao calcular estatísticas das metas:', error);
    return { stats: null, error };
  }
} 
