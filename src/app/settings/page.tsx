'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getProfile, updateProfile } from '@/lib/auth';
import { getPartnerData } from '@/lib/partners';
import { supabase } from '@/lib/supabase';
import { usePreferences, UserPreferences as UserPreferencesType } from '@/lib/preferences';
import { 
  ArrowLeftIcon,
  UserIcon,
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  BellIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  TrophyIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface Profile {
  id: string;
  full_name: string;
  email?: string;
  created_at: string;
}

interface PartnerData {
  has_partner: boolean;
  partner_name: string | null;
  partner_email: string | null;
  partner_id: string | null;
}

// Removido - usando UserPreferencesType do lib/preferences

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const { preferences, updatePreference } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Carregar perfil
      const { profile: userProfile } = await getProfile(user!.id);
      setProfile(userProfile);

      // Carregar dados do parceiro
      const { partner } = await getPartnerData();
      setPartnerData(partner);

      // Preferências são carregadas automaticamente pelo hook usePreferences
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (key: keyof UserPreferencesType, value: boolean) => {
    const success = await updatePreference(key, value);
    if (success) {
      showMessage('success', 'Preferências salvas com sucesso!');
    } else {
      showMessage('error', 'Erro ao salvar preferências');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateProfile = async (fullName: string) => {
    try {
      setSaving(true);
      await updateProfile(user!.id, { full_name: fullName });
      setProfile(prev => prev ? { ...prev, full_name: fullName } : null);
      showMessage('success', 'Perfil atualizado com sucesso!');
    } catch (error) {
      showMessage('error', 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'As senhas não coincidem');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      showMessage('success', 'Senha alterada com sucesso!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showMessage('error', 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.auth.admin.deleteUser(user!.id);
      
      if (error) throw error;
      
      showMessage('success', 'Conta excluída com sucesso');
      signOut();
    } catch (error) {
      showMessage('error', 'Erro ao excluir conta');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const handleUnlinkPartner = async () => {
    try {
      setSaving(true);
      // TODO: Implementar lógica de desvincular parceiro
      showMessage('success', 'Parceiro desvinculado com sucesso!');
      setPartnerData(prev => prev ? { ...prev, has_partner: false, partner_name: null, partner_email: null, partner_id: null } : null);
    } catch (error) {
      showMessage('error', 'Erro ao desvincular parceiro');
    } finally {
      setSaving(false);
      setShowUnlinkModal(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) throw error;
      
      showMessage('success', 'Sessões encerradas com sucesso!');
      signOut();
    } catch (error) {
      showMessage('error', 'Erro ao encerrar sessões');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Configurações
                </h1>
                <p className="text-sm text-gray-600">
                  Gerencie sua conta e preferências
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* A) Perfil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={profile?.full_name || ''}
                onChange={(e) => handleUpdateProfile(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Seu nome completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Alterar Senha
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir Conta
              </button>
            </div>
          </div>
        </div>

        {/* B) Parceria */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <HeartIcon className="w-6 h-6 text-pink-600" />
            <h2 className="text-lg font-semibold text-gray-900">Parceria</h2>
          </div>
          
          {partnerData?.has_partner ? (
            <div className="space-y-4">
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <HeartIcon className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{partnerData.partner_name}</p>
                    <p className="text-sm text-gray-600">{partnerData.partner_email}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowUnlinkModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Desvincular Parceiro
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Você ainda não tem um parceiro vinculado</p>
              <button
                onClick={() => router.push('/partner/invite')}
                className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Convidar Parceiro
              </button>
            </div>
          )}
        </div>

        {/* C) Preferências */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Preferências</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Notificações de orçamento</p>
                <p className="text-sm text-gray-600">Receber alertas quando ultrapassar o orçamento</p>
              </div>
              <button
                onClick={() => savePreferences('notifications_enabled', !preferences.notifications_enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notifications_enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Mostrar conquistas no dashboard</p>
                <p className="text-sm text-gray-600">Exibir seção de conquistas na tela inicial</p>
              </div>
              <button
                onClick={() => savePreferences('achievements_visible', !preferences.achievements_visible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.achievements_visible ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.achievements_visible ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Modo escuro</p>
                <p className="text-sm text-gray-600">Alternar entre tema claro e escuro</p>
              </div>
              <button
                onClick={() => savePreferences('dark_mode', !preferences.dark_mode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.dark_mode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.dark_mode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* D) Exportações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <DocumentArrowDownIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Exportações</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => router.push('/settings/export')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📄</div>
              <p className="font-medium text-gray-900">JSON</p>
              <p className="text-sm text-gray-600">Dados completos</p>
            </button>
            
            <button
              onClick={() => router.push('/settings/export')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📊</div>
              <p className="font-medium text-gray-900">Excel</p>
              <p className="text-sm text-gray-600">Planilha organizada</p>
            </button>
            
            <button
              onClick={() => router.push('/settings/export')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📋</div>
              <p className="font-medium text-gray-900">PDF</p>
              <p className="text-sm text-gray-600">Relatório completo</p>
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Último download: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* E) Segurança */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheckIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Segurança</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Status da sessão</p>
              <p className="font-medium text-gray-900">Sessão ativa</p>
              <p className="text-xs text-gray-500">
                Último login: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSignOutAllDevices}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Sair de Todos os Dispositivos
              </button>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Links Rápidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Links Rápidos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/settings/achievements')}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrophyIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-gray-900">Conquistas</span>
            </button>
            
            <button
              onClick={() => router.push('/settings/export')}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5 text-purple-600" />
              <span className="text-gray-900">Exportar Dados</span>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              FinanceAnchor
            </h3>
            <p className="text-sm text-gray-600">
              Versão 1.0.0 • Copiloto Financeiro para Casais
            </p>
            <p className="text-xs text-gray-500 mt-2">
              © 2024 FinanceAnchor. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Modal - Alterar Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Alterar Senha</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Sua senha atual"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nova senha"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Confirme a nova senha"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Alterar Senha'}
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Excluir Conta */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Excluir Conta</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Desvincular Parceiro */}
      {showUnlinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Desvincular Parceiro</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja desvincular seu parceiro? Esta ação pode ser revertida posteriormente.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleUnlinkPartner}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? 'Desvinculando...' : 'Confirmar Desvinculação'}
              </button>
              <button
                onClick={() => setShowUnlinkModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 