import { motion } from 'framer-motion';
import { ProgressBar } from './components/ProgressBar';
import { StepCard } from './components/StepCard';
import type { GoalFormData } from './hooks/useGoalForm';

interface StepFormProps {
  currentStep: number;
  formData: GoalFormData;
  onUpdate: (key: keyof GoalFormData, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onStepClick: (step: number) => void;
  canProceed: boolean;
  isStepValid: (step: number) => boolean;
  onComplete: () => void;
}

export function StepForm({
  currentStep,
  formData,
  onUpdate,
  onNext,
  onPrev,
  onStepClick,
  canProceed,
  isStepValid,
  onComplete
}: StepFormProps) {
  const isLastStep = currentStep === 5;

  return (
    <div 
      className="min-h-screen py-6 px-4"
      style={{
        backgroundImage: 'url(/images/bg-2026.jpg)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* 垂直进度条 - 左侧固定 */}
      <ProgressBar
        currentStep={currentStep}
        onStepClick={onStepClick}
        isStepValid={isStepValid}
      />

      <div className="max-w-md mx-auto">
        {/* 表单内容 */}
        <StepCard
          step={currentStep}
          formData={formData}
          onUpdate={onUpdate}
        />

        {/* 导航按钮 */}
        <div className="mt-6 flex gap-3">
          {currentStep > 0 && (
            <motion.button
              onClick={onPrev}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(93, 122, 158, 0.3)',
                color: '#4A6278'
              }}
            >
              上一步
            </motion.button>
          )}
          
          <motion.button
            onClick={isLastStep ? onComplete : onNext}
            whileTap={{ scale: canProceed ? 0.98 : 1 }}
            disabled={!canProceed}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: canProceed 
                ? 'linear-gradient(135deg, #5D7A9E 0%, #4A6278 100%)'
                : 'rgba(200, 200, 200, 0.5)',
              color: canProceed ? 'white' : '#999',
              boxShadow: canProceed ? '0 4px 15px rgba(93, 122, 158, 0.3)' : 'none'
            }}
          >
            {isLastStep ? '生成目标卡' : '下一步'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
