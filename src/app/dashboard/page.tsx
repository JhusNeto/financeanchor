'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getProfile, signOut, Profile } from '@/lib/auth';
import { getBudgetSummary } from '@/lib/budgets';
import { getDebtsSummary } from '@/lib/debts';
import { getGoalSummary } from '@/lib/goals';
import { getTodayInsight } from '@/lib/insights';
import { getPartnerData, getSharedExpenses, getPartnerIndividualExpenses, PartnerData, SharedExpense } from '@/lib/partners';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
    const [loadingComplete, setLoadingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFormatada, setDataFormatada] = useState('');
  const [mounted, setMounted] = useState(false);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [debtSummary, setDebtSummary] = useState<any>(null);
  const [goalSummary, setGoalSummary] = useState<any>(null);
  const [todayInsight, setTodayInsight] = useState<any>(null);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>([]);
  const [partnerExpenses, setPartnerExpenses] = useState<SharedExpense[]>([]);
  const router = useRouter();

  // Mocked data for Financial Pulse
  const mockData = {
    saldoDiario: 120.00,
    gastoSemana: 450.00,
    orcamentoSemana: 800.00,
    proximaConta: {
      descricao: 'Internet',
      valor: 120.00,
      diasVencimento: 3
    },
    totalDividas: 4300.00,
    mesesLiberdade: 8
  };

  useEffect(() => {
    setMounted(true);
    
    // Adicionar timeout para evitar travamento infinito
    const timeoutId = setTimeout(() => {
      if (loading) {
        setError('Tempo limite excedido. Verifique sua conexão e tente novamente.');
        setLoading(false);
      }
    }, 30000); // 30 segundos

    loadBasicData();
    formatarData();

    return () => clearTimeout(timeoutId);
  }, []);

  // FASE 1: Carregar dados básicos (usuário, perfil) - Rápido
  const loadBasicData = async () => {
    try {
      const { user: currentUser, error } = await getCurrentUser();

      if (error || !currentUser) {
        setError('Usuário não autenticado');
        setLoading(false);
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);

      // Fetch user profile (dados básicos)
      const { profile: userProfile, error: profileError } = await getProfile(currentUser.id);
      if (profileError) {
        setError(`Erro ao carregar perfil: ${profileError.message || 'Erro desconhecido'}`);
      }
      setProfile(userProfile);

      // Definir dados padrão para evitar erros
      setBudgetSummary({
        total_budget: 0,
        total_spent: 0,
        percentage_used: 0,
        status_color: 'green'
      });
      
      setDebtSummary({
        total_debt: 0,
        next_due_debt: 'Nenhuma dívida',
        next_due_amount: 0,
        days_until_next_due: 0,
        estimated_months: 0
      });
      
      setGoalSummary(null);
      setTodayInsight({
        id: 'default',
        user_id: currentUser.id,
        message: 'Bem-vindo ao seu pulso financeiro! 💪',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });
      
      setPartnerData({
        has_partner: false,
        partner_name: null,
        partner_id: null,
        partner_email: null,
      });
      
      setSharedExpenses([]);
      
      // FASE 1 COMPLETA - Dashboard já funcional
      setLoading(false);
      setError(null);
      
      // FASE 2: Carregar dados completos em background (sem bloquear UI)
      setTimeout(() => {
        loadCompleteData();
      }, 500); // Delay menor para melhor UX
      
    } catch (error) {
      setError(`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setLoading(false);
      router.push('/auth/login');
    }
  };

  // FASE 2: Carregar dados completos em background
  const loadCompleteData = async () => {
    try {
      setLoadingComplete(true);
      
      // Carregar dados em paralelo para melhor performance
      const promises = [
        loadBudgetData(),
        loadDebtData(),
        loadGoalData(),
        loadInsightData(),
        loadPartnerData()
      ];

      // Aguardar todas as promises em paralelo
      await Promise.allSettled(promises);
      
      setLoadingComplete(false);
      
    } catch (error) {
      console.error('Erro ao carregar dados completos:', error);
      setLoadingComplete(false);
    }
  };

  // Funções separadas para carregar cada tipo de dado
  const loadBudgetData = async () => {
    try {
      const { budgetSummary: summaryData, error: budgetError } = await getBudgetSummary();
      if (!budgetError && summaryData) {
        setBudgetSummary(summaryData);
      }
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
    }
  };

  const loadDebtData = async () => {
    try {
      const { debtSummary: debtSummaryData, error: debtError } = await getDebtsSummary();
      if (!debtError && debtSummaryData) {
        setDebtSummary(debtSummaryData);
      }
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error);
    }
  };

  const loadGoalData = async () => {
    try {
      const { goalSummary: goalSummaryData, error: goalError } = await getGoalSummary();
      if (!goalError && goalSummaryData) {
        setGoalSummary(goalSummaryData);
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    }
  };

  const loadInsightData = async () => {
    try {
      const { insight: insightData, error: insightError } = await getTodayInsight();
      if (!insightError && insightData) {
        setTodayInsight(insightData);
      }
    } catch (error) {
      console.error('Erro ao carregar insight:', error);
    }
  };

  const loadPartnerData = async () => {
    try {
      const { partner: partnerDataResult, error: partnerError } = await getPartnerData();
      if (!partnerError && partnerDataResult) {
        setPartnerData(partnerDataResult);
        
        // Carregar despesas compartilhadas se tiver parceiro
        if (partnerDataResult.has_partner) {
          const { expenses: sharedExpensesData, error: sharedError } = await getSharedExpenses();
          if (!sharedError && sharedExpensesData) {
            setSharedExpenses(sharedExpensesData);
          }

          const { expenses: partnerExpensesData, error: partnerExpError } = await getPartnerIndividualExpenses();
          if (!partnerExpError && partnerExpensesData) {
            setPartnerExpenses(partnerExpensesData);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do parceiro:', error);
    }
  };

  const formatarData = () => {
    const hoje = new Date();
    const opcoes: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    const dataFormatada = hoje.toLocaleDateString('pt-BR', opcoes);
    setDataFormatada(dataFormatada);
  };

  const calcularPorcentagemGasto = () => {
    return (mockData.gastoSemana / mockData.orcamentoSemana) * 100;
  };

  const getCorBarra = (porcentagem: number) => {
    if (porcentagem <= 50) return 'bg-green-500';
    if (porcentagem <= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao Carregar</h3>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  loadBasicData();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando seu pulso financeiro...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {profile?.full_name || 'Usuário'}
                </h1>
                <p className="text-sm text-gray-500 capitalize">
                  {dataFormatada || 'Carregando...'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-md hover:shadow-lg"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">

          {/* Insight do Dia */}
          {todayInsight && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💡</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Insight do Dia
                  </h3>
                  <p className="text-gray-700 text-base leading-relaxed">
                    {todayInsight.message}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(todayInsight.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {loadingComplete && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saldo Diário */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl p-8 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-3 text-blue-100">Você pode gastar hoje</h2>
              <div className="text-5xl font-bold mb-2 drop-shadow-lg">
                R$ {mockData.saldoDiario.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-blue-100 text-sm opacity-90">
                Baseado no seu orçamento mensal e gastos anteriores
              </p>
            </div>
          </div>

          {/* Gasto da Semana vs Orçamento */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Esta semana
              </h3>
              <span className="text-sm text-gray-500 font-medium">
                R$ {mockData.gastoSemana.toFixed(2).replace('.', ',')} de R$ {mockData.orcamentoSemana.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-3 shadow-inner">
              <div
                className={`h-4 rounded-full transition-all duration-500 ease-out shadow-lg ${getCorBarra(calcularPorcentagemGasto())}`}
                style={{ width: `${Math.min(calcularPorcentagemGasto(), 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">0%</span>
              <span className={`font-bold ${
                calcularPorcentagemGasto() <= 50 ? 'text-green-600' :
                calcularPorcentagemGasto() <= 80 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {calcularPorcentagemGasto().toFixed(0)}%
              </span>
              <span className="text-gray-500">100%</span>
            </div>
          </div>

          {/* Orçamento Mensal */}
          {budgetSummary && budgetSummary.total_budget > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Orçamento mensal
                </h3>
                <span className="text-sm text-gray-500 font-medium">
                  {budgetSummary.percentage_used.toFixed(1)}% usado
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-3 shadow-inner">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ease-out shadow-lg ${
                    budgetSummary.percentage_used < 70 ? 'bg-green-500' :
                    budgetSummary.percentage_used < 100 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(budgetSummary.percentage_used, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  R$ {budgetSummary.total_spent.toFixed(2).replace('.', ',')}
                </span>
                <span className={`font-bold ${
                  budgetSummary.percentage_used < 70 ? 'text-green-600' :
                  budgetSummary.percentage_used < 100 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  de R$ {budgetSummary.total_budget.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          )}

          {/* Próxima Dívida a Vencer */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Próxima parcela a vencer
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {debtSummary && debtSummary.next_due_debt !== 'Nenhuma dívida' ? debtSummary.next_due_debt : 'Nenhuma dívida'}
                  </span>
                  <span className="text-xl text-gray-600 font-medium">
                    {debtSummary && debtSummary.next_due_debt !== 'Nenhuma dívida' ? `R$ ${debtSummary.next_due_amount.toFixed(2).replace('.', ',')}` : 'R$ 0,00'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {debtSummary && debtSummary.next_due_debt !== 'Nenhuma dívida' ? (
                  <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                    debtSummary.days_until_next_due <= 1 ? 'bg-red-100 text-red-800 border border-red-200' :
                    debtSummary.days_until_next_due <= 3 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {debtSummary.days_until_next_due === 1 ? 'Vence amanhã' :
                     debtSummary.days_until_next_due === 0 ? 'Vence hoje' :
                     `Vence em ${debtSummary.days_until_next_due} dias`}
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-full text-sm font-bold shadow-md bg-gray-100 text-gray-800 border border-gray-200">
                    Nenhuma dívida
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Total da Dívida */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Total de dívidas
              </h3>
              <div className="text-4xl font-bold text-gray-900 mb-3">
                {debtSummary ? `R$ ${debtSummary.total_debt.toFixed(2).replace('.', ',')}` : 'R$ 0,00'}
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl inline-block shadow-lg transform hover:scale-105 transition-transform duration-300">
                <span className="font-bold text-lg">
                  Liberdade em {debtSummary ? debtSummary.estimated_months : 0} meses
                </span>
                <div className="text-xs opacity-90 mt-1">(estimativa)</div>
              </div>
            </div>
          </div>

          {/* Meta Principal */}
          {goalSummary ? (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {goalSummary.title}
                </h3>
                <Link
                  href="/goal"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver detalhes →
                </Link>
              </div>
              
              {/* Imagem da meta (se houver) */}
              {goalSummary.image_url && (
                <div className="mb-4">
                  <img
                    src={goalSummary.image_url}
                    alt={goalSummary.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Progresso */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Progresso</span>
                  <span className="text-sm font-bold text-gray-900">
                    {goalSummary.percentage_completed.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ease-out ${
                      goalSummary.percentage_completed >= 100 ? 'bg-green-500' :
                      goalSummary.percentage_completed >= 75 ? 'bg-blue-500' :
                      goalSummary.percentage_completed >= 50 ? 'bg-yellow-500' :
                      goalSummary.percentage_completed >= 25 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(goalSummary.percentage_completed, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Valor Atual</p>
                  <p className="text-lg font-bold text-blue-600">
                    R$ {goalSummary.current_amount.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Faltam</p>
                  <p className="text-lg font-bold text-orange-600">
                    R$ {goalSummary.amount_remaining.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {/* Mensagem motivacional */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-center font-medium text-blue-800">
                  {goalSummary.percentage_completed >= 100 ? '🎉 Parabéns! Meta conquistada!' :
                   goalSummary.percentage_completed >= 75 ? '🚀 Quase lá! Continue assim!' :
                   goalSummary.percentage_completed >= 50 ? '💪 Metade do caminho!' :
                   goalSummary.percentage_completed >= 25 ? '🌟 Começou bem!' : '🎯 Cada passo conta!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Defina sua meta principal
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Crie uma meta para visualizar seu progresso e receber motivação
                </p>
                <Link
                  href="/goal/new"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 inline-block"
                >
                  Criar Meta
                </Link>
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-6 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105">
                <div className="text-center">
                  <div className="text-3xl mb-2">💰</div>
                  Adicionar Receita
                </div>
              </button>
              <Link
                href="/expenses/new"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-6 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">💸</div>
                  Adicionar Gasto
                </div>
              </Link>
              <Link
                href="/expenses"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-6 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  Ver Relatórios
                </div>
              </Link>
              <Link
                href="/budget"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  Orçamento
                </div>
              </Link>
              <Link
                href="/debts"
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-6 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">💳</div>
                  Dívidas
                </div>
              </Link>
              <Link
                href="/goal"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 rounded-xl transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  Metas
                </div>
              </Link>
            </div>
          </div>

          {/* Seção do Parceiro */}
          {partnerData?.has_partner ? (
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Parceiro(a) Conectado</h3>
                    <p className="text-pink-100 text-sm">{partnerData.partner_name}</p>
                  </div>
                </div>
                <Link
                  href="/partner/invite"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Gerenciar
                </Link>
              </div>

              {/* Despesas Compartilhadas */}
              {sharedExpenses.length > 0 && (
                <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium mb-3">Despesas Compartilhadas Recentes</h4>
                  <div className="space-y-2">
                    {sharedExpenses.slice(0, 3).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {expense.created_by_name?.charAt(0) || 'P'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{expense.description}</p>
                            <p className="text-xs text-pink-100">
                              {expense.created_by_name} • {new Date(expense.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold">
                          R$ {expense.amount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                  {sharedExpenses.length > 3 && (
                    <p className="text-xs text-pink-100 text-center mt-2">
                      +{sharedExpenses.length - 3} mais despesas compartilhadas
                    </p>
                  )}
                </div>
              )}

              {/* Despesas do(a) parceiro(a) */}
              {partnerExpenses.length > 0 && (
                <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium mb-3">Gastos do(a) parceiro(a)</h4>
                  <div className="space-y-2">
                    {partnerExpenses.slice(0, 3).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium">{expense.description}</p>
                          <p className="text-xs text-pink-100">
                            do(a) parceiro(a) • {new Date(expense.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className="text-sm font-bold">
                          R$ {expense.amount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                  {partnerExpenses.length > 3 && (
                    <p className="text-xs text-pink-100 text-center mt-2">
                      +{partnerExpenses.length - 3} gastos do(a) parceiro(a)
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <Link
                  href="/expenses/new"
                  className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-center py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Adicionar Gasto Compartilhado
                </Link>
                <Link
                  href="/expenses"
                  className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-center py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Ver Todos
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Conecte-se com seu Parceiro(a)
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Compartilhe despesas e metas com seu parceiro(a) para uma gestão financeira em conjunto
                </p>
                <Link
                  href="/partner/invite"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 inline-block"
                >
                  Convidar Parceiro(a)
                </Link>
              </div>
            </div>
          )}

          {/* Indicador de carregamento completo */}
          {loadingComplete && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Dados atualizados</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 