// =====================================================
// FUNÇÕES SUPABASE PARA SISTEMA DE PARCEIROS - FINANCEANCHOR
// =====================================================

import { supabase } from './supabase';
import { logger } from './logger';
import { getCurrentUser } from './auth';

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
      return { partner: null, error: { message: 'Usuário não autenticado' } };
    }

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

    // Se o perfil não existe, criar um perfil básico
    if (!userProfile) {
      logger.info('Perfil do usuário não encontrado, criando perfil básico', undefined, 'PARTNERS');
      
      // Criar perfil básico
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          partner_id: null
        })
        .select('partner_id')
        .single();

      if (createError) {
        logger.error('Erro ao criar perfil do usuário', createError, 'PARTNERS');
        return { partner: null, error: createError };
      }

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

    const partnerData: PartnerData = {
      partner_id: partnerProfile.id,
      partner_name: partnerProfile.full_name,
      partner_email: null, // Email não está disponível na tabela profiles
      has_partner: true
    };

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
        is_shared,
        profiles!expenses_user_id_fkey (
          full_name,
          email
        )
      `)
      .or(`user_id.eq.${user.id},user_id.eq.${userProfile.partner_id}`)
      .eq('is_shared', true)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erro ao buscar despesas compartilhadas', error, 'PARTNERS');
      return { expenses: null, error };
    }

    // Transformar dados para o formato esperado
    const sharedExpenses: SharedExpense[] = (expenses || []).map(expense => {
      // Supabase returns joined `profiles` data as an array. Grab the first
      // entry when it exists to simplify downstream access.
      const profile = Array.isArray(expense.profiles)
        ? expense.profiles[0]
        : expense.profiles;

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
        is_shared,
        profiles!expenses_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq('user_id', userProfile.partner_id)
      .eq('is_shared', false)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erro ao buscar despesas do parceiro', error, 'PARTNERS');
      return { expenses: null, error };
    }

    const partnerExpenses: SharedExpense[] = (expenses || []).map(expense => {
      const profile = Array.isArray(expense.profiles)
        ? expense.profiles[0]
        : expense.profiles;

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