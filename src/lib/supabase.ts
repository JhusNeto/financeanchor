import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

// Configuração otimizada do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configurações de autenticação otimizadas
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'financeanchor-auth',
  },
  realtime: {
    // Desabilitar realtime se não estiver usando
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    // Configurações globais otimizadas
    headers: {
      'X-Client-Info': 'financeanchor-web',
    },
  },
});

// Função para limpar dados do Supabase
export function clearSupabaseData() {
  try {
    // Limpar sessão
    supabase.auth.signOut();
    
    // Limpar dados do localStorage relacionados ao Supabase
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`✅ ${keysToRemove.length} chaves do Supabase removidas`);
    }
  } catch (error) {
    console.error('Erro ao limpar dados do Supabase:', error);
  }
}

// Função para testar a conexão com o Supabase (otimizada)
export async function testSupabaseConnection() {
  try {
    // Testar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Testar função RPC básica
    const { data: testData, error: rpcError } = await supabase
      .rpc('get_budget_summary', {
        p_user_id: 'test',
        p_month: '2025-01'
      });
    
    return { success: !authError && !rpcError, authError, rpcError };
  } catch (error) {
    return { success: false, error };
  }
}

// Função para verificar se há problemas de conexão
export async function checkSupabaseHealth() {
  try {
    const startTime = performance.now();
    
    // Teste simples de conexão
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return {
      healthy: !error,
      responseTime,
      error: error?.message
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
} 