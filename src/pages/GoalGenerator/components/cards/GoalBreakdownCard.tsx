import { forwardRef } from 'react';
import type { GoalFormData } from '../../hooks/useGoalForm';
import { parseList } from '../../utils/parseList';

interface GoalBreakdownCardProps {
  formData: GoalFormData;
  scale?: number;
}

// 场景卡4：大图标详细列表 - 高级杂志风
export const GoalBreakdownCard = forwardRef<HTMLDivElement, GoalBreakdownCardProps>(
  ({ formData, scale = 1 }, ref) => {
    const scaled = (value: number) => value * scale;
    
    const yearGoals = parseList(formData.yearGoals);

    // 字体规范：3种大小
    const fontSize = {
      title: scaled(24),        // 主标题
      sectionTitle: scaled(16), // 模块标题
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
    };

    // 星星图标
    const StarIcon = () => (
      <svg width={scaled(28)} height={scaled(28)} viewBox="0 0 24 24" fill={cssVars.accentGold}>
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    );

    // 指南针图标
    const CompassIcon = () => (
      <svg width={scaled(28)} height={scaled(28)} viewBox="0 0 24 24" fill={cssVars.accentGold}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.22-3.22-7.51-7.51 3.22 3.22 7.51zm5.5-4c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z"/>
      </svg>
    );

    // 默认目标数据
    const defaultGoals = [
      { title: '编译彩虹代码，探索第二人生', desc: '探索第二人生，探索第二人生' },
      { title: '之2026：让灵感作品化', desc: '在探索脑海里实现想法' },
      { title: '探索新人生', desc: '...' },
    ];

    // 从用户数据生成目标列表
    const goals = yearGoals.length > 0 
      ? yearGoals.slice(0, 3).map((goal, i) => ({
          title: goal,
          desc: i === 0 ? (formData.vision || '...') : '...',
        }))
      : defaultGoals;

    const icons = [StarIcon, CompassIcon, StarIcon];

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
            2026 · 把自己作品化
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
            践行真我
          </p>

          {/* 大图标详细列表 */}
          {goals.map((goal, i) => {
            const IconComponent = icons[i % icons.length];
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: scaled(30),
              }}>
                {/* 大图标 */}
                <div style={{
                  flexShrink: 0,
                  width: scaled(50),
                  height: scaled(50),
                  marginRight: scaled(20),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: cssVars.quoteBg,
                  borderRadius: '50%',
                }}>
                  <IconComponent />
                </div>
                
                {/* 内容 */}
                <div>
                  <h3 style={{
                    fontFamily: cssVars.fontSerif,
                    fontSize: fontSize.sectionTitle,
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: scaled(6),
                    color: cssVars.textPrimary,
                  }}>{goal.title}</h3>
                  <p style={{
                    fontSize: scaled(13),
                    color: cssVars.textSecondary,
                    margin: 0,
                    lineHeight: 1.6,
                  }}>{goal.desc}</p>
                </div>
              </div>
            );
          })}

          {/* 引言框 */}
          <div style={{
            marginTop: scaled(20),
            padding: scaled(25),
            background: cssVars.quoteBg,
            borderRadius: scaled(16),
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: cssVars.fontSerif,
              fontSize: fontSize.body,
              fontWeight: 700,
              color: cssVars.textPrimary,
            }}>
              {formData.principles ? formData.principles.split('\n')[0] : '把灵感写成作品，把理想写进生活。'}
            </div>
          </div>

          {/* 底部文字 */}
          <div style={{
            textAlign: 'center',
            marginTop: scaled(30),
            fontSize: scaled(12),
            color: cssVars.textSecondary,
            opacity: 0.8,
          }}>
            2026，愿你成为想成为的自己
          </div>
        </div>
      </div>
    );
  }
);

GoalBreakdownCard.displayName = 'GoalBreakdownCard';
