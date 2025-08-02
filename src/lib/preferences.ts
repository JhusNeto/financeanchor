import { supabase } from './supabase';

export interface UserPreferences {
  notifications_enabled: boolean;
  achievements_visible: boolean;
  dark_mode: boolean;
  budget_alerts: boolean;
  weekly_reports: boolean;
  partner_notifications: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  notifications_enabled: true,
  achievements_visible: true,
  dark_mode: false,
  budget_alerts: true,
  weekly_reports: false,
  partner_notifications: true
};

// Função para obter preferências do usuário
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Primeiro tenta buscar do localStorage
    const localPreferences = localStorage.getItem(`preferences_${user.id}`);
    if (localPreferences) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(localPreferences) };
    }

    // Se não encontrar no localStorage, retorna as padrões
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Erro ao carregar preferências:', error);
    return DEFAULT_PREFERENCES;
  }
}

// Função para salvar preferências do usuário
export async function saveUserPreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Busca preferências atuais
    const currentPreferences = await getUserPreferences();
    
    // Mescla com as novas preferências
    const updatedPreferences = { ...currentPreferences, ...preferences };
    
    // Salva no localStorage
    localStorage.setItem(`preferences_${user.id}`, JSON.stringify(updatedPreferences));
    
    // TODO: Salvar no Supabase também (quando implementar tabela de preferências)
    // const { error } = await supabase
    //   .from('user_preferences')
    //   .upsert({ user_id: user.id, preferences: updatedPreferences });
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar preferências:', error);
    return false;
  }
}

// Função para resetar preferências para padrão
export async function resetUserPreferences(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Remove do localStorage
    localStorage.removeItem(`preferences_${user.id}`);
    
    return true;
  } catch (error) {
    console.error('Erro ao resetar preferências:', error);
    return false;
  }
}

// Função para verificar se uma preferência específica está habilitada
export async function isPreferenceEnabled(key: keyof UserPreferences): Promise<boolean> {
  try {
    const preferences = await getUserPreferences();
    return preferences[key];
  } catch (error) {
    console.error('Erro ao verificar preferência:', error);
    return DEFAULT_PREFERENCES[key];
  }
}

// Hook para usar preferências no React
export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const userPreferences = await getUserPreferences();
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: boolean) => {
    try {
      const success = await saveUserPreferences({ [key]: value });
      if (success) {
        setPreferences(prev => ({ ...prev, [key]: value }));
      }
      return success;
    } catch (error) {
      console.error('Erro ao atualizar preferência:', error);
      return false;
    }
  };

  const resetPreferences = async () => {
    try {
      const success = await resetUserPreferences();
      if (success) {
        setPreferences(DEFAULT_PREFERENCES);
      }
      return success;
    } catch (error) {
      console.error('Erro ao resetar preferências:', error);
      return false;
    }
  };

  return {
    preferences,
    loading,
    updatePreference,
    resetPreferences,
    isEnabled: (key: keyof UserPreferences) => preferences[key]
  };
}

// Import necessário para o hook
import { useState, useEffect } from 'react'; 