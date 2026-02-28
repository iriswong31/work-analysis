/**
 * B 模板：晨间提醒卡（今天我只做四件小事）
 * 用途：温柔陪伴感最强，适合朋友圈
 * 特点：留白最大，行距更松，图标仅用1个点缀色（柔金）
 */
import { forwardRef } from 'react';
import type { GoalFormData } from '../../hooks/useGoalForm';
import { sceneCardSystem as ds } from './designSystem';
import { parseList } from '../../utils/parseList';

interface TemplateBProps {
  formData: GoalFormData;
  quote?: { en: string; source: string };
}

const SCALE = 360 / 1080;
const scaled = (px: number) => px * SCALE;

const defaultQuote = { en: "30 days to become the boss of your own life.", source: "How to fix your entire life in 1 day" };

export const TemplateB = forwardRef<HTMLDivElement, TemplateBProps>(
  ({ formData, quote = defaultQuote }, ref) => {
    const dailyActions = parseList(formData.dailyActions);
    
    // 默认的四件小事示例
    const defaultActions = [
      '给身体20分钟',
      '给灵感60分钟', 
      '给审美30分钟',
      '给爱2小时'
    ];
    
    const displayActions = dailyActions.length > 0 
      ? dailyActions 
      : defaultActions;
    
    // 动态计算"几件"小事
    const actionCount = displayActions.length;
    


    return (
      <div
        ref={ref}
        style={{
          width: scaled(1080),
          minHeight: scaled(800),
          backgroundImage: 'url(/images/bg-2026.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          padding: `${scaled(80)}px ${scaled(90)}px`,
          fontFamily: ds.typography.fontFamily.cn,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* 背景区域标题 - 类似TemplateD */}
        <div style={{ marginBottom: scaled(32), textAlign: 'center' }}>
          <h1 style={{
            fontSize: scaled(52),
            fontWeight: ds.typography.fontWeight.semibold,
            color: ds.colors.textPrimary,
            letterSpacing: ds.typography.letterSpacing.title,
            lineHeight: ds.typography.lineHeight.title,
            margin: 0,
            fontFamily: '"Noto Serif SC", serif'
          }}>
            每日习惯
          </h1>
          <p style={{
            fontSize: scaled(ds.typography.fontSize.body),
            color: ds.colors.textSecondary,
            margin: 0,
            marginTop: scaled(16),
            lineHeight: 1.6
          }}>
            今天，只需要做{actionCount}件小事
          </p>
        </div>

        {/* 大卡片居中 */}
        <div style={{
          background: ds.colors.cardBg,
          borderRadius: scaled(ds.card.borderRadius),
          padding: `${scaled(48)}px ${scaled(40)}px`,
          boxShadow: ds.card.shadow,
          border: ds.card.border,
          width: '100%',
          maxWidth: scaled(900)
        }}>
          {/* 分割线 */}
          <div style={{
            height: 1,
            background: ds.colors.divider,
            marginBottom: scaled(40)
          }} />

          {/* 四条习惯清单 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: scaled(28)
          }}>
            {displayActions.slice(0, 6).map((action, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: scaled(16)
              }}>
                {/* 柔金色小圆点图标 */}
                <span style={{
                  width: scaled(12),
                  height: scaled(12),
                  borderRadius: '50%',
                  background: ds.colors.accent.gold,
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: scaled(30),
                  color: ds.colors.textPrimary,
                  lineHeight: 1.7,
                  fontWeight: ds.typography.fontWeight.regular
                }}>
                  {action}
                </span>
              </div>
            ))}
          </div>

          {/* 分割线 */}
          <div style={{
            height: 1,
            background: ds.colors.divider,
            marginTop: scaled(48),
            marginBottom: scaled(32)
          }} />

          {/* 底部英文金句 */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: scaled(22),
              color: ds.colors.textSecondary,
              margin: 0,
              fontFamily: ds.typography.fontFamily.en,
              fontStyle: 'italic',
              lineHeight: 1.6
            }}>
              "{quote.en}"
            </p>
            <p style={{
              fontSize: scaled(16),
              color: ds.colors.textSecondary,
              margin: 0,
              marginTop: scaled(8),
              fontFamily: ds.typography.fontFamily.en,
              opacity: 0.7
            }}>
              —— 《{quote.source}》
            </p>
          </div>
        </div>
      </div>
    );
  }
);

TemplateB.displayName = 'TemplateB';
