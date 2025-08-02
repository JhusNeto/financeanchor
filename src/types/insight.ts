// =====================================================
// TIPOS PARA SISTEMA DE INSIGHTS - FINANCEANCHOR
// =====================================================

export interface DailyInsight {
  id: string;
  user_id: string;
  date: string;
  message: string;
  created_at: string;
}

export interface TodayInsight {
  insight_id: string;
  message: string;
  date: string;
}

export interface UserInsight {
  id: string;
  message: string;
  date: string;
  created_at: string;
}

// Constantes para tipos de insights
export const INSIGHT_TYPES = {
  WEEKLY_COMPARISON: 'weekly_comparison',
  MONEY_LEFT: 'money_left',
  GOAL_PROGRESS: 'goal_progress',
  DEFAULT: 'default'
} as const;

// Mensagens padrão para diferentes situações
export const DEFAULT_INSIGHTS = [
  'Continue assim! Cada dia importa. 💪',
  'Você está no caminho certo! 🌟',
  'Pequenas economias fazem grandes diferenças! 💰',
  'Foco nos seus objetivos! 🎯',
  'Você está construindo um futuro melhor! 🚀',
  'Cada decisão financeira conta! 💎',
  'Mantenha a consistência! 📈',
  'Seu futuro agradece! 🙏'
];

// Função para obter mensagem padrão aleatória
export function getRandomDefaultInsight(): string {
  const randomIndex = Math.floor(Math.random() * DEFAULT_INSIGHTS.length);
  return DEFAULT_INSIGHTS[randomIndex];
}

// Função para formatar data
export function formatInsightDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR');
  }
}

// Função para obter emoji baseado no tipo de insight
export function getInsightEmoji(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('economizou') || lowerMessage.includes('menos')) return '👏';
  if (lowerMessage.includes('sobrando') || lowerMessage.includes('investir')) return '💰';
  if (lowerMessage.includes('sonho') || lowerMessage.includes('conquistar')) return '🎯';
  if (lowerMessage.includes('caminho') || lowerMessage.includes('certo')) return '🌟';
  if (lowerMessage.includes('futuro') || lowerMessage.includes('melhor')) return '🚀';
  if (lowerMessage.includes('consistência') || lowerMessage.includes('foco')) return '💪';
  
  return '💡'; // Emoji padrão
}

// Função para obter cor baseada no tipo de insight
export function getInsightColor(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('economizou') || lowerMessage.includes('menos')) return 'bg-green-50 border-green-200 text-green-800';
  if (lowerMessage.includes('sobrando') || lowerMessage.includes('investir')) return 'bg-blue-50 border-blue-200 text-blue-800';
  if (lowerMessage.includes('sonho') || lowerMessage.includes('conquistar')) return 'bg-purple-50 border-purple-200 text-purple-800';
  if (lowerMessage.includes('caminho') || lowerMessage.includes('certo')) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  
  return 'bg-gray-50 border-gray-200 text-gray-800'; // Cor padrão
}

// Função para verificar se é um insight positivo
export function isPositiveInsight(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const positiveKeywords = [
    'economizou', 'menos', 'ótimo', 'progresso', 'sobrando', 
    'investir', 'sonho', 'conquistar', 'caminho', 'certo',
    'futuro', 'melhor', 'consistência', 'foco', 'importa'
  ];
  
  return positiveKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Função para obter categoria do insight
export function getInsightCategory(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('economizou') || lowerMessage.includes('menos')) return 'Economia';
  if (lowerMessage.includes('sobrando') || lowerMessage.includes('investir')) return 'Oportunidade';
  if (lowerMessage.includes('sonho') || lowerMessage.includes('conquistar')) return 'Meta';
  if (lowerMessage.includes('caminho') || lowerMessage.includes('certo')) return 'Motivação';
  
  return 'Geral';
}

// Interface para configurações de insights
export interface InsightConfig {
  enableWeeklyComparison: boolean;
  enableMoneyLeft: boolean;
  enableGoalProgress: boolean;
  enableDefaultMessages: boolean;
  minMoneyLeftThreshold: number;
  goalProgressThreshold: number;
}

// Configuração padrão
export const DEFAULT_INSIGHT_CONFIG: InsightConfig = {
  enableWeeklyComparison: true,
  enableMoneyLeft: true,
  enableGoalProgress: true,
  enableDefaultMessages: true,
  minMoneyLeftThreshold: 500,
  goalProgressThreshold: 80
}; 