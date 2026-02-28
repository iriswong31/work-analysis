/**
 * C 模板：时间轴 + 本月专注（可打勾）
 * 用途：最能激励、最适合打印打卡
 * 特点：12个月时间轴横排，checkbox便于打印手写勾选
 */
import { forwardRef } from 'react';
import type { GoalFormData } from '../../hooks/useGoalForm';
import { sceneCardSystem as ds } from './designSystem';
import { parseList } from '../../utils/parseList';

interface TemplateCProps {
  formData: GoalFormData;
  quote?: { en: string; source: string };
}

const SCALE = 360 / 1080;
const scaled = (px: number) => px * SCALE;

// 获取当前月份
const currentMonth = new Date().getMonth() + 1;

const defaultQuote = { en: "2026, become who you want to be.", source: "How to fix your entire life in 1 day" };

export const TemplateC = forwardRef<HTMLDivElement, TemplateCProps>(
  ({ formData, quote = defaultQuote }, ref) => {
    const monthFocus = formData.monthProjects ? [formData.monthProjects] : [];
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
        {/* 顶部标题 */}
        <div style={{ marginBottom: scaled(20), textAlign: 'center' }}>
          <h1 style={{
            fontSize: scaled(ds.typography.fontSize.h1),
            fontWeight: ds.typography.fontWeight.semibold,
            color: ds.colors.textPrimary,
            letterSpacing: ds.typography.letterSpacing.title,
            lineHeight: ds.typography.lineHeight.title,
            margin: 0,
            fontFamily: '"Noto Serif SC", serif'
          }}>
            月度项目
          </h1>
          <p style={{
            fontSize: scaled(ds.typography.fontSize.caption),
            color: ds.colors.textSecondary,
            margin: 0,
            marginTop: scaled(8)
          }}>30天boss战</p>
        </div>

        {/* 时间轴：12个圆点横排 - 当前月份强调 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${scaled(20)}px ${scaled(16)}px`,
          marginBottom: scaled(24)
        }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
            const isCurrent = month === currentMonth;
            const isPast = month < currentMonth;
            
            return (
              <div key={month} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: scaled(6)
              }}>
                <div style={{
                  width: scaled(isCurrent ? 24 : 14),
                  height: scaled(isCurrent ? 24 : 14),
                  borderRadius: '50%',
                  border: isCurrent 
                    ? `3px solid ${ds.colors.accent.gold}` 
                    : `1.5px solid ${isPast ? ds.colors.accent.gold : ds.colors.divider}`,
                  background: isPast ? ds.colors.accent.gold : 'transparent',
                  boxShadow: isCurrent ? `0 0 12px ${ds.colors.accent.gold}40` : 'none'
                }} />
                <span style={{
                  fontSize: scaled(isCurrent ? 22 : 16),
                  color: isCurrent ? ds.colors.textPrimary : ds.colors.textSecondary,
                  fontWeight: isCurrent ? 700 : ds.typography.fontWeight.regular
                }}>
                  {month}
                </span>
              </div>
            );
          })}
        </div>

        {/* 本月专注卡片 */}
        <div style={{
          background: ds.colors.cardBg,
          borderRadius: scaled(ds.card.borderRadius),
          padding: scaled(ds.card.padding),
          boxShadow: ds.card.shadow,
          border: ds.card.border,
          marginBottom: scaled(24)
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: scaled(ds.icon.gap),
            marginBottom: scaled(16)
          }}>
            <span style={{ fontSize: scaled(ds.icon.size), color: ds.colors.accent.green }}>◎</span>
            <h2 style={{
              fontSize: scaled(ds.typography.fontSize.h2),
              fontWeight: ds.typography.fontWeight.semibold,
              color: ds.colors.textPrimary,
              margin: 0
            }}>本月专注</h2>
          </div>
          
          {monthFocus.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {monthFocus.slice(0, 3).map((item, i) => (
                <li key={i} style={{
                  fontSize: scaled(ds.typography.fontSize.body),
                  color: ds.colors.textPrimary,
                  lineHeight: ds.typography.lineHeight.body,
                  marginBottom: scaled(12),
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: scaled(12)
                }}>
                  <span style={{
                    width: scaled(22),
                    height: scaled(22),
                    border: `2px solid ${ds.colors.textSecondary}`,
                    borderRadius: scaled(4),
                    flexShrink: 0,
                    marginTop: scaled(2)
                  }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{
              fontSize: scaled(ds.typography.fontSize.body),
              color: ds.colors.textSecondary,
              margin: 0
            }}>暂未设定本月目标</p>
          )}
        </div>

        {/* 每日习惯卡片 */}
        <div style={{
          background: ds.colors.cardBg,
          borderRadius: scaled(ds.card.borderRadius),
          padding: scaled(ds.card.padding),
          boxShadow: ds.card.shadow,
          border: ds.card.border
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: scaled(ds.icon.gap),
            marginBottom: scaled(20)
          }}>
            <span style={{ fontSize: scaled(ds.icon.size), color: ds.colors.accent.blue }}>⚡</span>
            <h2 style={{
              fontSize: scaled(ds.typography.fontSize.h2),
              fontWeight: ds.typography.fontWeight.semibold,
              color: ds.colors.textPrimary,
              margin: 0
            }}>每日习惯</h2>
          </div>
          
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {dailyActions.slice(0, 4).map((action, i) => (
              <li key={i} style={{
                fontSize: scaled(ds.typography.fontSize.body),
                color: ds.colors.textPrimary,
                lineHeight: ds.typography.lineHeight.body,
                marginBottom: scaled(14),
                display: 'flex',
                alignItems: 'flex-start',
                gap: scaled(12)
              }}>
                <span style={{
                  width: scaled(22),
                  height: scaled(22),
                  border: `2px solid ${ds.colors.textSecondary}`,
                  borderRadius: scaled(4),
                  flexShrink: 0,
                  marginTop: scaled(2)
                }} />
                <span>{action}</span>
              </li>
            ))}
            {dailyActions.length === 0 && (
              <p style={{
                fontSize: scaled(ds.typography.fontSize.body),
                color: ds.colors.textSecondary,
                margin: 0
              }}>暂未设定每日习惯</p>
            )}
          </ul>
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

TemplateC.displayName = 'TemplateC';
