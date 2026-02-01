import { supabase } from './supabase';
import { getCurrentUser, isGuestUser } from './auth';
import { Budget, CreateBudgetData, UpdateBudgetData, BudgetStatus, BudgetSummary } from '@/types/budget';

// Criar novo orçamento
export async function createBudget(budgetData: CreateBudgetData): Promise<{ budget: Budget | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { budget: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { budget: null, error: { message: 'Modo visitante: criação desabilitada' } };
    }

    // Se não especificado, usar mês atual
    const month = budgetData.month || new Date().toISOString().slice(0, 7);

    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        month,
        category: budgetData.category,
        limit_amount: budgetData.limit_amount
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar orçamento:', error);
      return { budget: null, error };
    }

    return { budget, error: null };
  } catch (error) {
    console.error('Erro inesperado ao criar orçamento:', error);
    return { budget: null, error };
  }
}

// Buscar orçamentos do usuário
export async function getUserBudgets(month?: string): Promise<{ budgets: Budget[] | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { budgets: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { budgets: [], error: null };
    }

    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', targetMonth)
      .order('category');

    if (error) {
      console.error('Erro ao buscar orçamentos:', error);
      return { budgets: null, error };
    }

    return { budgets, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar orçamentos:', error);
    return { budgets: null, error };
  }
}

// Buscar status do orçamento (usando função SQL)
export async function getBudgetStatus(month?: string): Promise<{ budgetStatus: BudgetStatus[] | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { budgetStatus: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { budgetStatus: [], error: null };
    }

    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const { data, error } = await supabase
      .rpc('get_budget_status', {
        p_user_id: user.id,
        p_month: targetMonth
      });

    if (error) {
      console.error('Erro ao buscar status do orçamento:', error);
      return { budgetStatus: null, error };
    }

    return { budgetStatus: data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar status do orçamento:', error);
    return { budgetStatus: null, error };
  }
}

// Buscar resumo do orçamento total
export async function getBudgetSummary(month?: string): Promise<{ budgetSummary: BudgetSummary | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { budgetSummary: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return {
        budgetSummary: {
          total_budget: 0,
          total_spent: 0,
          percentage_used: 0,
          status_color: 'green'
        },
        error: null
      };
    }

    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const { data, error } = await supabase
      .rpc('get_budget_summary', {
        p_user_id: user.id,
        p_month: targetMonth
      });

    if (error) {
      console.error('Erro ao buscar resumo do orçamento:', error);
      return { budgetSummary: null, error };
    }

    // A função retorna um array, pegamos o primeiro item
    const summary = data && data.length > 0 ? data[0] : {
      total_budget: 0,
      total_spent: 0,
      percentage_used: 0,
      status_color: 'green' as const
    };

    return { budgetSummary: summary, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar resumo do orçamento:', error);
    return { budgetSummary: null, error };
  }
}

// Atualizar orçamento
export async function updateBudget(id: string, updates: UpdateBudgetData): Promise<{ budget: Budget | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { budget: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { budget: null, error: { message: 'Modo visitante: edição desabilitada' } };
    }

    const { data: budget, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar orçamento:', error);
      return { budget: null, error };
    }

    return { budget, error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar orçamento:', error);
    return { budget: null, error };
  }
}

// Deletar orçamento
export async function deleteBudget(id: string): Promise<{ success: boolean; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { success: false, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { success: false, error: { message: 'Modo visitante: exclusão desabilitada' } };
    }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar orçamento:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro inesperado ao deletar orçamento:', error);
    return { success: false, error };
  }
}

// Buscar orçamento por ID
export async function getBudgetById(id: string): Promise<{ budget: Budget | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { budget: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { budget: null, error: null };
    }

    const { data: budget, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar orçamento:', error);
      return { budget: null, error };
    }

    return { budget, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar orçamento:', error);
    return { budget: null, error };
  }
}

// Buscar orçamento por categoria e mês
export async function getBudgetByCategory(category: string, month?: string): Promise<{ budget: Budget | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return { budget: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { budget: null, error: null };
    }

    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const { data: budget, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', category)
      .eq('month', targetMonth)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Não encontrado - retornar null sem erro
        return { budget: null, error: null };
      }
      console.error('Erro ao buscar orçamento por categoria:', error);
      return { budget: null, error };
    }

    return { budget, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar orçamento por categoria:', error);
    return { budget: null, error };
  }
} 
