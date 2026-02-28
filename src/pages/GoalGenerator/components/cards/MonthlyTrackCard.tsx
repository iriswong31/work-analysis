import { forwardRef } from 'react';
import type { GoalFormData } from '../../hooks/useGoalForm';
import { parseList } from '../../utils/parseList';

interface MonthlyTrackCardProps {
  formData: GoalFormData;
  scale?: number;
}

// 场景卡3：月度追踪卡 - 高级杂志风（时间轴+复选框）
export const MonthlyTrackCard = forwardRef<HTMLDivElement, MonthlyTrackCardProps>(
  ({ formData, scale = 1 }, ref) => {
    const scaled = (value: number) => value * scale;
    
    const dailyActions = parseList(formData.dailyActions);
    const monthProjects = parseList(formData.monthProjects || '');
    const currentMonth = new Date().getMonth() + 1;

    // 字体规范：3种大小
    const fontSize = {
      title: scaled(24),        // 主标题
      sectionTitle: scaled(14), // 模块标题
      body: scaled(14),         // 正文
    };

    // CSS 变量
    const cssVars = {
      textPrimary: '#2C3E50',
      textSecondary: '#606F7B',
      glassBg: 'rgba(255, 255, 255, 0.75)',
      glassBorder: 'rgba(255, 255, 255, 0.5)',
      accentGold: '#BFA992',
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

    // 日历图标
    const CalendarIcon = () => (
      <svg width={scaled(18)} height={scaled(18)} viewBox="0 0 24 24" fill={cssVars.accentGold}>
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
      </svg>
    );

    // 闪电图标
    const BoltIcon = () => (
      <svg width={scaled(18)} height={scaled(18)} viewBox="0 0 24 24" fill={cssVars.accentGold}>
        <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
      </svg>
    );

    // 时间轴月份
    const timelineMonths = [1, 2, 3, 4, 5, 6, 7, 8, 12];

    // 默认本月专注
    const defaultMonthProjects = ['AI coding小产品上线', '插画作品上架（春节主题）', '架子鼓演奏首曲完成《Yellow》'];
    const displayProjects = monthProjects.length > 0 ? monthProjects.slice(0, 3) : defaultMonthProjects;

    // 默认每日习惯
    const defaultDailyActions = ['健身：划船机/跑步', '学习：深度阅读/AI实践', '爱好：书法绘画音乐，至少30min', '陪伴：深度关系情感互动'];
    const displayActions = dailyActions.length > 0 ? dailyActions.slice(0, 4) : defaultDailyActions;

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
            我想要的2026
          </h2>
          
          {/* 副标题 */}
          <p style={{
            fontFamily: cssVars.fontSerif,
            fontSize: fontSize.body,
            textAlign: 'center',
            color: cssVars.textSecondary,
            fontStyle: 'italic',
            margin: 0,
            marginBottom: scaled(20),
            opacity: 0.8,
          }}>
            把自己作品化
          </p>

          {/* 时间轴 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: `${scaled(20)}px ${scaled(10)}px ${scaled(40)}px ${scaled(10)}px`,
            position: 'relative',
          }}>
            {/* 时间轴线 */}
            <div style={{
              position: 'absolute',
              top: scaled(7),
              left: 0,
              right: 0,
              height: scaled(2),
              background: 'rgba(0,0,0,0.05)',
              zIndex: 0,
            }} />
            
            {timelineMonths.map((month) => (
              <div key={month} style={{
                width: scaled(14),
                height: scaled(14),
                borderRadius: '50%',
                background: month === currentMonth ? cssVars.accentGold : 'rgba(0,0,0,0.1)',
                boxShadow: month === currentMonth ? `0 0 0 ${scaled(4)}px rgba(191, 169, 146, 0.2)` : 'none',
                zIndex: 1,
                position: 'relative',
              }}>
                <span style={{
                  position: 'absolute',
                  top: scaled(20),
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: scaled(12),
                  color: cssVars.textSecondary,
                }}>{month}</span>
              </div>
            ))}
          </div>

          {/* 本月专注 */}
          <div style={{ marginBottom: scaled(30) }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              fontWeight: 700,
              marginBottom: scaled(15),
              gap: scaled(8),
            }}>
              <CalendarIcon />
              <span style={{
                fontFamily: cssVars.fontSerif,
                fontSize: fontSize.sectionTitle,
                color: cssVars.textPrimary,
                lineHeight: 1,
              }}>{currentMonth} 本月专注</span>
            </div>
            
            {displayProjects.map((project, i) => (
              <label key={i} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: scaled(10),
                cursor: 'pointer',
                fontSize: fontSize.body,
              }}>
                <span style={{
                  width: scaled(18),
                  height: scaled(18),
                  border: `2px solid ${cssVars.accentGold}`,
                  borderRadius: scaled(5),
                  marginRight: scaled(12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: i === 1 ? cssVars.accentGold : 'transparent',
                }}>
                  {i === 1 && (
                    <span style={{
                      display: 'block',
                      width: scaled(4),
                      height: scaled(8),
                      border: 'solid white',
                      borderWidth: `0 ${scaled(2)}px ${scaled(2)}px 0`,
                      transform: 'rotate(45deg) translate(-1px, -1px)',
                    }} />
                  )}
                </span>
                <span style={{ color: cssVars.textSecondary }}>{project}</span>
              </label>
            ))}
          </div>

          {/* 每日习惯 */}
          <div style={{ marginBottom: scaled(20) }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              fontWeight: 700,
              marginBottom: scaled(15),
              gap: scaled(8),
            }}>
              <BoltIcon />
              <span style={{
                fontFamily: cssVars.fontSerif,
                fontSize: fontSize.sectionTitle,
                color: cssVars.textPrimary,
                lineHeight: 1,
              }}>每日习惯</span>
            </div>
            
            {displayActions.map((action, i) => (
              <label key={i} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: scaled(10),
                cursor: 'pointer',
                fontSize: fontSize.body,
              }}>
                <span style={{
                  width: scaled(18),
                  height: scaled(18),
                  border: `2px solid ${cssVars.accentGold}`,
                  borderRadius: scaled(5),
                  marginRight: scaled(12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }} />
                <span style={{ color: cssVars.textSecondary }}>{action}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

MonthlyTrackCard.displayName = 'MonthlyTrackCard';
