import { supabase } from './supabase';
import { Expense, CreateExpenseData, UpdateExpenseData } from '@/types/expense';

// Criar nova despesa
export async function createExpense(expenseData: CreateExpenseData): Promise<{ expense: Expense | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { expense: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        ...expenseData
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar despesa:', error);
      return { expense: null, error };
    }

    return { expense, error: null };
  } catch (error) {
    console.error('Erro inesperado ao criar despesa:', error);
    return { expense: null, error };
  }
}

// Buscar despesas do usuário
export async function getUserExpenses(limit = 50): Promise<{ expenses: Expense[] | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { expenses: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar despesas:', error);
      return { expenses: null, error };
    }

    return { expenses, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar despesas:', error);
    return { expenses: null, error };
  }
}

// Buscar despesas do mês atual agrupadas por data
export async function getExpensesByMonth(): Promise<{ expensesByDate: any; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { expensesByDate: null, error: { message: 'Usuário não autenticado' } };
    }

    // Calcular início e fim do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar despesas do mês:', error);
      return { expensesByDate: null, error };
    }

    // Agrupar por data
    const expensesByDate: { [key: string]: Expense[] } = {};
    
    expenses?.forEach(expense => {
      const dateKey = expense.date;
      if (!expensesByDate[dateKey]) {
        expensesByDate[dateKey] = [];
      }
      expensesByDate[dateKey].push(expense);
    });

    // Calcular totais por dia
    const expensesWithTotals = Object.entries(expensesByDate).map(([date, expenses]) => ({
      date,
      expenses,
      total: expenses.reduce((sum, expense) => sum + expense.amount, 0)
    }));

    // Ordenar por data (mais recente primeiro)
    expensesWithTotals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { expensesByDate: expensesWithTotals, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar despesas do mês:', error);
    return { expensesByDate: null, error };
  }
}

// Calcular total da semana atual
export async function getWeeklyTotal(): Promise<{ weeklyTotal: number; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { weeklyTotal: 0, error: { message: 'Usuário não autenticado' } };
    }

    // Calcular início e fim da semana atual (domingo a sábado)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
    endOfWeek.setHours(23, 59, 59, 999);

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('date', startOfWeek.toISOString().split('T')[0])
      .lte('date', endOfWeek.toISOString().split('T')[0]);

    if (error) {
      console.error('Erro ao calcular total semanal:', error);
      return { weeklyTotal: 0, error };
    }

    const weeklyTotal = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    return { weeklyTotal, error: null };
  } catch (error) {
    console.error('Erro inesperado ao calcular total semanal:', error);
    return { weeklyTotal: 0, error };
  }
}

// Buscar despesa por ID
export async function getExpenseById(id: string): Promise<{ expense: Expense | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { expense: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar despesa:', error);
      return { expense: null, error };
    }

    return { expense, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar despesa:', error);
    return { expense: null, error };
  }
}

// Atualizar despesa
export async function updateExpense(id: string, updates: UpdateExpenseData): Promise<{ expense: Expense | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { expense: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar despesa:', error);
      return { expense: null, error };
    }

    return { expense, error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar despesa:', error);
    return { expense: null, error };
  }
}

// Deletar despesa
export async function deleteExpense(id: string): Promise<{ success: boolean; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: { message: 'Usuário não autenticado' } };
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar despesa:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro inesperado ao deletar despesa:', error);
    return { success: false, error };
  }
}

// Upload de comprovante
export async function uploadReceipt(file: File, expenseId: string): Promise<{ url: string | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { url: null, error: { message: 'Usuário não autenticado' } };
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${expenseId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro ao fazer upload:', error);
      return { url: null, error };
    }

    // Gerar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Erro inesperado ao fazer upload:', error);
    return { url: null, error };
  }
}

// Buscar estatísticas de despesas
export async function getExpenseStats(): Promise<{ stats: any; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { stats: null, error: { message: 'Usuário não autenticado' } };
    }

    // Total do mês atual
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: monthlyTotal, error: monthlyError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('date', `${currentMonth}-01`)
      .lte('date', `${currentMonth}-31`);

    if (monthlyError) {
      return { stats: null, error: monthlyError };
    }

    const totalThisMonth = monthlyTotal?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    // Total da semana atual
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    const { data: weeklyTotal, error: weeklyError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('date', startOfWeek.toISOString().split('T')[0])
      .lte('date', endOfWeek.toISOString().split('T')[0]);

    if (weeklyError) {
      return { stats: null, error: weeklyError };
    }

    const totalThisWeek = weeklyTotal?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    return {
      stats: {
        totalThisMonth,
        totalThisWeek,
        totalExpenses: monthlyTotal?.length || 0
      },
      error: null
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar estatísticas:', error);
    return { stats: null, error };
  }
} 