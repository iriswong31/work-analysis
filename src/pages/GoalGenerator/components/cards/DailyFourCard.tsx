import { forwardRef } from 'react';
import type { GoalFormData } from '../../hooks/useGoalForm';
import { parseList } from '../../utils/parseList';

interface DailyFourCardProps {
  formData: GoalFormData;
  scale?: number;
}

// 场景卡2：今天只做四件小事 - 高级杂志风
export const DailyFourCard = forwardRef<HTMLDivElement, DailyFourCardProps>(
  ({ formData, scale = 1 }, ref) => {
    const scaled = (value: number) => value * scale;
    
    const dailyActions = parseList(formData.dailyActions);
    const displayActions = dailyActions.slice(0, 4);

    // 字体规范：3种大小
    const fontSize = {
      title: scaled(24),        // 主标题
      sectionTitle: scaled(15), // 任务文字
      body: scaled(14),         // 正文
    };

    // CSS 变量
    const cssVars = {
      textPrimary: '#2C3E50',
      textSecondary: '#606F7B',
      glassBg: 'rgba(255, 255, 255, 0.75)',
      glassBorder: 'rgba(255, 255, 255, 0.5)',
      accentGold: '#BFA992',
      quoteBg: 'rgba(191, 169, 146, 0.1)',
      fontSerif: '"Noto Serif SC", serif',
      fontSans: '"Noto Sans SC", sans-serif',
    };

    // 毛玻璃卡片样式
    const cardStyle: React.CSSProperties = {
      background: cssVars.glassBg,
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      borderRadius: scaled(24),
      padding: scaled(35),
      border: `1px solid ${cssVars.glassBorder}`,
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
      display: 'flex',
      flexDirection: 'column' as const,
    };

    // 闪电图标 SVG
    const BoltIcon = () => (
      <svg width={scaled(20)} height={scaled(20)} viewBox="0 0 24 24" fill={cssVars.accentGold}>
        <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
      </svg>
    );

    // 默认四件事
    const defaultActions = [
      '给身体20分钟',
      '给灵感60分钟',
      '给情感30分钟',
      '给爱2小时',
    ];

    const actions = displayActions.length > 0 ? displayActions : defaultActions;

    return (
      <div
        ref={ref}
        style={{
          width: scaled(420),
          backgroundImage: 'url(/images/bg-2026.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          fontFamily: cssVars.fontSans,
          color: cssVars.textPrimary,
          padding: scaled(40),
          boxSizing: 'border-box',
          borderRadius: scaled(24),
          overflow: 'hidden',
        }}
      >
        <div style={cardStyle}>
          {/* 主标题 */}
          <h2 style={{
            fontFamily: cssVars.fontSerif,
            fontSize: fontSize.title,
            fontWeight: 700,
            textAlign: 'center',
            margin: 0,
            marginBottom: scaled(8),
            letterSpacing: scaled(1),
            color: cssVars.textPrimary,
          }}>
            今天，我只做四件小事
          </h2>
          
          {/* 副标题 */}
          <p style={{
            fontFamily: cssVars.fontSerif,
            fontSize: fontSize.body,
            textAlign: 'center',
            color: cssVars.textSecondary,
            fontStyle: 'italic',
            margin: 0,
            marginBottom: scaled(35),
            opacity: 0.8,
          }}>
            愿自己日益坚定且答案在写
          </p>

          {/* 四件事列表 */}
          <ul style={{ 
            padding: 0, 
            margin: 0, 
            marginBottom: scaled(30),
            listStyle: 'none',
          }}>
            {actions.map((action, i) => (
              <li key={i} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: scaled(18),
                fontSize: fontSize.sectionTitle,
                fontWeight: 500,
                color: cssVars.textPrimary,
              }}>
                <span style={{ marginRight: scaled(12), display: 'flex', alignItems: 'center' }}>
                  <BoltIcon />
                </span>
                {action}
              </li>
            ))}
          </ul>

          {/* 引言框 */}
          <div style={{
            marginTop: 'auto',
            padding: scaled(25),
            background: cssVars.quoteBg,
            borderRadius: scaled(16),
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: cssVars.fontSerif,
              fontSize: fontSize.sectionTitle,
              fontWeight: 700,
              color: cssVars.textPrimary,
              marginBottom: scaled(10),
            }}>
              {formData.principles ? formData.principles.split('\n')[0] : '先把自己照顾好，再把灵感做成作品'}
            </div>
            <div style={{
              fontSize: scaled(12),
              color: cssVars.textSecondary,
              letterSpacing: scaled(1),
            }}>
              不内耗 · 不将就
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DailyFourCard.displayName = 'DailyFourCard';
