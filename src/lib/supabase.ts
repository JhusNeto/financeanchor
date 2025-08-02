import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para testar a conexão com o Supabase
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