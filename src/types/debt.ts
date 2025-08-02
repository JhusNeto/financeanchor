// =====================================================
// TIPOS PARA SISTEMA DE DÍVIDAS - FINANCEANCHOR
// =====================================================

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  monthly_payment: number;
  due_day: number;
  start_date: string;
  created_at: string;
  updated_at: string;
  remaining_amount?: number;
  months_paid?: number;
  months_remaining?: number;
}

export interface CreateDebtData {
  name: string;
  total_amount: number;
  monthly_payment: number;
  due_day: number;
  start_date: string;
}

export interface UpdateDebtData {
  name?: string;
  total_amount?: number;
  monthly_payment?: number;
  due_day?: number;
  start_date?: string;
}

export interface DebtSummary {
  total_debt: number;
  total_monthly_payment: number;
  estimated_months: number;
  next_due_debt: string;
  next_due_amount: number;
  days_until_next_due: number;
}

// Constantes para validação
export const DEBT_VALIDATION = {
  MIN_TOTAL_AMOUNT: 0.01,
  MAX_TOTAL_AMOUNT: 9999999.99,
  MIN_MONTHLY_PAYMENT: 0.01,
  MAX_MONTHLY_PAYMENT: 999999.99,
  MIN_DUE_DAY: 1,
  MAX_DUE_DAY: 31,
} as const;

// Função para validar dados de dívida
export function validateDebtData(data: CreateDebtData | UpdateDebtData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar nome (se fornecido)
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Nome da dívida é obrigatório');
    } else if (data.name.trim().length > 100) {
      errors.push('Nome da dívida deve ter no máximo 100 caracteres');
    }
  }

  // Validar valor total (se fornecido)
  if (data.total_amount !== undefined) {
    if (data.total_amount < DEBT_VALIDATION.MIN_TOTAL_AMOUNT) {
      errors.push('Valor total deve ser maior que zero');
    } else if (data.total_amount > DEBT_VALIDATION.MAX_TOTAL_AMOUNT) {
      errors.push('Valor total muito alto');
    }
  }

  // Validar valor mensal (se fornecido)
  if (data.monthly_payment !== undefined) {
    if (data.monthly_payment < DEBT_VALIDATION.MIN_MONTHLY_PAYMENT) {
      errors.push('Valor mensal deve ser maior que zero');
    } else if (data.monthly_payment > DEBT_VALIDATION.MAX_MONTHLY_PAYMENT) {
      errors.push('Valor mensal muito alto');
    }
  }

  // Validar se valor mensal não é maior que o total (se ambos fornecidos)
  if (data.monthly_payment !== undefined && data.total_amount !== undefined) {
    if (data.monthly_payment > data.total_amount) {
      errors.push('Valor mensal não pode ser maior que o valor total');
    }
  }

  // Validar dia do vencimento (se fornecido)
  if (data.due_day !== undefined) {
    if (data.due_day < DEBT_VALIDATION.MIN_DUE_DAY || data.due_day > DEBT_VALIDATION.MAX_DUE_DAY) {
      errors.push('Dia do vencimento deve estar entre 1 e 31');
    }
  }

  // Validar data de início (se fornecida)
  if (data.start_date !== undefined) {
    const startDate = new Date(data.start_date);
    const today = new Date();
    if (isNaN(startDate.getTime())) {
      errors.push('Data de início inválida');
    } else if (startDate > today) {
      errors.push('Data de início não pode ser no futuro');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Função para formatar valor monetário
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Função para formatar data
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Função para obter cor baseada no progresso da dívida
export function getDebtProgressColor(remainingAmount: number, totalAmount: number): string {
  const percentage = (remainingAmount / totalAmount) * 100;
  
  if (percentage <= 25) return 'text-green-600';
  if (percentage <= 50) return 'text-blue-600';
  if (percentage <= 75) return 'text-yellow-600';
  return 'text-red-600';
}

// Função para obter texto de urgência baseado nos dias restantes
export function getUrgencyText(daysUntil: number): { text: string; color: string } {
  if (daysUntil <= 3) {
    return { text: 'URGENTE', color: 'text-red-600 bg-red-100' };
  } else if (daysUntil <= 7) {
    return { text: 'PRÓXIMO', color: 'text-orange-600 bg-orange-100' };
  } else if (daysUntil <= 15) {
    return { text: 'ATENÇÃO', color: 'text-yellow-600 bg-yellow-100' };
  } else {
    return { text: 'OK', color: 'text-green-600 bg-green-100' };
  }
}

// Função para calcular meses restantes
export function calculateRemainingMonths(totalAmount: number, monthlyPayment: number): number {
  if (monthlyPayment <= 0) return 0;
  return Math.ceil(totalAmount / monthlyPayment);
}

// Função para calcular valor restante
export function calculateRemainingAmount(totalAmount: number, monthlyPayment: number, monthsPaid: number): number {
  const paidAmount = monthlyPayment * monthsPaid;
  return Math.max(totalAmount - paidAmount, 0);
} 