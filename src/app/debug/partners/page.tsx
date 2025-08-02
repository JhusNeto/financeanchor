'use client';

import { useState, useEffect } from 'react';
import { debugPartnerSystem, refreshPartnerData } from '@/lib/partners';
import { getCurrentUser } from '@/lib/auth';

export default function DebugPartnersPage() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    const runDebug = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar autenticação
        const { user, error: authError } = await getCurrentUser();
        if (authError || !user) {
          setError('Usuário não autenticado');
          setLoading(false);
          return;
        }

        // Executar debug
        const result = await debugPartnerSystem();
        setDebugData(result);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    runDebug();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Executando debug do sistema de parceiros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erro no Debug</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 Debug do Sistema de Parceiros
          </h1>

          {debugData && (
            <div className="space-y-6">
              {/* Informações do Usuário */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">👤 Informações do Usuário</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">ID:</span>
                    <p className="text-blue-700">{debugData.user?.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Email:</span>
                    <p className="text-blue-700">{debugData.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Perfil do Usuário */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-green-900 mb-4">📊 Perfil do Usuário</h2>
                {debugData.profile ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-800">ID:</span>
                      <p className="text-green-700">{debugData.profile.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Nome:</span>
                      <p className="text-green-700">{debugData.profile.full_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Partner ID:</span>
                      <p className="text-green-700">{debugData.profile.partner_id || 'Nenhum'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Criado em:</span>
                      <p className="text-green-700">{new Date(debugData.profile.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-green-700">Perfil não encontrado</p>
                )}
              </div>

              {/* Dados do Parceiro */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-purple-900 mb-4">👥 Dados do Parceiro</h2>
                {debugData.partner ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-purple-800">Tem Parceiro:</span>
                      <p className="text-purple-700">{debugData.partner.has_partner ? '✅ Sim' : '❌ Não'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-purple-800">Partner ID:</span>
                      <p className="text-purple-700">{debugData.partner.partner_id || 'Nenhum'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-purple-800">Nome do Parceiro:</span>
                      <p className="text-purple-700">{debugData.partner.partner_name || 'Nenhum'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-purple-800">Email do Parceiro:</span>
                      <p className="text-purple-700">{debugData.partner.partner_email || 'Nenhum'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-purple-700">Erro ao carregar dados do parceiro</p>
                )}
              </div>

              {/* Despesas Compartilhadas */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-yellow-900 mb-4">💰 Despesas Compartilhadas</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-yellow-800">Quantidade:</span>
                    <p className="text-yellow-700">{debugData.sharedExpenses?.count || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium text-yellow-800">Status:</span>
                    <p className="text-yellow-700">
                      {debugData.sharedExpenses?.error ? '❌ Erro' : '✅ OK'}
                    </p>
                  </div>
                </div>
                {debugData.sharedExpenses?.error && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
                    {JSON.stringify(debugData.sharedExpenses.error, null, 2)}
                  </div>
                )}
              </div>

              {/* Despesas do Parceiro */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-orange-900 mb-4">👤 Despesas do Parceiro</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-orange-800">Quantidade:</span>
                    <p className="text-orange-700">{debugData.partnerExpenses?.count || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium text-orange-800">Status:</span>
                    <p className="text-orange-700">
                      {debugData.partnerExpenses?.error ? '❌ Erro' : '✅ OK'}
                    </p>
                  </div>
                </div>
                {debugData.partnerExpenses?.error && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
                    {JSON.stringify(debugData.partnerExpenses.error, null, 2)}
                  </div>
                )}
              </div>

              {/* Estrutura das Tabelas */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🏗️ Estrutura das Tabelas</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Tabela Profiles</h3>
                    <div className="text-sm">
                      <p><span className="font-medium">Tem dados:</span> {debugData.structure?.profiles?.hasData ? '✅ Sim' : '❌ Não'}</p>
                      <p><span className="font-medium">Status:</span> {debugData.structure?.profiles?.error ? '❌ Erro' : '✅ OK'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Tabela Expenses</h3>
                    <div className="text-sm">
                      <p><span className="font-medium">Tem dados:</span> {debugData.structure?.expenses?.hasData ? '✅ Sim' : '❌ Não'}</p>
                      <p><span className="font-medium">Status:</span> {debugData.structure?.expenses?.error ? '❌ Erro' : '✅ OK'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📋 Resumo do Sistema</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Usuário autenticado:</span> ✅</p>
                    <p><span className="font-medium">Perfil criado:</span> {debugData.profile ? '✅' : '❌'}</p>
                    <p><span className="font-medium">Tem parceiro:</span> {debugData.partner?.has_partner ? '✅' : '❌'}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Despesas compartilhadas:</span> {debugData.sharedExpenses?.count || 0}</p>
                    <p><span className="font-medium">Despesas do parceiro:</span> {debugData.partnerExpenses?.count || 0}</p>
                    <p><span className="font-medium">Tabelas funcionais:</span> {debugData.structure?.profiles?.hasData && debugData.structure?.expenses?.hasData ? '✅' : '❌'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors mr-4"
            >
              🔄 Atualizar Debug
            </button>
            
            <button
              onClick={async () => {
                try {
                  setRefreshMessage('🔄 Recarregando dados do parceiro...');
                  const result = await refreshPartnerData();
                  setRefreshMessage(result.message);
                  setTimeout(() => setRefreshMessage(null), 3000);
                } catch (error) {
                  setRefreshMessage('❌ Erro ao recarregar dados');
                  setTimeout(() => setRefreshMessage(null), 3000);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              🔄 Recarregar Parceiro
            </button>
            
            {refreshMessage && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">{refreshMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 