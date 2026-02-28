import { motion, AnimatePresence } from 'framer-motion';
import { stepInfo, inspirations } from '../data/inspirations';
import type { GoalFormData } from '../hooks/useGoalForm';

interface StepCardProps {
  step: number;
  formData: GoalFormData;
  onUpdate: (key: keyof GoalFormData, value: string) => void;
}

// 每个步骤对应的图标和显示标题
const stepIcons: Record<string, { icon: string; label: string }> = {
  antiVision: { icon: '⊘', label: '我不要' },
  vision: { icon: '★', label: '我的愿景' },
  yearGoals: { icon: '◎', label: '年度目标' },
  monthProjects: { icon: '📅', label: '本月专注' },
  dailyActions: { icon: '✓', label: '每日习惯' },
  principles: { icon: '⚡', label: '我的底线' }
};

export function StepCard({ step, formData, onUpdate }: StepCardProps) {
  const info = stepInfo[step];
  const tips = inspirations[info.key as keyof typeof inspirations];
  const value = formData[info.key as keyof GoalFormData];
  const iconInfo = stepIcons[info.key] || { icon: '•', label: info.title };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto"
      >
        {/* 标题区 - 统一字号 */}
        <div className="text-center mb-6">
          <p className="text-sm mb-2" style={{ color: '#718096' }}>{step + 1} / 6</p>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#2D3748' }}>{info.subtitle}</h2>
        </div>

        {/* 原文引用 */}
        {info.quote && (
          <div 
            className="rounded-xl p-4 mb-4"
            style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(10px)',
              borderLeft: '4px solid #8B9DC3'
            }}
          >
            <p className="text-sm italic leading-relaxed" style={{ color: '#5D7A9E' }}>
              "{info.quote}"
            </p>
          </div>
        )}

        {/* 输入区 */}
        <div 
          className="rounded-2xl shadow-lg p-5 mb-4"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 157, 195, 0.2)'
          }}
        >
          {/* 带图标的标签 */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(139, 157, 195, 0.3)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <span style={{ fontSize: '16px', color: '#4A6278' }}>{iconInfo.icon}</span>
            <span style={{ 
              fontSize: '15px', 
              fontWeight: 600, 
              color: '#2D3748',
              letterSpacing: '0.5px'
            }}>
              {iconInfo.label}
            </span>
          </div>

          <textarea
            value={value}
            onChange={(e) => onUpdate(info.key as keyof GoalFormData, e.target.value)}
            placeholder={info.placeholder}
            rows={info.multiline ? 5 : 3}
            className="w-full resize-none border-0 focus:ring-0 text-base leading-relaxed bg-transparent"
            style={{ 
              outline: 'none',
              color: '#2D3748',
            }}
          />
        </div>

        {/* 灵感提示 */}
        <div 
          className="rounded-xl p-4"
          style={{
            background: 'rgba(139, 157, 195, 0.15)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <p className="text-sm mb-3" style={{ color: '#718096' }}>参考：</p>
          <div className="flex flex-wrap gap-2">
            {tips.map((tip, index) => (
              <button
                key={index}
                onClick={() => {
                  const current = value.trim();
                  const newValue = current ? `${current}\n${tip}` : tip;
                  onUpdate(info.key as keyof GoalFormData, newValue);
                }}
                className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  color: '#4A6278',
                  border: '1px solid rgba(93, 122, 158, 0.3)'
                }}
              >
                {tip}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
