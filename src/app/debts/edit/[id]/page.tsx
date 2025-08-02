'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getDebtById, updateDebt } from '@/lib/debts';
import { Debt, UpdateDebtData, validateDebtData, formatCurrency } from '@/types/debt';

export default function EditDebtPage() {
  const [debt, setDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState<UpdateDebtData>({
    name: '',
    total_amount: 0,
    monthly_payment: 0,
    due_day: 15,
    start_date: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const debtId = params.id as string;

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

      await loadDebt();
      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      router.push('/auth/login');
    }
  };

  const loadDebt = async () => {
    try {
      const { debt: debtData, error } = await getDebtById(debtId);
      
      if (error) {
        console.error('Erro ao carregar dívida:', error);
        alert('Erro ao carregar dívida. Tente novamente.');
        router.push('/debts');
        return;
      }

      if (!debtData) {
        alert('Dívida não encontrada.');
        router.push('/debts');
        return;
      }

      setDebt(debtData);
      setFormData({
        name: debtData.name,
        total_amount: debtData.total_amount,
        monthly_payment: debtData.monthly_payment,
        due_day: debtData.due_day,
        start_date: debtData.start_date
      });
    } catch (error) {
      console.error('Erro inesperado ao carregar dívida:', error);
      alert('Erro inesperado. Tente novamente.');
      router.push('/debts');
    }
  };

  const handleInputChange = (field: keyof UpdateDebtData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erros quando o usuário começa a digitar
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);

    // Validar dados
    const validation = validateDebtData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setSaving(false);
      return;
    }

    try {
      const { debt: updatedDebt, error } = await updateDebt(debtId, formData);
      
      if (error) {
        console.error('Erro ao atualizar dívida:', error);
        setErrors(['Erro ao salvar dívida. Tente novamente.']);
        setSaving(false);
        return;
      }

      if (updatedDebt) {
        // Redirecionar para a lista de dívidas
        router.push('/debts');
      }
    } catch (error) {
      console.error('Erro inesperado ao atualizar dívida:', error);
      setErrors(['Erro inesperado. Tente novamente.']);
      setSaving(false);
    }
  };

  const calculateMonths = () => {
    if (formData.monthly_payment <= 0 || formData.total_amount <= 0) return 0;
    return Math.ceil(formData.total_amount / formData.monthly_payment);
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dívida...</p>
        </div>
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dívida não encontrada</h3>
          <p className="text-gray-600 mb-6">A dívida que você está procurando não existe ou foi removida.</p>
          <Link
            href="/debts"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Voltar para Dívidas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link 
              href="/debts"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Editar Dívida</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Editar Dívida</h2>
            <p className="text-gray-600 mt-1">Atualize os dados da sua dívida.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Mensagens de erro */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erro ao salvar dívida</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nome da dívida */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Dívida *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Cartão Nubank, Financiamento Carro..."
                required
              />
            </div>

            {/* Valor total */}
            <div>
              <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-2">
                Valor Total *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="number"
                  id="total_amount"
                  value={formData.total_amount || ''}
                  onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>

            {/* Valor mensal */}
            <div>
              <label htmlFor="monthly_payment" className="block text-sm font-medium text-gray-700 mb-2">
                Valor da Parcela Mensal *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="number"
                  id="monthly_payment"
                  value={formData.monthly_payment || ''}
                  onChange={(e) => handleInputChange('monthly_payment', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>

            {/* Dia do vencimento */}
            <div>
              <label htmlFor="due_day" className="block text-sm font-medium text-gray-700 mb-2">
                Dia do Vencimento *
              </label>
              <select
                id="due_day"
                value={formData.due_day}
                onChange={(e) => handleInputChange('due_day', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Data de início */}
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Resumo calculado */}
            {formData.total_amount > 0 && formData.monthly_payment > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Resumo da Dívida</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600">Meses para quitar:</p>
                    <p className="font-semibold text-blue-800">{calculateMonths()} meses</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Valor total:</p>
                    <p className="font-semibold text-blue-800">{formatCurrency(formData.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Parcela mensal:</p>
                    <p className="font-semibold text-blue-800">{formatCurrency(formData.monthly_payment)}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Vencimento:</p>
                    <p className="font-semibold text-blue-800">Dia {formData.due_day}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex items-center justify-between pt-6">
              <Link
                href="/debts"
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Atualizar Dívida</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 