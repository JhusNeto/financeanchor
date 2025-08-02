// =====================================================
// TIPOS PARA SISTEMA DE METAS - FINANCEANCHOR
// =====================================================

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  days_remaining?: number;
  percentage_completed?: number;
  amount_remaining?: number;
  daily_savings_needed?: number;
}

export interface CreateGoalData {
  title: string;
  target_amount: number;
  current_amount?: number;
  deadline: string;
  image_url?: string;
}

export interface UpdateGoalData {
  title?: string;
  target_amount?: number;
  current_amount?: number;
  deadline?: string;
  image_url?: string;
}

export interface GoalSummary {
  goal_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  image_url?: string;
  days_remaining: number;
  percentage_completed: number;
  amount_remaining: number;
  daily_savings_needed: number;
  estimated_completion_date: string;
}

// Constantes para validação
export const GOAL_VALIDATION = {
  MIN_TARGET_AMOUNT: 0.01,
  MAX_TARGET_AMOUNT: 9999999.99,
  MIN_CURRENT_AMOUNT: 0,
  MAX_TITLE_LENGTH: 100,
} as const;

// Função para validar dados de meta
export function validateGoalData(data: CreateGoalData | UpdateGoalData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar título (se fornecido)
  if (data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Título da meta é obrigatório');
    } else if (data.title.trim().length > GOAL_VALIDATION.MAX_TITLE_LENGTH) {
      errors.push('Título da meta deve ter no máximo 100 caracteres');
    }
  }

  // Validar valor alvo (se fornecido)
  if (data.target_amount !== undefined) {
    if (data.target_amount < GOAL_VALIDATION.MIN_TARGET_AMOUNT) {
      errors.push('Valor alvo deve ser maior que zero');
    } else if (data.target_amount > GOAL_VALIDATION.MAX_TARGET_AMOUNT) {
      errors.push('Valor alvo muito alto');
    }
  }

  // Validar valor atual (se fornecido)
  if (data.current_amount !== undefined) {
    if (data.current_amount < GOAL_VALIDATION.MIN_CURRENT_AMOUNT) {
      errors.push('Valor atual não pode ser negativo');
    } else if (data.current_amount > (data.target_amount || 0)) {
      errors.push('Valor atual não pode ser maior que o valor alvo');
    }
  }

  // Validar prazo (se fornecido)
  if (data.deadline !== undefined) {
    const deadline = new Date(data.deadline);
    const today = new Date();
    if (isNaN(deadline.getTime())) {
      errors.push('Data de prazo inválida');
    } else if (deadline <= today) {
      errors.push('Prazo deve ser uma data futura');
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

// Função para obter cor baseada no progresso da meta
export function getGoalProgressColor(percentage: number): string {
  if (percentage >= 100) return 'text-green-600 bg-green-100';
  if (percentage >= 75) return 'text-blue-600 bg-blue-100';
  if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
  if (percentage >= 25) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

// Função para obter texto motivacional baseado no progresso
export function getMotivationalText(percentage: number, daysRemaining: number): string {
  if (percentage >= 100) {
    return '🎉 Parabéns! Você conquistou sua meta!';
  } else if (percentage >= 75) {
    return '🚀 Quase lá! Continue assim!';
  } else if (percentage >= 50) {
    return '💪 Metade do caminho! Você consegue!';
  } else if (percentage >= 25) {
    return '🌟 Começou bem! Mantenha o foco!';
  } else if (daysRemaining <= 30) {
    return '⏰ Prazo próximo! Aumente o ritmo!';
  } else {
    return '🎯 Cada passo conta! Você vai conseguir!';
  }
}

// Função para calcular dias restantes
export function calculateDaysRemaining(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0);
}

// Função para calcular percentual de conclusão
export function calculatePercentage(currentAmount: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  return Math.min((currentAmount / targetAmount) * 100, 100);
}

// Função para calcular economia diária necessária
export function calculateDailySavingsNeeded(currentAmount: number, targetAmount: number, daysRemaining: number): number {
  const amountRemaining = targetAmount - currentAmount;
  if (daysRemaining <= 0 || amountRemaining <= 0) return 0;
  return amountRemaining / daysRemaining;
}

// Função para obter emoji baseado no tipo de meta
export function getGoalEmoji(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('viagem') || lowerTitle.includes('viajar')) return '✈️';
  if (lowerTitle.includes('carro') || lowerTitle.includes('automóvel')) return '🚗';
  if (lowerTitle.includes('casa') || lowerTitle.includes('apartamento')) return '🏠';
  if (lowerTitle.includes('estudo') || lowerTitle.includes('curso')) return '📚';
  if (lowerTitle.includes('negócio') || lowerTitle.includes('empresa')) return '💼';
  if (lowerTitle.includes('casamento') || lowerTitle.includes('festa')) return '💒';
  if (lowerTitle.includes('investimento') || lowerTitle.includes('ações')) return '📈';
  if (lowerTitle.includes('presente') || lowerTitle.includes('gift')) return '🎁';
  
  return '🎯'; // Emoji padrão para metas
}

// Função para formatar tempo restante
export function formatTimeRemaining(daysRemaining: number): string {
  if (daysRemaining <= 0) return 'Prazo expirado';
  if (daysRemaining === 1) return '1 dia restante';
  if (daysRemaining < 7) return `${daysRemaining} dias restantes`;
  if (daysRemaining < 30) return `${Math.ceil(daysRemaining / 7)} semanas restantes`;
  if (daysRemaining < 365) return `${Math.ceil(daysRemaining / 30)} meses restantes`;
  return `${Math.ceil(daysRemaining / 365)} anos restantes`;
} 