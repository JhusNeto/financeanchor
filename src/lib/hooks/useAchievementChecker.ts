'use client';

import { useCallback, useEffect } from 'react';
import { checkAchievements, addAchievement } from '../achievements';
import { AchievementType } from '../../types/achievement';

interface UseAchievementCheckerProps {
  expenses?: any[];
  goals?: any[];
  debts?: any[];
  budgets?: any[];
  weeklySpending?: number;
  weeklyBudget?: number;
  totalSaved?: number;
  consecutiveDays?: number;
  newDebtsThisMonth?: number;
  monthsSaving?: number;
  onNewAchievement?: (achievementType: AchievementType) => void;
}

export function useAchievementChecker({
  expenses = [],
  goals = [],
  debts = [],
  budgets = [],
  weeklySpending = 0,
  weeklyBudget = 0,
  totalSaved = 0,
  consecutiveDays = 0,
  newDebtsThisMonth = 0,
  monthsSaving = 0,
  onNewAchievement
}: UseAchievementCheckerProps) {
  
  const checkForAchievements = useCallback(async () => {
    try {
      const achievementData = {
        expenses,
        goals,
        debts,
        budgets,
        weeklySpending,
        weeklyBudget,
        totalSaved,
        consecutiveDays,
        newDebtsThisMonth,
        monthsSaving
      };

      const newAchievements = await checkAchievements(achievementData);
      
      // Notificar sobre novas conquistas
      for (const achievementType of newAchievements) {
        onNewAchievement?.(achievementType);
      }

      return newAchievements;
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
      return [];
    }
  }, [
    expenses,
    goals,
    debts,
    budgets,
    weeklySpending,
    weeklyBudget,
    totalSaved,
    consecutiveDays,
    newDebtsThisMonth,
    monthsSaving,
    onNewAchievement
  ]);

  // Verificar conquistas quando os dados mudam
  useEffect(() => {
    if (expenses.length > 0 || goals.length > 0 || debts.length > 0 || budgets.length > 0) {
      checkForAchievements();
    }
  }, [
    expenses.length,
    goals.length,
    debts.length,
    budgets.length,
    weeklySpending,
    weeklyBudget,
    totalSaved,
    consecutiveDays,
    newDebtsThisMonth,
    monthsSaving,
    checkForAchievements
  ]);

  return {
    checkForAchievements
  };
} 