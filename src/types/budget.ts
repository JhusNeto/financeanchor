export interface Budget {
  id: string;
  user_id: string;
  month: string; // Format: YYYY-MM
  category: string;
  limit_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetData {
  category: string;
  limit_amount: number;
  month?: string; // Optional, defaults to current month
}

export interface UpdateBudgetData {
  limit_amount?: number;
}

export interface BudgetStatus {
  category: string;
  budget_limit: number;
  total_spent: number;
  percentage_used: number;
  status_color: 'green' | 'yellow' | 'red';
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  percentage_used: number;
  status_color: 'green' | 'yellow' | 'red';
}

export const BUDGET_STATUS_COLORS = {
  green: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    border: 'border-green-200',
    light: 'bg-green-50',
    dark: 'bg-green-600'
  },
  yellow: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-600',
    border: 'border-yellow-200',
    light: 'bg-yellow-50',
    dark: 'bg-yellow-600'
  },
  red: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    border: 'border-red-200',
    light: 'bg-red-50',
    dark: 'bg-red-600'
  }
} as const;

export const getBudgetStatusColor = (percentage: number) => {
  if (percentage < 70) return 'green';
  if (percentage < 100) return 'yellow';
  return 'red';
};

export const getBudgetStatusText = (percentage: number) => {
  if (percentage < 70) return 'Dentro do orçamento';
  if (percentage < 100) return 'Atenção';
  return 'Orçamento estourado';
}; 