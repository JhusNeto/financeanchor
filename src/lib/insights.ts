// =====================================================
// FUNÇÕES SUPABASE PARA INSIGHTS - FINANCEANCHOR
// =====================================================

import { supabase } from './supabase';
import { DailyInsight, TodayInsight, UserInsight } from '@/types/insight';

// Obter insight do dia atual (gera automaticamente se não existir)
export async function getTodayInsight(): Promise<{ insight: TodayInsight | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { insight: null, error: { message: 'Usuário não autenticado' } };
    }

    // Primeiro, verificar se já existe insight para hoje
    const { data: existingInsight, error: checkError } = await supabase
      .from('daily_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar insight existente:', checkError);
      return { insight: null, error: checkError };
    }

    // Se já existe insight para hoje, retornar
    if (existingInsight && existingInsight.length > 0) {
      const insight = existingInsight[0];
      return { insight, error: null };
    }

    // Se não existe, tentar gerar um novo insight
    try {
      const { data: generatedInsight, error: generateError } = await supabase
        .rpc('generate_insights', {
          p_user_id: user.id
        });

      if (generateError) {
        console.error('Erro ao gerar insight:', generateError);
        // Se falhar ao gerar, criar um insight padrão
        const { data: defaultInsight, error: createError } = await supabase
          .from('daily_insights')
          .insert({
            user_id: user.id,
            message: 'Continue assim! Cada dia importa. 💪',
            date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar insight padrão:', createError);
          return { insight: null, error: createError };
        }

        return { insight: defaultInsight, error: null };
      }

      // Verificar se o insight gerado é válido
      if (!generatedInsight || generatedInsight.length === 0) {
        const { data: defaultInsight, error: createError } = await supabase
          .from('daily_insights')
          .insert({
            user_id: user.id,
            message: 'Continue assim! Cada dia importa. 💪',
            date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar insight padrão:', createError);
          return { insight: null, error: createError };
        }

        return { insight: defaultInsight, error: null };
      }

      const insight = generatedInsight[0];
      if (!insight || !insight.message) {
        console.error('Insight inválido retornado:', insight);
        return { insight: null, error: { message: 'Formato de insight inválido' } };
      }

      return { insight, error: null };
    } catch (generateError) {
      console.error('Erro inesperado ao gerar insight:', generateError);
      // Criar insight padrão em caso de erro
      const { data: defaultInsight, error: createError } = await supabase
        .from('daily_insights')
        .insert({
          user_id: user.id,
          message: 'Continue assim! Cada dia importa. 💪',
          date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar insight padrão:', createError);
        return { insight: null, error: createError };
      }

      return { insight: defaultInsight, error: null };
    }
  } catch (error) {
    console.error('Erro inesperado ao buscar insight do dia:', error);
    return { insight: null, error };
  }
}

// Obter insights dos últimos dias
export async function getUserInsights(days: number = 7): Promise<{ insights: UserInsight[] | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { insights: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data, error } = await supabase
      .rpc('get_user_insights', {
        p_user_id: user.id,
        p_days: days
      });

    if (error) {
      console.error('Erro ao buscar insights:', error);
      return { insights: null, error };
    }

    return { insights: data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar insights:', error);
    return { insights: null, error };
  }
}

// Gerar insight manualmente
export async function generateInsight(): Promise<{ insight: TodayInsight | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { insight: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data, error } = await supabase
      .rpc('generate_insights', {
        p_user_id: user.id
      });

    if (error) {
      console.error('Erro ao gerar insight:', error);
      return { insight: null, error };
    }

    // Verificar se data existe e não está vazio
    if (!data || data.length === 0) {
      return { insight: null, error: { message: 'Nenhum insight foi gerado' } };
    }

    // A função retorna um array, pegamos o primeiro item
    const insight = data[0];

    // Verificar se o insight tem os campos necessários
    if (!insight || !insight.message) {
      console.error('Insight inválido retornado:', insight);
      return { insight: null, error: { message: 'Formato de insight inválido' } };
    }

    return { insight, error: null };
  } catch (error) {
    console.error('Erro inesperado ao gerar insight:', error);
    return { insight: null, error };
  }
}

// Criar insight manualmente
export async function createInsight(message: string): Promise<{ insight: DailyInsight | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { insight: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data: insight, error } = await supabase
      .from('daily_insights')
      .insert({
        user_id: user.id,
        message,
        date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar insight:', error);
      return { insight: null, error };
    }

    return { insight, error: null };
  } catch (error) {
    console.error('Erro inesperado ao criar insight:', error);
    return { insight: null, error };
  }
}

// Deletar insight
export async function deleteInsight(id: string): Promise<{ success: boolean; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: { message: 'Usuário não autenticado' } };
    }

    const { error } = await supabase
      .from('daily_insights')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar insight:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro inesperado ao deletar insight:', error);
    return { success: false, error };
  }
}

// Buscar insight por ID
export async function getInsightById(id: string): Promise<{ insight: DailyInsight | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { insight: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data: insight, error } = await supabase
      .from('daily_insights')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar insight:', error);
      return { insight: null, error };
    }

    return { insight, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar insight:', error);
    return { insight: null, error };
  }
}

// Buscar estatísticas de insights
export async function getInsightStats(): Promise<{ stats: any; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { stats: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data: insights, error } = await supabase
      .from('daily_insights')
      .select('message, created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar estatísticas de insights:', error);
      return { stats: null, error };
    }

    const stats = {
      totalInsights: insights.length,
      thisWeekInsights: insights.filter(i => {
        const insightDate = new Date(i.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return insightDate >= weekAgo;
      }).length,
      thisMonthInsights: insights.filter(i => {
        const insightDate = new Date(i.created_at);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return insightDate >= monthAgo;
      }).length
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Erro inesperado ao calcular estatísticas de insights:', error);
    return { stats: null, error };
  }
}

// Verificar se já existe insight para hoje
export async function hasTodayInsight(): Promise<{ hasInsight: boolean; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { hasInsight: false, error: { message: 'Usuário não autenticado' } };
    }

    const { data, error } = await supabase
      .from('daily_insights')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .limit(1);

    if (error) {
      console.error('Erro ao verificar insight do dia:', error);
      return { hasInsight: false, error };
    }

    return { hasInsight: data && data.length > 0, error: null };
  } catch (error) {
    console.error('Erro inesperado ao verificar insight do dia:', error);
    return { hasInsight: false, error };
  }
} 