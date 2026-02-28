import { useState, useCallback } from 'react';
import { reminderDb } from '@/daily-reminder/utils/db';

export interface GoalFormData {
  antiVision: string;
  vision: string;
  yearGoals: string;
  monthProjects: string;
  dailyActions: string;
  principles: string;
}

const STORAGE_KEY = 'goal-generator-2026';

const initialData: GoalFormData = {
  antiVision: '',
  vision: '',
  yearGoals: '',
  monthProjects: '',
  dailyActions: '',
  principles: ''
};

/** 将愿景同步到提醒器的年度宣言 */
async function syncVisionToMotto(vision: string) {
  if (!vision.trim()) return;
  try {
    await reminderDb.userSettings.put({ key: 'yearlyMotto', value: vision.trim() });
    window.dispatchEvent(new CustomEvent('motto-updated'));
  } catch { /* ignore */ }
}

export function useGoalForm() {
  const [formData, setFormData] = useState<GoalFormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialData;
    } catch {
      return initialData;
    }
  });

  const [currentStep, setCurrentStep] = useState(0);

  const updateField = useCallback((key: keyof GoalFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      // 当愿景更新时，自动同步到提醒器年度宣言
      if (key === 'vision') {
        syncVisionToMotto(value);
      }
      return newData;
    });
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, 5)));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isStepValid = useCallback((step: number) => {
    const fields: (keyof GoalFormData)[] = [
      'antiVision', 'vision', 'yearGoals', 'monthProjects', 'dailyActions', 'principles'
    ];
    const requiredSteps = [1, 2, 4]; // vision, yearGoals, dailyActions
    
    if (!requiredSteps.includes(step)) return true;
    return formData[fields[step]].trim().length > 0;
  }, [formData]);

  const canProceed = useCallback(() => {
    return isStepValid(currentStep);
  }, [currentStep, isStepValid]);

  return {
    formData,
    currentStep,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
    canProceed,
    isStepValid
  };
}
