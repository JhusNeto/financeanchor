export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  is_shared: boolean;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseData {
  amount: number;
  category: string;
  description?: string;
  date: string;
  is_shared: boolean;
  receipt_url?: string;
}

export interface UpdateExpenseData {
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  is_shared?: boolean;
  receipt_url?: string;
}

export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Vestuário',
  'Tecnologia',
  'Serviços',
  'Outros'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  'Alimentação': '🍽️',
  'Transporte': '🚗',
  'Moradia': '🏠',
  'Lazer': '🎮',
  'Saúde': '💊',
  'Educação': '📚',
  'Vestuário': '👕',
  'Tecnologia': '💻',
  'Serviços': '🔧',
  'Outros': '📦'
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Alimentação': 'bg-orange-500',
  'Transporte': 'bg-blue-500',
  'Moradia': 'bg-green-500',
  'Lazer': 'bg-purple-500',
  'Saúde': 'bg-red-500',
  'Educação': 'bg-indigo-500',
  'Vestuário': 'bg-pink-500',
  'Tecnologia': 'bg-gray-500',
  'Serviços': 'bg-yellow-500',
  'Outros': 'bg-slate-500'
}; 