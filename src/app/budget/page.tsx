'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBudgetStatus, getBudgetSummary, createBudget, updateBudget } from '@/lib/budgets';
import { getCurrentUser } from '@/lib/auth';
import { BudgetStatus, BudgetSummary, BUDGET_STATUS_COLORS, getBudgetStatusText } from '@/types/budget';
import { EXPENSE_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '@/types/expense';

export default function BudgetPage() {
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetStatus | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    checkAuth();
    loadBudgetData();
  }, []);

  const checkAuth = async () => {
    try {
      const { user, error } = await getCurrentUser();
      if (error || !user) {
        router.push('/auth/login');
        return;
      }
    } catch (error) {
      router.push('/auth/login');
    }
  };

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      
      // Carregar status do orçamento
      const { budgetStatus: statusData, error: statusError } = await getBudgetStatus();
      if (statusError) {
        setError('Erro ao carregar status do orçamento');
        return;
      }
      setBudgetStatus(statusData || []);

      // Carregar resumo do orçamento
      const { budgetSummary: summaryData, error: summaryError } = await getBudgetSummary();
      if (summaryError) {
        console.error('Erro ao carregar resumo do orçamento:', summaryError);
      } else {
        setBudgetSummary(summaryData);
      }

    } catch (error) {
      console.error('Erro inesperado:', error);
      setError('Erro inesperado ao carregar dados do orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async (category: string, limitAmount: number) => {
    try {
      setLoading(true);
      
      const budgetData = {
        category,
        limit_amount: limitAmount
      };

      const { budget, error } = await createBudget(budgetData);

      if (error) {
        setError(error.message || 'Erro ao salvar orçamento');
        return;
      }

      // Recarregar dados
      await loadBudgetData();
      setShowForm(false);
      setEditingBudget(null);

    } catch (error) {
      console.error('Erro inesperado:', error);
      setError('Erro inesperado ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async (budgetId: string, limitAmount: number) => {
    try {
      setLoading(true);
      
      const { budget, error } = await updateBudget(budgetId, {
        limit_amount: limitAmount
      });

      if (error) {
        setError(error.message || 'Erro ao atualizar orçamento');
        return;
      }

      // Recarregar dados
      await loadBudgetData();
      setEditingBudget(null);

    } catch (error) {
      console.error('Erro inesperado:', error);
      setError('Erro inesperado ao atualizar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando seu orçamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Orçamento Mensal</h1>
                <p className="text-sm text-gray-500">Controle seus gastos por categoria</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Adicionar Orçamento</span>
            </button>
          </div>
        </div>
      </header>

      {/* Budget Summary */}
      {budgetSummary && budgetSummary.total_budget > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-lg font-medium mb-2">Resumo do Orçamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-blue-100 text-sm">Orçamento Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(budgetSummary.total_budget)}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Gasto Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(budgetSummary.total_spent)}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Percentual Usado</p>
                  <p className="text-2xl font-bold">{budgetSummary.percentage_used.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-blue-800 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(budgetSummary.percentage_used)}`}
                    style={{ width: `${Math.min(budgetSummary.percentage_used, 100)}%` }}
                  ></div>
                </div>
                <p className="text-blue-100 text-sm mt-2">
                  {getBudgetStatusText(budgetSummary.percentage_used)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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

        {budgetStatus.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento definido</h3>
            <p className="text-gray-600 mb-6">Defina seu orçamento mensal por categoria para começar a controlar seus gastos.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Definir Primeiro Orçamento
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetStatus.map((budget) => (
              <div key={budget.category} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      CATEGORY_COLORS[budget.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-500'
                    } bg-opacity-10`}>
                      <span className="text-lg">
                        {CATEGORY_ICONS[budget.category as keyof typeof CATEGORY_ICONS] || '📦'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{budget.category}</h3>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(budget.total_spent)} de {formatCurrency(budget.budget_limit)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      BUDGET_STATUS_COLORS[budget.status_color].text
                    }`}>
                      {budget.percentage_used.toFixed(1)}%
                    </p>
                    <p className={`text-sm ${
                      BUDGET_STATUS_COLORS[budget.status_color].text
                    }`}>
                      {getBudgetStatusText(budget.percentage_used)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(budget.percentage_used)}`}
                    style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                  ></div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => setEditingBudget(budget)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Editar limite
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Budget Modal */}
      {(showForm || editingBudget) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBudget ? 'Editar Orçamento' : 'Adicionar Orçamento'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingBudget(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <BudgetForm
              editingBudget={editingBudget}
              onSave={editingBudget ? handleUpdateBudget : handleSaveBudget}
              onCancel={() => {
                setShowForm(false);
                setEditingBudget(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Componente do formulário
interface BudgetFormProps {
  editingBudget: BudgetStatus | null;
  onSave: (category: string, limitAmount: number) => void;
  onCancel: () => void;
}

function BudgetForm({ editingBudget, onSave, onCancel }: BudgetFormProps) {
  const [category, setCategory] = useState(editingBudget?.category || '');
  const [limitAmount, setLimitAmount] = useState(editingBudget?.budget_limit.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !limitAmount || parseFloat(limitAmount) <= 0) {
      return;
    }

    setLoading(true);
    await onSave(category, parseFloat(limitAmount));
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Categoria
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          disabled={!!editingBudget}
        >
          <option value="">Selecione uma categoria</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_ICONS[cat]} {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="limitAmount" className="block text-sm font-medium text-gray-700 mb-2">
          Limite Mensal (R$)
        </label>
        <input
          type="number"
          id="limitAmount"
          value={limitAmount}
          onChange={(e) => setLimitAmount(e.target.value)}
          placeholder="0,00"
          step="0.01"
          min="0.01"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Salvando...' : (editingBudget ? 'Atualizar' : 'Salvar')}
        </button>
      </div>
    </form>
  );
} 