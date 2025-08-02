import { supabase } from './supabase'
import { User, AuthError } from '@supabase/supabase-js'
import { logger } from './logger'

export interface Profile {
  id: string
  full_name: string
  partner_id?: string
  created_at: string
}

// Função para criar novo usuário
export async function signUp(email: string, password: string, fullName: string) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (authError) {
      throw authError
    }

    if (authData.user) {
      // Aguardar um pouco para o trigger funcionar
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar se o perfil foi criado automaticamente
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profileData) {
        console.error('Erro ao verificar perfil:', profileError)
        
        // Tentar criar o perfil manualmente
        const { error: manualProfileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              full_name: fullName,
              created_at: new Date().toISOString(),
            },
          ])

        if (manualProfileError) {
          console.error('Erro ao criar perfil manualmente:', manualProfileError)
          // Não deletar o usuário, apenas logar o erro
          console.warn('Usuário criado mas perfil não foi criado automaticamente')
        }
      }
    }

    return { user: authData.user, error: null }
  } catch (error) {
    return { user: null, error: error as AuthError }
  }
}

// Função para fazer login
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error: error as AuthError }
  }
}

// Função para fazer logout
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    return { error: null }
  } catch (error) {
    return { error: error as AuthError }
  }
}

// Função para obter usuário atual
export async function getCurrentUser() {
  try {
    // Garantir que a sessão esteja carregada antes de buscar o usuário
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      throw sessionError
    }

    if (!session) {
      return { user: null, error: null }
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error as AuthError }
  }
}

// Função para obter perfil do usuário
export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      logger.error('Erro ao buscar perfil', error, 'AUTH');
      return { profile: null, error: error as AuthError };
    }

    // Se o perfil não existe, criar um perfil básico
    if (!data) {
      logger.info('Perfil não encontrado, criando perfil básico', undefined, 'AUTH');
      
      // Obter dados do usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        logger.error('Erro ao obter dados do usuário', userError, 'AUTH');
        return { profile: null, error: userError as AuthError };
      }

      // Criar perfil básico
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          partner_id: null
        })
        .select()
        .single();

      if (createError) {
        logger.error('Erro ao criar perfil', createError, 'AUTH');
        return { profile: null, error: createError as AuthError };
      }

      return { profile: newProfile as Profile, error: null };
    }

    return { profile: data as Profile, error: null };
  } catch (error) {
    logger.error('Erro inesperado ao buscar perfil', error, 'AUTH');
    return { profile: null, error: error as AuthError };
  }
}

// Função para atualizar perfil
export async function updateProfile(userId: string, updates: Partial<Profile>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { profile: data as Profile, error: null }
  } catch (error) {
    return { profile: null, error: error as AuthError }
  }
}

// Função para verificar se usuário está autenticado
export async function isAuthenticated() {
  const { user } = await getCurrentUser()
  return !!user
} 