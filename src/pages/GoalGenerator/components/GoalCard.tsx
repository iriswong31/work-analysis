import { forwardRef } from 'react';
import type { GoalFormData } from '../hooks/useGoalForm';
import { parseList } from '../utils/parseList';

// 保留类型导出以兼容可能的旧引用
export type ColorTheme = 'warmGold';

interface GoalCardProps {
  formData: GoalFormData;
}

// 统一暖金色系设计
const style = {
  name: '暖金色',
  bg: 'linear-gradient(180deg, #F5E6D3 0%, #E8D5C4 50%, #DCC8B5 100%)',
  cardBg: 'rgba(255, 255, 255, 0.85)',
  titleColor: '#8B5A2B',
  textColor: '#5D4037',
  accentColor: '#D4A574',
  borderColor: 'rgba(212, 165, 116, 0.3)',
  decorColor: 'rgba(212, 165, 116, 0.2)'
};

// 保留 themeStyles 导出以兼容旧引用
export const themeStyles = {
  warmGold: style
};

export const GoalCard = forwardRef<HTMLDivElement, GoalCardProps>(
  ({ formData }, ref) => {
    const yearGoals = parseList(formData.yearGoals);
    const dailyActions = parseList(formData.dailyActions);
    const principles = parseList(formData.principles);

    return (
      <div
        ref={ref}
        className="w-[400px] min-h-[560px] rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: style.bg }}
      >
        <div className="p-6">
          {/* 标题 */}
          <div className="text-center mb-6">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: style.titleColor }}
            >
              我想要的2026
            </h1>
          </div>

          {/* 内容卡片 */}
          <div 
            className="rounded-2xl p-5 space-y-4"
            style={{ 
              background: style.cardBg,
              border: `2px solid ${style.borderColor}`
            }}
          >
            {/* 愿景 */}
            {formData.vision && (
              <div className="pb-4" style={{ borderBottom: `1px dashed ${style.borderColor}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🌟</span>
                  <span className="font-semibold" style={{ color: style.titleColor }}>我的愿景</span>
                </div>
                <p className="text-sm leading-relaxed pl-7" style={{ color: style.textColor }}>
                  {formData.vision}
                </p>
              </div>
            )}

            {/* 反愿景 */}
            {formData.antiVision && (
              <div className="pb-4" style={{ borderBottom: `1px dashed ${style.borderColor}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🚫</span>
                  <span className="font-semibold" style={{ color: style.titleColor }}>我不要</span>
                </div>
                <p className="text-sm leading-relaxed pl-7 opacity-80" style={{ color: style.textColor }}>
                  {formData.antiVision}
                </p>
              </div>
            )}

            {/* 年度目标 */}
            {yearGoals.length > 0 && (
              <div className="pb-4" style={{ borderBottom: `1px dashed ${style.borderColor}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎯</span>
                  <span className="font-semibold" style={{ color: style.titleColor }}>年度目标</span>
                </div>
                <ul className="space-y-1.5 pl-7">
                  {yearGoals.slice(0, 3).map((goal, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: style.textColor }}>
                      <span style={{ color: style.accentColor }}>•</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 月度项目 */}
            {formData.monthProjects && (
              <div className="pb-4" style={{ borderBottom: `1px dashed ${style.borderColor}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📅</span>
                  <span className="font-semibold" style={{ color: style.titleColor }}>本月专注</span>
                </div>
                <p className="text-sm leading-relaxed pl-7" style={{ color: style.textColor }}>
                  {formData.monthProjects}
                </p>
              </div>
            )}

            {/* 每日行动 */}
            {dailyActions.length > 0 && (
              <div className={principles.length > 0 ? 'pb-4' : ''} 
                   style={{ borderBottom: principles.length > 0 ? `1px dashed ${style.borderColor}` : 'none' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚡</span>
                  <span className="font-semibold" style={{ color: style.titleColor }}>每日习惯</span>
                </div>
                <div className="flex flex-wrap gap-2 pl-7">
                  {dailyActions.slice(0, 4).map((action, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1 rounded-full text-xs"
                      style={{ 
                        background: style.decorColor,
                        color: style.titleColor
                      }}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 底线原则 */}
            {principles.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🛡️</span>
                  <span className="font-semibold" style={{ color: style.titleColor }}>我的底线</span>
                </div>
                <ul className="space-y-1 pl-7">
                  {principles.slice(0, 3).map((p, i) => (
                    <li key={i} className="text-xs opacity-80" style={{ color: style.textColor }}>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 底部装饰 */}
          <div className="mt-4 text-center">
            <p 
              className="text-xs opacity-60"
              style={{ color: style.textColor }}
            >
              2026，愿你成为想成为的自己 ✨
            </p>
          </div>
        </div>
      </div>
    );
  }
);

GoalCard.displayName = 'GoalCard';
