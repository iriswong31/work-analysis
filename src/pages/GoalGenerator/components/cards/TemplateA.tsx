/**
 * A 模板：四象限（我想成为 / 我不做 / 我会做 / 今天只要）
 * 用途：最适合打印贴墙，信息结构清晰
 */
import { forwardRef } from 'react';
import type { GoalFormData } from '../../hooks/useGoalForm';
import { sceneCardSystem as ds } from './designSystem';
import { parseList } from '../../utils/parseList';

interface TemplateAProps {
  formData: GoalFormData;
  quote?: { en: string; source: string };
}

// 缩放因子：将1080设计稿缩放到360宽度的预览
const SCALE = 360 / 1080;
const scaled = (px: number) => px * SCALE;

const defaultQuote = { en: "Small daily actions compound into life-changing results.", source: "How to fix your entire life in 1 day" };

export const TemplateA = forwardRef<HTMLDivElement, TemplateAProps>(
  ({ formData, quote = defaultQuote }, ref) => {
    const yearGoals = parseList(formData.yearGoals);
    const dailyActions = parseList(formData.dailyActions);

    return (
      <div
        ref={ref}
        style={{
          width: scaled(1080),
          backgroundImage: 'url(/images/bg-2026.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          padding: `${scaled(ds.canvas.safeArea.vertical)}px ${scaled(ds.canvas.safeArea.horizontal)}px`,
          fontFamily: ds.typography.fontFamily.cn,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* 顶部标题 - 简洁无边框 */}
        <div style={{ 
          marginBottom: scaled(24), 
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: scaled(ds.typography.fontSize.h1),
            fontWeight: ds.typography.fontWeight.semibold,
            color: ds.colors.textPrimary,
            letterSpacing: ds.typography.letterSpacing.title,
            lineHeight: 1.2,
            margin: 0,
            fontFamily: '"Noto Serif SC", serif'
          }}>
            我想要的2026
          </h1>
        </div>

        {/* 四象限网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: scaled(24)
        }}>
          {/* 左上：我想成为 */}
          <div style={{
            background: ds.colors.cardBg,
            borderRadius: scaled(ds.card.borderRadius),
            padding: scaled(ds.card.paddingSmall),
            boxShadow: ds.card.shadow,
            border: ds.card.border
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: scaled(ds.icon.gap),
              marginBottom: scaled(12)
            }}>
              <span style={{ fontSize: scaled(ds.icon.size), color: ds.colors.accent.gold }}>✦</span>
              <h2 style={{
                fontSize: scaled(ds.typography.fontSize.h2),
                fontWeight: ds.typography.fontWeight.semibold,
                color: ds.colors.textPrimary,
                margin: 0
              }}>我想成为</h2>
            </div>
            <p style={{
              fontSize: scaled(ds.typography.fontSize.body),
              color: ds.colors.textPrimary,
              lineHeight: ds.typography.lineHeight.body,
              margin: 0
            }}>
              {formData.vision || '—'}
            </p>
          </div>

          {/* 右上：我不做 */}
          <div style={{
            background: ds.colors.cardBg,
            borderRadius: scaled(ds.card.borderRadius),
            padding: scaled(ds.card.paddingSmall),
            boxShadow: ds.card.shadow,
            border: ds.card.border
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: scaled(ds.icon.gap),
              marginBottom: scaled(12)
            }}>
              <span style={{ fontSize: scaled(ds.icon.size), color: ds.colors.accent.red }}>—</span>
              <h2 style={{
                fontSize: scaled(ds.typography.fontSize.h2),
                fontWeight: ds.typography.fontWeight.semibold,
                color: ds.colors.textPrimary,
                margin: 0
              }}>我不做</h2>
            </div>
            <p style={{
              fontSize: scaled(ds.typography.fontSize.body),
              color: ds.colors.textSecondary,
              lineHeight: ds.typography.lineHeight.body,
              margin: 0
            }}>
              {formData.antiVision || '—'}
            </p>
          </div>

          {/* 左下：我会做 */}
          <div style={{
            background: ds.colors.cardBg,
            borderRadius: scaled(ds.card.borderRadius),
            padding: scaled(ds.card.paddingSmall),
            boxShadow: ds.card.shadow,
            border: ds.card.border
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: scaled(ds.icon.gap),
              marginBottom: scaled(12)
            }}>
              <span style={{ fontSize: scaled(ds.icon.size), color: ds.colors.accent.green }}>○</span>
              <h2 style={{
                fontSize: scaled(ds.typography.fontSize.h2),
                fontWeight: ds.typography.fontWeight.semibold,
                color: ds.colors.textPrimary,
                margin: 0
              }}>我会做</h2>
            </div>
            <ul style={{
              margin: 0,
              padding: 0,
              listStyle: 'none'
            }}>
              {yearGoals.slice(0, 3).map((goal, i) => (
                <li key={i} style={{
                  fontSize: scaled(ds.typography.fontSize.body),
                  color: ds.colors.textPrimary,
                  lineHeight: ds.typography.lineHeight.body,
                  marginBottom: scaled(6),
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: scaled(8)
                }}>
                  <span style={{ color: ds.colors.textSecondary }}>–</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 右下：今天只要 */}
          <div style={{
            background: ds.colors.cardBg,
            borderRadius: scaled(ds.card.borderRadius),
            padding: scaled(ds.card.paddingSmall),
            boxShadow: ds.card.shadow,
            border: ds.card.border
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: scaled(ds.icon.gap),
              marginBottom: scaled(12)
            }}>
              <span style={{ fontSize: scaled(ds.icon.size), color: ds.colors.accent.blue }}>☐</span>
              <h2 style={{
                fontSize: scaled(ds.typography.fontSize.h2),
                fontWeight: ds.typography.fontWeight.semibold,
                color: ds.colors.textPrimary,
                margin: 0
              }}>今天只要</h2>
            </div>
            <ul style={{
              margin: 0,
              padding: 0,
              listStyle: 'none'
            }}>
              {dailyActions.slice(0, 4).map((action, i) => (
                <li key={i} style={{
                  fontSize: scaled(ds.typography.fontSize.body),
                  color: ds.colors.textPrimary,
                  lineHeight: 1.6,
                  marginBottom: scaled(8),
                  display: 'flex',
                  alignItems: 'center',
                  gap: scaled(8)
                }}>
                  <span style={{
                    width: scaled(16),
                    height: scaled(16),
                    border: `1.5px solid ${ds.colors.textSecondary}`,
                    borderRadius: scaled(3),
                    flexShrink: 0,
                    display: 'inline-block'
                  }} />
                  <span style={{ flex: 1 }}>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 底部英文金句 */}
        <div style={{
          textAlign: 'center',
          marginTop: scaled(24)
        }}>
          <p style={{
            fontSize: scaled(ds.typography.fontSize.caption),
            color: '#3D4A5C',
            margin: 0,
            fontStyle: 'italic',
            fontWeight: 500,
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
    );
  }
);

TemplateA.displayName = 'TemplateA';
