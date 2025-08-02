'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getUserDebts, getDebtsSummary, deleteDebt } from '@/lib/debts';
import { Debt, DebtSummary, formatCurrency, getUrgencyText, getDebtProgressColor } from '@/types/debt';

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user: currentUser, error } = await getCurrentUser();

      if (error || !currentUser) {
        router.push('/auth/login');
        return;
      }

      await loadDebts();
      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      router.push('/auth/login');
    }
  };

  const loadDebts = async () => {
    try {
      const [debtsResult, summaryResult] = await Promise.all([
        getUserDebts(),
        getDebtsSummary()
      ]);

      if (debtsResult.error) {
        console.error('Erro ao carregar dívidas:', debtsResult.error);
      } else {
        setDebts(debtsResult.debts || []);
      }

      if (summaryResult.error) {
        console.error('Erro ao carregar resumo das dívidas:', summaryResult.error);
      } else {
        setDebtSummary(summaryResult.debtSummary);
      }
    } catch (error) {
      console.error('Erro ao carregar dados das dívidas:', error);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta dívida?')) {
      return;
    }

    try {
      const { success, error } = await deleteDebt(debtId);
      
      if (error) {
        console.error('Erro ao deletar dívida:', error);
        alert('Erro ao deletar dívida. Tente novamente.');
        return;
      }

      if (success) {
        await loadDebts(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro inesperado ao deletar dívida:', error);
      alert('Erro inesperado. Tente novamente.');
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dívidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Minhas Dívidas</h1>
            </div>
            <Link
              href="/debts/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nova Dívida</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Resumo Geral */}
        {debtSummary && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total de Dívidas</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(debtSummary.total_debt)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Parcela Mensal</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(debtSummary.total_monthly_payment)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Liberdade em</p>
                <p className="text-3xl font-bold text-green-600">
                  {debtSummary.estimated_months} meses
                </p>
              </div>
            </div>

            {/* Próxima Parcela */}
            {debtSummary.next_due_debt !== 'Nenhuma dívida' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 font-medium">Próxima Parcela</p>
                    <p className="text-lg font-bold text-orange-800">
                      {debtSummary.next_due_debt} - {formatCurrency(debtSummary.next_due_amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getUrgencyText(debtSummary.days_until_next_due).color}`}>
                      {debtSummary.days_until_next_due} dias
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de Dívidas */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Suas Dívidas</h2>
            <p className="text-gray-600 mt-1">
              {debts.length === 0 ? 'Nenhuma dívida cadastrada' : `${debts.length} dívida${debts.length !== 1 ? 's' : ''} cadastrada${debts.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {debts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma dívida cadastrada</h3>
              <p className="text-gray-600 mb-6">Comece cadastrando sua primeira dívida para acompanhar seus pagamentos.</p>
              <Link
                href="/debts/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Cadastrar Primeira Dívida</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {debts.map((debt) => (
                <div key={debt.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{debt.name}</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getUrgencyText(debt.due_day).color}`}>
                          Dia {debt.due_day}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Valor Total</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(debt.total_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Parcela Mensal</p>
                          <p className="text-lg font-semibold text-orange-600">
                            {formatCurrency(debt.monthly_payment)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Restante</p>
                          <p className={`text-lg font-semibold ${getDebtProgressColor(debt.remaining_amount || 0, debt.total_amount)}`}>
                            {formatCurrency(debt.remaining_amount || 0)}
                          </p>
                        </div>
                      </div>

                      {/* Progresso da dívida */}
                      {debt.remaining_amount !== undefined && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progresso</span>
                            <span>{Math.round(((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Início: {new Date(debt.start_date).toLocaleDateString('pt-BR')}</span>
                        {debt.months_paid !== undefined && (
                          <span>• {debt.months_paid} meses pagos</span>
                        )}
                        {debt.months_remaining !== undefined && (
                          <span>• {debt.months_remaining} meses restantes</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/debts/edit/${debt.id}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-2"
                        title="Editar dívida"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDeleteDebt(debt.id)}
                        className="text-red-600 hover:text-red-800 transition-colors p-2"
                        title="Excluir dívida"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

 