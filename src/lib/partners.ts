// =====================================================
// FUNÇÕES SUPABASE PARA SISTEMA DE PARCEIROS - FINANCEANCHOR
// =====================================================

import { supabase } from './supabase';
import { logger } from './logger';
import { getCurrentUser, isGuestUser } from './auth';
import { cache } from './cache';

export interface PartnerData {
  partner_id: string | null;
  partner_name: string | null;
  partner_email: string | null;
  has_partner: boolean;
}

export interface SharedExpense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  is_shared: boolean;
  created_by_name: string;
  created_by_email: string;
}

export interface InvitePartnerResponse {
  success: boolean;
  message: string;
  partner_name?: string;
  partner_email?: string;
}

// Convidar parceiro
export async function invitePartner(partnerEmail: string): Promise<InvitePartnerResponse> {
  try {
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    if (isGuestUser(user)) {
      return { success: false, message: 'Modo visitante: convite desabilitado' };
    }

    const { data, error } = await supabase
      .rpc('invite_partner', {
        p_inviter_id: user.id,
        p_partner_email: partnerEmail
      });

    if (error) {
      logger.error('Erro ao convidar parceiro', error, 'PARTNERS');
      return { success: false, message: 'Erro ao convidar parceiro' };
    }

    return data;
  } catch (error) {
    logger.error('Erro inesperado ao convidar parceiro', error, 'PARTNERS');
    return { success: false, message: 'Erro inesperado ao convidar parceiro' };
  }
}

// Remover parceiro
export async function removePartner(): Promise<InvitePartnerResponse> {
  try {
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    if (isGuestUser(user)) {
      return { success: false, message: 'Modo visitante: remoção desabilitada' };
    }

    const { data, error } = await supabase
      .rpc('remove_partner', {
        p_user_id: user.id
      });

    if (error) {
      logger.error('Erro ao remover parceiro', error, 'PARTNERS');
      return { success: false, message: 'Erro ao remover parceiro' };
    }

    return data;
  } catch (error) {
    logger.error('Erro inesperado ao remover parceiro', error, 'PARTNERS');
    return { success: false, message: 'Erro inesperado ao remover parceiro' };
  }
}

// Obter dados do parceiro
export async function getPartnerData(): Promise<{ partner: PartnerData | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      logger.error('Usuário não autenticado', authError, 'PARTNERS');
      return { partner: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return {
        partner: {
          partner_id: null,
          partner_name: null,
          partner_email: null,
          has_partner: false
        },
        error: null
      };
    }

    logger.info('Buscando dados do parceiro para usuário', { userId: user.id }, 'PARTNERS');

    // Buscar perfil do usuário atual
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logger.error('Erro ao buscar perfil do usuário', profileError, 'PARTNERS');
      return { partner: null, error: profileError };
    }

    logger.info('Perfil do usuário encontrado', { userProfile }, 'PARTNERS');

    // Se o perfil não existe, criar um perfil básico
    if (!userProfile) {
      logger.info('Perfil do usuário não encontrado, criando perfil básico', { userId: user.id }, 'PARTNERS');
      
      // Criar perfil básico
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          partner_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (createError) {
        logger.error('Erro ao criar perfil do usuário', createError, 'PARTNERS');
        return { partner: null, error: createError };
      }

      logger.info('Perfil básico criado com sucesso', { newProfile }, 'PARTNERS');

      // Retornar dados sem parceiro
      return { 
        partner: {
          partner_id: null,
          partner_name: null,
          partner_email: null,
          has_partner: false
        }, 
        error: null 
      };
    }

    // Se não tem parceiro
    if (!userProfile?.partner_id) {
      logger.info('Usuário não tem parceiro vinculado', { userProfile }, 'PARTNERS');
      return { 
        partner: {
          partner_id: null,
          partner_name: null,
          partner_email: null,
          has_partner: false
        }, 
        error: null 
      };
    }

    logger.info('Usuário tem parceiro, buscando dados do parceiro', { partnerId: userProfile.partner_id }, 'PARTNERS');

    // Buscar dados do parceiro
    const { data: partnerProfile, error: partnerError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name
      `)
      .eq('id', userProfile.partner_id)
      .single();

    if (partnerError) {
      logger.error('Erro ao buscar dados do parceiro', partnerError, 'PARTNERS');
      return { partner: null, error: partnerError };
    }

    logger.info('Dados do parceiro encontrados', { partnerProfile }, 'PARTNERS');

    const partnerData: PartnerData = {
      partner_id: partnerProfile.id,
      partner_name: partnerProfile.full_name,
      partner_email: null, // Email não está disponível na tabela profiles
      has_partner: true
    };

    logger.info('Retornando dados do parceiro', { partnerData }, 'PARTNERS');

    return { partner: partnerData, error: null };
  } catch (error) {
    logger.error('Erro inesperado ao buscar dados do parceiro', error, 'PARTNERS');
    return { partner: null, error };
  }
}

// Obter despesas compartilhadas
export async function getSharedExpenses(): Promise<{ expenses: SharedExpense[] | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return { expenses: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { expenses: [], error: null };
    }

    // Primeiro, verificar se o usuário tem parceiro
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logger.error('Erro ao buscar perfil do usuário', profileError, 'PARTNERS');
      return { expenses: null, error: profileError };
    }

    // Se o perfil não existe, retornar array vazio
    if (!userProfile) {
      return { expenses: [], error: null };
    }

    // Se não tem parceiro, retornar array vazio
    if (!userProfile?.partner_id) {
      return { expenses: [], error: null };
    }

    // Buscar despesas compartilhadas (do usuário e do parceiro)
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        id,
        user_id,
        description,
        amount,
        date,
        category,
        is_shared
      `)
      .or(`user_id.eq.${user.id},user_id.eq.${userProfile.partner_id}`)
      .eq('is_shared', true)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erro ao buscar despesas compartilhadas', error, 'PARTNERS');
      return { expenses: null, error };
    }

    // Buscar dados dos perfis separadamente
    const userIds = (expenses || []).map(e => e.user_id);
    let profilesData: any[] = [];

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) {
        logger.error('Erro ao buscar perfis', profilesError, 'PARTNERS');
      } else {
        profilesData = profiles || [];
      }
    }

    // Criar mapa de perfis para acesso rápido
    const profilesMap = new Map(
      profilesData.map(profile => [profile.id, profile])
    );

    // Transformar dados para o formato esperado
    const sharedExpenses: SharedExpense[] = (expenses || []).map(expense => {
      const profile = profilesMap.get(expense.user_id);

      return {
        id: expense.id,
        user_id: expense.user_id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        is_shared: expense.is_shared,
        created_by_name: profile?.full_name || 'Usuário',
        created_by_email: profile?.email || ''
      };
    });

    return { expenses: sharedExpenses, error: null };
  } catch (error) {
    logger.error('Erro inesperado ao buscar despesas compartilhadas', error, 'PARTNERS');
    return { expenses: null, error };
  }
}

// Obter despesas individuais do parceiro
export async function getPartnerIndividualExpenses(): Promise<{ expenses: SharedExpense[] | null; error: any }> {
  try {
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return { expenses: null, error: { message: 'Usuário não autenticado' } };
    }

    if (isGuestUser(user)) {
      return { expenses: [], error: null };
    }

    // Buscar o parceiro do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logger.error('Erro ao buscar perfil do usuário', profileError, 'PARTNERS');
      return { expenses: null, error: profileError };
    }

    // Se não tiver parceiro vinculado
    if (!userProfile?.partner_id) {
      return { expenses: [], error: null };
    }

    // Buscar despesas individuais do parceiro
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        id,
        user_id,
        description,
        amount,
        date,
        category,
        is_shared
      `)
      .eq('user_id', userProfile.partner_id)
      .eq('is_shared', false)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erro ao buscar despesas do parceiro', error, 'PARTNERS');
      return { expenses: null, error };
    }

    // Buscar dados do perfil do parceiro
    const { data: partnerProfile, error: partnerProfileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userProfile.partner_id)
      .single();

    if (partnerProfileError) {
      logger.error('Erro ao buscar perfil do parceiro', partnerProfileError, 'PARTNERS');
    }

    const partnerExpenses: SharedExpense[] = (expenses || []).map(expense => {
      return {
        id: expense.id,
        user_id: expense.user_id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        is_shared: expense.is_shared,
        created_by_name: partnerProfile?.full_name || 'Usuário',
        created_by_email: partnerProfile?.email || ''
      };
    });

    return { expenses: partnerExpenses, error: null };
  } catch (error) {
    logger.error('Erro inesperado ao buscar despesas do parceiro', error, 'PARTNERS');
    return { expenses: null, error };
  }
}

// Verificar se usuário tem parceiro
export async function hasPartner(): Promise<{ hasPartner: boolean; error: any }> {
  try {
    const { partner, error } = await getPartnerData();
    
    if (error) {
      return { hasPartner: false, error };
    }

    return { hasPartner: partner?.has_partner || false, error: null };
  } catch (error) {
    logger.error('Erro ao verificar se tem parceiro', error, 'PARTNERS');
    return { hasPartner: false, error };
  }
}

// Função de debug para verificar o estado do sistema de parceiros
export async function debugPartnerSystem(): Promise<any> {
  try {
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return { error: 'Usuário não autenticado' };
    }

    if (isGuestUser(user)) {
      return {
        user: {
          id: user.id,
          email: user.email
        },
        profile: null,
        partner: {
          partner_id: null,
          partner_name: null,
          partner_email: null,
          has_partner: false
        },
        sharedExpenses: {
          count: 0,
          error: null
        },
        partnerExpenses: {
          count: 0,
          error: null
        },
        structure: {
          profiles: {
            hasData: false,
            error: null
          },
          expenses: {
            hasData: false,
            error: null
          }
        }
      };
    }

    logger.info('🔍 Iniciando debug do sistema de parceiros', { userId: user.id }, 'PARTNERS');

    // 1. Verificar perfil do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    logger.info('📊 Perfil do usuário:', { userProfile, profileError }, 'PARTNERS');

    // 2. Verificar se tem parceiro
    const { partner: partnerData, error: partnerError } = await getPartnerData();
    logger.info('👥 Dados do parceiro:', { partnerData, partnerError }, 'PARTNERS');

    // 3. Verificar despesas compartilhadas
    const { expenses: sharedExpenses, error: sharedError } = await getSharedExpenses();
    logger.info('💰 Despesas compartilhadas:', { 
      count: sharedExpenses?.length || 0, 
      error: sharedError 
    }, 'PARTNERS');

    // 4. Verificar despesas do parceiro
    const { expenses: partnerExpenses, error: partnerExpError } = await getPartnerIndividualExpenses();
    logger.info('👤 Despesas do parceiro:', { 
      count: partnerExpenses?.length || 0, 
      error: partnerExpError 
    }, 'PARTNERS');

    // 5. Verificar estrutura da tabela profiles
    const { data: profilesStructure, error: structureError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    logger.info('🏗️ Estrutura da tabela profiles:', { 
      hasData: !!profilesStructure?.length, 
      error: structureError 
    }, 'PARTNERS');

    // 6. Verificar estrutura da tabela expenses
    const { data: expensesStructure, error: expensesStructureError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);

    logger.info('🏗️ Estrutura da tabela expenses:', { 
      hasData: !!expensesStructure?.length, 
      error: expensesStructureError 
    }, 'PARTNERS');

    return {
      user: {
        id: user.id,
        email: user.email
      },
      profile: userProfile,
      partner: partnerData,
      sharedExpenses: {
        count: sharedExpenses?.length || 0,
        error: sharedError
      },
      partnerExpenses: {
        count: partnerExpenses?.length || 0,
        error: partnerExpError
      },
      structure: {
        profiles: {
          hasData: !!profilesStructure?.length,
          error: structureError
        },
        expenses: {
          hasData: !!expensesStructure?.length,
          error: expensesStructureError
        }
      }
    };

  } catch (error) {
    logger.error('💥 Erro inesperado no debug do sistema de parceiros', error, 'PARTNERS');
    return { error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Função para limpar cache e forçar nova verificação
export async function refreshPartnerData(): Promise<{ success: boolean; message: string }> {
  try {
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    if (isGuestUser(user)) {
      return { success: true, message: 'Modo visitante: nenhum parceiro para recarregar' };
    }

    logger.info('🔄 Limpando cache e forçando nova verificação', { userId: user.id }, 'PARTNERS');

    // Limpar cache relacionado a parceiros
    const cacheKeys = [
      `partner_data_${user.id}`,
      `shared_expenses_${user.id}`,
      `partner_expenses_${user.id}`
    ];

    cacheKeys.forEach(key => {
      // Como não temos método delete no cache, vamos sobrescrever com dados vazios
      cache.set(key, null, 1); // TTL de 1ms para expirar imediatamente
    });

    // Forçar nova verificação dos dados
    const { partner: partnerData, error: partnerError } = await getPartnerData();
    
    if (partnerError) {
      logger.error('❌ Erro ao recarregar dados do parceiro', partnerError, 'PARTNERS');
      return { success: false, message: 'Erro ao recarregar dados do parceiro' };
    }

    logger.info('✅ Dados do parceiro recarregados com sucesso', { partnerData }, 'PARTNERS');

    return { 
      success: true, 
      message: partnerData?.has_partner 
        ? `Parceiro recarregado: ${partnerData.partner_name}` 
        : 'Nenhum parceiro encontrado' 
    };

  } catch (error) {
    logger.error('💥 Erro inesperado ao recarregar dados do parceiro', error, 'PARTNERS');
    return { success: false, message: 'Erro inesperado ao recarregar dados' };
  }
}
