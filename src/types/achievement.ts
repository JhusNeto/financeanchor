export interface Achievement {
  id: string;
  user_id: string;
  type: AchievementType;
  title: string;
  description: string;
  earned_at: string;
  created_at?: string;
}

export type AchievementType = 
  | 'primeiro_gasto'
  | 'semana_orcamento'
  | 'meta_atingida'
  | 'mil_economizados'
  | 'divida_zerada'
  | '30_dias_app'
  | 'primeira_meta'
  | 'orcamento_mensal'
  | 'sem_dividas_mes'
  | 'economia_consistente';

export interface AchievementConfig {
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  color: string;
  condition: (data: any) => boolean;
}

export interface AchievementProgress {
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  maxValue: number;
  currentValue: number;
  unit: string;
}

export interface AchievementNotification {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  color: string;
  timestamp: Date;
} 