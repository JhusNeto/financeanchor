// =====================================================
// FUNÇÕES SUPABASE PARA DÍVIDAS - FINANCEANCHOR
// =====================================================

import { supabase } from './supabase';
import { getCurrentUser, isGuestUser } from './auth';
import { Debt, CreateDebtData, UpdateDebtData, DebtSummary } from '@/types/debt';

// Criar nova dívida
export async function createDebt(debtData: CreateDebtData): Promise<{ debt: Debt | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { debt: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { debt: null, error: { message: 'Modo visitante: criação desabilitada' } };
    }

    const { data: debt, error } = await supabase
      .from('debts')
      .insert({
        user_id: user.id,
        ...debtData
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar dívida:', error);
      return { debt: null, error };
    }

    return { debt, error: null };
  } catch (error) {
    console.error('Erro inesperado ao criar dívida:', error);
    return { debt: null, error };
  }
}

// Buscar todas as dívidas do usuário
export async function getUserDebts(): Promise<{ debts: Debt[] | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { debts: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { debts: [], error: null };
    }

    const { data, error } = await supabase
      .rpc('get_user_debts', {
        p_user_id: user.id
      });

    if (error) {
      console.error('Erro ao buscar dívidas:', error);
      return { debts: null, error };
    }

    return { debts: data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar dívidas:', error);
    return { debts: null, error };
  }
}

// Buscar resumo das dívidas
export async function getDebtsSummary(): Promise<{ debtSummary: DebtSummary | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { debtSummary: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return {
        debtSummary: {
          total_debt: 0,
          total_monthly_payment: 0,
          estimated_months: 0,
          next_due_debt: 'Nenhuma dívida',
          next_due_amount: 0,
          days_until_next_due: 0
        },
        error: null
      };
    }

    const { data, error } = await supabase
      .rpc('get_debts_summary', {
        p_user_id: user.id
      });

    if (error) {
      console.error('Erro ao buscar resumo das dívidas:', error);
      return { debtSummary: null, error };
    }

    // A função retorna um array, pegamos o primeiro item
    const summary = data && data.length > 0 ? data[0] : {
      total_debt: 0,
      total_monthly_payment: 0,
      estimated_months: 0,
      next_due_debt: 'Nenhuma dívida',
      next_due_amount: 0,
      days_until_next_due: 0
    };

    return { debtSummary: summary, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar resumo das dívidas:', error);
    return { debtSummary: null, error };
  }
}

// Buscar dívida por ID
export async function getDebtById(id: string): Promise<{ debt: Debt | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { debt: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { debt: null, error: null };
    }

    const { data: debt, error } = await supabase
      .from('debts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar dívida:', error);
      return { debt: null, error };
    }

    return { debt, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar dívida:', error);
    return { debt: null, error };
  }
}

// Atualizar dívida
export async function updateDebt(id: string, updates: UpdateDebtData): Promise<{ debt: Debt | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { debt: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { debt: null, error: { message: 'Modo visitante: edição desabilitada' } };
    }

    const { data: debt, error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar dívida:', error);
      return { debt: null, error };
    }

    return { debt, error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar dívida:', error);
    return { debt: null, error };
  }
}

// Deletar dívida
export async function deleteDebt(id: string): Promise<{ success: boolean; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { success: false, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { success: false, error: { message: 'Modo visitante: exclusão desabilitada' } };
    }

    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar dívida:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro inesperado ao deletar dívida:', error);
    return { success: false, error };
  }
}

// Buscar dívidas por dia do vencimento
export async function getDebtsByDueDay(dueDay: number): Promise<{ debts: Debt[] | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { debts: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { debts: [], error: null };
    }

    const { data: debts, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .eq('due_day', dueDay)
      .order('name');

    if (error) {
      console.error('Erro ao buscar dívidas por dia do vencimento:', error);
      return { debts: null, error };
    }

    return { debts, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar dívidas por dia do vencimento:', error);
    return { debts: null, error };
  }
}

// Buscar próximas dívidas a vencer (próximos 7 dias)
export async function getUpcomingDebts(days: number = 7): Promise<{ debts: Debt[] | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { debts: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { debts: [], error: null };
    }

    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    // Buscar dívidas que vencem nos próximos X dias
    const { data: debts, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_day', currentDay)
      .lte('due_day', Math.min(currentDay + days, daysInMonth))
      .order('due_day')
      .order('name');

    if (error) {
      console.error('Erro ao buscar próximas dívidas:', error);
      return { debts: null, error };
    }

    return { debts, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar próximas dívidas:', error);
    return { debts: null, error };
  }
}

// Calcular estatísticas das dívidas
export async function getDebtStats(): Promise<{ stats: any; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { stats: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return {
        stats: {
          totalDebts: 0,
          totalAmount: 0,
          totalMonthlyPayment: 0,
          averageMonthlyPayment: 0
        },
        error: null
      };
    }

    const { data: debts, error } = await supabase
      .from('debts')
      .select('total_amount, monthly_payment, start_date')
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao buscar estatísticas das dívidas:', error);
      return { stats: null, error };
    }

    const stats = {
      totalDebts: debts.length,
      totalAmount: debts.reduce((sum, debt) => sum + debt.total_amount, 0),
      totalMonthlyPayment: debts.reduce((sum, debt) => sum + debt.monthly_payment, 0),
      averageMonthlyPayment: debts.length > 0 ? 
        debts.reduce((sum, debt) => sum + debt.monthly_payment, 0) / debts.length : 0
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Erro inesperado ao calcular estatísticas das dívidas:', error);
    return { stats: null, error };
  }
} 
