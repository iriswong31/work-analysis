import { motion } from 'framer-motion';
import { stepInfo } from '../data/inspirations';

interface ProgressBarProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  isStepValid: (step: number) => boolean;
}

export function ProgressBar({ currentStep, onStepClick, isStepValid }: ProgressBarProps) {
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-10 hidden sm:block">
      {/* 垂直进度条 */}
      <div className="relative flex flex-col items-center">
        {/* 背景线 */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full"
          style={{ background: 'rgba(139, 157, 195, 0.3)' }}
        />
        
        {/* 进度线 */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 origin-top"
          style={{ background: '#5D7A9E' }}
          initial={{ height: 0 }}
          animate={{ height: `${(currentStep / 5) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
        
        {/* 步骤点 */}
        <div className="relative flex flex-col gap-6">
          {stepInfo.map((step, index) => (
            <button
              key={step.key}
              onClick={() => onStepClick(index)}
              className="relative flex items-center"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200"
                style={{
                  background: index === currentStep 
                    ? '#5D7A9E'
                    : index < currentStep
                      ? '#5D7A9E'
                      : 'rgba(255,255,255,0.8)',
                  color: index <= currentStep ? 'white' : '#8B9DC3',
                  transform: index === currentStep ? 'scale(1.25)' : 'scale(1)',
                  boxShadow: index === currentStep ? '0 4px 12px rgba(93, 122, 158, 0.4)' : 'none'
                }}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
