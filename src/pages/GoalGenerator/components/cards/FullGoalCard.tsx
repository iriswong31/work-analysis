import React, { forwardRef } from 'react';
import { GoalFormData } from '../../hooks/useGoalForm';
import { parseList } from '../../utils/parseList';

interface FullGoalCardProps {
  formData: GoalFormData;
  scale?: number;
  quote?: { en: string; source: string };
}

const defaultQuote = { en: "You don't rise to the level of your goals, you fall to the level of your systems.", source: "How to fix your entire life in 1 day" };

export const FullGoalCard = forwardRef<HTMLDivElement, FullGoalCardProps>(
  ({ formData, scale = 1, quote = defaultQuote }, ref) => {
    const scaled = (value: number) => value * scale;
    
    // 字体规范：只有3种大小
    const fontSize = {
      title: scaled(32),        // 大标题
      sectionTitle: scaled(18), // 模块标题
      body: scaled(14),         // 正文和底部
    };
    
    // 解析年度目标为数组
    const yearGoals = parseList(formData.yearGoals);
    
    // 解析每日习惯为数组
    const dailyActions = parseList(formData.dailyActions);
    
    // 解析本月专注为数组（字段名是 monthProjects）
    const monthFocus = parseList(formData.monthProjects);
    
    // 解析底线为数组
    const principles = parseList(formData.principles);

    // 解析我不要为数组（字段名是 antiVision）
    const avoidItems = parseList(formData.antiVision);

    // CSS 变量 - 使用纯色背景以确保 html2canvas 正确渲染
    const cssVars = {
      textPrimary: '#2C3E50',
      textSecondary: '#5D6D7E',
      capsuleBg: '#E4D8C8',
      capsuleText: '#5D4A3A',
      cardBg: '#FAFAFA',
      cardBorder: '#E8E8E8',
      bulletColor: '#BFA992',
    };

    // 卡片样式
    const cardStyle: React.CSSProperties = {
      background: cssVars.cardBg,
      borderRadius: scaled(20),
      padding: scaled(20),
      marginBottom: scaled(14),
      border: `1px solid ${cssVars.cardBorder}`,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
    };

    // 正文样式
    const bodyStyle: React.CSSProperties = {
      fontSize: fontSize.body,
      lineHeight: 1.8,
      color: cssVars.textSecondary,
      margin: 0
    };

    // 模块标题区域 - 简洁无背景框样式
    const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: scaled(12)
      }}>
        <span style={{
          fontSize: fontSize.sectionTitle,
          marginRight: scaled(8),
          lineHeight: 1
        }}>{icon}</span>
        <span style={{
          fontSize: fontSize.sectionTitle,
          fontWeight: 600,
          color: '#2D3748',
          lineHeight: 1
        }}>{title}</span>
      </div>
    );

    return (
      <div
        ref={ref}
        style={{
          width: scaled(420),
          backgroundImage: 'url(/images/bg-2026.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif',
          color: cssVars.textPrimary,
          padding: `${scaled(40)}px ${scaled(20)}px`,
          boxSizing: 'border-box',
          borderRadius: scaled(24),
          overflow: 'hidden'
        }}
      >
        {/* 标题 */}
        <h1 style={{
          fontFamily: '"Noto Serif SC", serif',
          textAlign: 'center',
          fontSize: fontSize.title,
          fontWeight: 700,
          letterSpacing: scaled(2),
          color: '#333',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          margin: 0,
          paddingBottom: scaled(30)
        }}>
          我想要的2026
        </h1>

        {/* 我的愿景 */}
        {formData.vision && (
          <div style={cardStyle}>
            <SectionHeader icon="★" title="我的愿景" />
            <p style={bodyStyle}>{formData.vision}</p>
          </div>
        )}

        {/* 我不要（antiVision） */}
        {avoidItems.length > 0 && (
          <div style={cardStyle}>
            <SectionHeader icon="✕" title="我不要" />
            <p style={bodyStyle}>
              {avoidItems.join('；')}
            </p>
          </div>
        )}

        {/* 年度目标 */}
        {yearGoals.length > 0 && (
          <div style={cardStyle}>
            <SectionHeader icon="◎" title="年度目标" />
            <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {yearGoals.map((goal, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  marginBottom: scaled(6),
                  fontSize: fontSize.body,
                  lineHeight: 1.8,
                  color: cssVars.textSecondary
                }}>
                  <span style={{
                    color: cssVars.bulletColor,
                    fontWeight: 'bold',
                    marginRight: scaled(8),
                    flexShrink: 0
                  }}>•</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 本月专注（monthProjects） */}
        {monthFocus.length > 0 && (
          <div style={cardStyle}>
            <SectionHeader icon="☐" title="本月专注" />
            {monthFocus.map((focus, i) => {
              const hasColon = focus.includes(':') || focus.includes('：');
              if (hasColon) {
                const parts = focus.includes(':') ? focus.split(':') : focus.split('：');
                const label = parts[0];
                const content = parts.slice(1).join(':');
                return (
                  <p key={i} style={{
                    ...bodyStyle,
                    marginBottom: i < monthFocus.length - 1 ? scaled(4) : 0
                  }}>
                    <span style={{ fontWeight: 700, color: cssVars.textPrimary }}>-{label}:</span>
                    {content}
                  </p>
                );
              }
              return (
                <p key={i} style={{
                  ...bodyStyle,
                  marginBottom: i < monthFocus.length - 1 ? scaled(4) : 0
                }}>{focus}</p>
              );
            })}
          </div>
        )}

        {/* 每日习惯 */}
        {dailyActions.length > 0 && (
          <div style={cardStyle}>
            <SectionHeader icon="⚡" title="每日习惯" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: scaled(8) }}>
              {dailyActions.map((action, i) => (
                <div key={i} style={{
                  backgroundColor: cssVars.capsuleBg,
                  color: cssVars.capsuleText,
                  padding: `${scaled(12)}px ${scaled(20)}px`,
                  borderRadius: scaled(50),
                  fontSize: fontSize.body,
                  fontWeight: 500,
                  textAlign: 'left',
                  lineHeight: 1.8
                }}>
                  {i + 1}. {action.replace(/^\d+\.\s*/, '')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 我的底线 */}
        {principles.length > 0 && (
          <div style={cardStyle}>
            <SectionHeader icon="☆" title="我的底线" />
            {principles.map((principle, i) => (
              <p key={i} style={{
                ...bodyStyle,
                marginBottom: i < principles.length - 1 ? scaled(4) : 0
              }}>{principle}</p>
            ))}
          </div>
        )}

        {/* 底部英文金句 */}
        <div style={{
          textAlign: 'center',
          marginTop: scaled(30)
        }}>
          <p style={{
            fontSize: fontSize.body,
            color: '#3D4A5C',
            fontFamily: '"Inter", "SF Pro Display", sans-serif',
            fontStyle: 'italic',
            fontWeight: 500,
            lineHeight: 1.6,
            margin: 0
          }}>
            "{quote.en}"
          </p>
          <p style={{
            fontSize: scaled(12),
            color: '#5D6D7E',
            margin: 0,
            marginTop: scaled(8),
            fontFamily: '"Inter", "SF Pro Display", sans-serif',
            opacity: 0.7
          }}>
            —— 《{quote.source}》
          </p>
        </div>
      </div>
    );
  }
);

FullGoalCard.displayName = 'FullGoalCard';
