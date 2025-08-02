'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getExpensesByMonth, getWeeklyTotal, deleteExpense } from '@/lib/expenses';
import { getCurrentUser } from '@/lib/auth';
import { CATEGORY_ICONS, CATEGORY_COLORS, Expense } from '@/types/expense';
import { getPartnerData, getSharedExpenses, getPartnerIndividualExpenses, PartnerData, SharedExpense } from '@/lib/partners';

interface ExpenseGroup {
  date: string;
  expenses: Expense[];
  total: number;
}

export default function ExpensesPage() {
  const [expensesByDate, setExpensesByDate] = useState<ExpenseGroup[]>([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>([]);
  const [partnerExpenses, setPartnerExpenses] = useState<SharedExpense[]>([]);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    checkAuth();
    loadExpenses();
  }, []);

  const checkAuth = async () => {
    try {
      const { user, error } = await getCurrentUser();
      if (error || !user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
    } catch (error) {
      router.push('/auth/login');
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      
      // Carregar despesas do mês
      const { expensesByDate: monthData, error: monthError } = await getExpensesByMonth();
      if (monthError) {
        setError('Erro ao carregar despesas do mês');
        return;
      }
      setExpensesByDate(monthData || []);

      // Carregar total semanal
      const { weeklyTotal: weekTotal, error: weekError } = await getWeeklyTotal();
      if (weekError) {
        console.error('Erro ao carregar total semanal:', weekError);
      } else {
        setWeeklyTotal(weekTotal);
      }

      // Carregar dados do parceiro e despesas compartilhadas
      const { partner: partnerDataResult } = await getPartnerData();
      setPartnerData(partnerDataResult);

      if (partnerDataResult?.has_partner) {
        const { expenses: sharedExpensesData } = await getSharedExpenses();
        setSharedExpenses(sharedExpensesData || []);

        const { expenses: partnerExpensesData } = await getPartnerIndividualExpenses();
        setPartnerExpenses(partnerExpensesData || []);
      }

    } catch (error) {
      console.error('Erro inesperado:', error);
      setError('Erro inesperado ao carregar despesas');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Resetar horas para comparação
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Hoje';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long'
      });
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

    const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      setDeletingExpense(expenseId);
      
      const { success, error } = await deleteExpense(expenseId);
      
      if (success) {
        // Recarregar apenas despesas individuais, mantendo as compartilhadas
        const { expensesByDate: monthData, error: monthError } = await getExpensesByMonth();
        if (!monthError) {
          setExpensesByDate(monthData || []);
        }
        
        // Recarregar total semanal
        const { weeklyTotal: weekTotal } = await getWeeklyTotal();
        setWeeklyTotal(weekTotal);
        
        setShowDeleteConfirm(null);
      } else {
        console.error('Erro ao deletar despesa:', error);
        alert('Erro ao deletar despesa. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro inesperado ao deletar despesa:', error);
      alert('Erro inesperado ao deletar despesa.');
    } finally {
      setDeletingExpense(null);
    }
  };

  const handleDeleteSharedExpense = async (expenseId: string) => {
    try {
      setDeletingExpense(expenseId);
      
      const { success, error } = await deleteExpense(expenseId);
      
      if (success) {
        // Recarregar apenas despesas compartilhadas
        if (partnerData?.has_partner) {
          const { expenses: sharedExpensesData } = await getSharedExpenses();
          setSharedExpenses(sharedExpensesData || []);
        }
        
        setShowDeleteConfirm(null);
      } else {
        console.error('Erro ao deletar despesa compartilhada:', error);
        alert('Erro ao deletar despesa compartilhada. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro inesperado ao deletar despesa compartilhada:', error);
      alert('Erro inesperado ao deletar despesa compartilhada.');
    } finally {
      setDeletingExpense(null);
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
          <p className="mt-4 text-gray-600">Carregando suas despesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 safe-area-top">
        <div className="max-w-screen-sm mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors touch-target"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Histórico de Despesas</h1>
                <p className="text-sm text-gray-500">Mês atual</p>
              </div>
            </div>
            <Link
              href="/expenses/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2 touch-target"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nova</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Weekly Total Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6">
        <div className="max-w-screen-sm mx-auto px-4">
          <div className="text-center">
            <h2 className="text-lg font-medium mb-2">Total desta semana</h2>
            <p className="text-4xl font-bold">{formatCurrency(weeklyTotal)}</p>
            <p className="text-blue-100 text-sm mt-2">Domingo a sábado</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-screen-sm mx-auto py-4 px-4 safe-area-bottom">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="ml-3 text-sm text-red-800">{error}</p>
            </div>
          </div>
        ) : null}

        {expensesByDate.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma despesa encontrada</h3>
            <p className="text-gray-600 mb-6">Você ainda não registrou despesas este mês.</p>
            <Link
              href="/expenses/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Registrar Primeira Despesa
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seção de Despesas Compartilhadas */}
            {partnerData?.has_partner && sharedExpenses.length > 0 && (
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Despesas Compartilhadas</h3>
                        <p className="text-pink-100 text-sm">Com {partnerData.partner_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {formatCurrency(sharedExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                      </p>
                      <p className="text-pink-100 text-sm">Total compartilhado</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white bg-opacity-10">
                  {sharedExpenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="px-6 py-4 border-b border-white border-opacity-10 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {expense.created_by_name?.charAt(0) || 'P'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-white truncate">
                                {expense.description}
                              </p>
                              {expense.is_shared && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                                  Compartilhado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-pink-100">
                              {expense.created_by_name} • {formatDate(expense.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <p className="text-sm font-bold text-white">
                            {formatCurrency(expense.amount)}
                          </p>
                          
                          {/* Botões de ação para despesas compartilhadas */}
                          {expense.user_id === user?.id && (
                            <>
                              {/* Edit Button */}
                              <Link
                                href={`/expenses/edit/${expense.id}`}
                                className="p-1 text-white hover:text-blue-200 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                                title="Editar despesa"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => setShowDeleteConfirm(expense.id)}
                                className="p-1 text-white hover:text-red-200 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                                title="Excluir despesa"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {sharedExpenses.length > 5 && (
                    <div className="px-6 py-3 text-center">
                      <p className="text-xs text-pink-100">
                        +{sharedExpenses.length - 5} mais despesas compartilhadas
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Despesas do(a) parceiro(a) */}
            {partnerData?.has_partner && partnerExpenses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-white">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Despesas do(a) parceiro(a)</h3>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(partnerExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {partnerExpenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {expense.created_by_name?.charAt(0) || 'P'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {expense.description || expense.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            do(a) parceiro(a) • {formatDate(expense.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {partnerExpenses.length > 5 && (
                    <div className="px-6 py-3 text-center">
                      <p className="text-xs text-gray-500">
                        +{partnerExpenses.length - 5} despesas do(a) parceiro(a)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Despesas Individuais */}
            {expensesByDate.map((dayGroup, dayIndex) => (
              <div key={dayGroup.date} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Day Header */}
                <div className={`px-6 py-4 border-b border-gray-100 ${
                  dayIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatDate(dayGroup.date)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {dayGroup.expenses.length} {dayGroup.expenses.length === 1 ? 'despesa' : 'despesas'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(dayGroup.total)}
                      </p>
                      <p className="text-sm text-gray-500">Total do dia</p>
                    </div>
                  </div>
                </div>

                {/* Expenses List */}
                <div className="divide-y divide-gray-100">
                  {dayGroup.expenses.map((expense) => (
                    <div key={expense.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Category Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-500'
                          } bg-opacity-10`}>
                            <span className="text-lg">
                              {CATEGORY_ICONS[expense.category as keyof typeof CATEGORY_ICONS] || '📦'}
                            </span>
                          </div>

                          {/* Expense Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {expense.category}
                              </h4>
                              {expense.is_shared && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Compartilhado
                                </span>
                              )}
                            </div>
                            {expense.description && (
                              <p className="text-sm text-gray-500 truncate">
                                {expense.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {formatTime(expense.created_at)}
                            </p>
                          </div>

                          {/* Receipt Image */}
                          {expense.receipt_url && (
                            <div className="flex-shrink-0">
                              <img
                                src={expense.receipt_url}
                                alt="Comprovante"
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                              />
                            </div>
                          )}
                        </div>

                        {/* Amount and Actions */}
                        <div className="flex-shrink-0 ml-4 flex items-center space-x-3">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </p>
                          
                          {/* Edit Button */}
                          <Link
                            href={`/expenses/edit/${expense.id}`}
                            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors touch-target"
                            title="Editar despesa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => setShowDeleteConfirm(expense.id)}
                            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors touch-target"
                            title="Excluir despesa"
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
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 safe-area-top safe-area-bottom">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Confirmar Exclusão</h3>
              </div>
              <p className="text-gray-600 mb-8 text-base">
                Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-6 py-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors touch-target text-base font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Verificar se é uma despesa compartilhada
                    const isSharedExpense = sharedExpenses.some(exp => exp.id === showDeleteConfirm);
                    if (isSharedExpense) {
                      handleDeleteSharedExpense(showDeleteConfirm);
                    } else {
                      handleDeleteExpense(showDeleteConfirm);
                    }
                  }}
                  disabled={deletingExpense === showDeleteConfirm}
                  className="flex-1 px-6 py-4 text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors touch-target text-base font-medium"
                >
                  {deletingExpense === showDeleteConfirm ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 