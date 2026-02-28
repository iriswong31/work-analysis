/**
 * D 模板：年度宣言 + 三段"任务卡"（更像作品海报）
 * 用途：最适合分享，观感像"生活方式海报"
 * 特点：叠放卡片视觉（轻微错位），最多3层
 */
import { forwardRef } from 'react';
import type { GoalFormData } from '../../hooks/useGoalForm';
import { sceneCardSystem as ds } from './designSystem';
import { parseList } from '../../utils/parseList';

interface TemplateDProps {
  formData: GoalFormData;
  quote?: { en: string; source: string };
}

const SCALE = 360 / 1080;
const scaled = (px: number) => px * SCALE;

const defaultQuote = { en: "Write down your dreams, then work to make them real.", source: "How to fix your entire life in 1 day" };

export const TemplateD = forwardRef<HTMLDivElement, TemplateDProps>(
  ({ formData, quote = defaultQuote }, ref) => {
    const yearGoals = parseList(formData.yearGoals);
    const principlesList = parseList(formData.principles || '');
    
    // 随机选取"我的底线"中的一句
    const randomPrinciple = principlesList.length > 0 
      ? principlesList[Math.floor(Math.random() * principlesList.length)]
      : '';
    
    // 显示用户输入的所有年度目标
    const displayCards = yearGoals;

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
        {/* 顶部标题 + 底线随机一句 */}
        <div style={{ marginBottom: scaled(48), textAlign: 'center' }}>
          <h1 style={{
            fontSize: scaled(ds.typography.fontSize.h1),
            fontWeight: ds.typography.fontWeight.semibold,
            color: ds.colors.textPrimary,
            letterSpacing: ds.typography.letterSpacing.title,
            lineHeight: ds.typography.lineHeight.title,
            margin: 0,
            fontFamily: '"Noto Serif SC", serif'
          }}>
            我想要的2026
          </h1>
          {randomPrinciple && (
            <p style={{
              fontSize: scaled(ds.typography.fontSize.body),
              color: ds.colors.textSecondary,
              margin: 0,
              marginTop: scaled(16),
              lineHeight: 1.6
            }}>
              {randomPrinciple}
            </p>
          )}
        </div>

        {/* 卡片列表 - 使用正常流式布局确保下载时不重叠 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: scaled(24),
          paddingBottom: scaled(24)
        }}>
          <div style={{
            width: '100%',
            maxWidth: scaled(850),
            display: 'flex',
            flexDirection: 'column',
            gap: scaled(16)
          }}>
            {displayCards.map((text, i) => {
              // 颜色轮换
              const accentColors = [ds.colors.accent.gold, ds.colors.accent.green, ds.colors.accent.blue];
              
              return (
                <div
                  key={i}
                  style={{
                    background: ds.colors.cardBg,
                    borderRadius: scaled(ds.card.borderRadius),
                    padding: `${scaled(36)}px ${scaled(32)}px`,
                    boxShadow: ds.card.shadow,
                    border: ds.card.border
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: scaled(16)
                  }}>
                    {/* 序号装饰 */}
                    <span style={{
                      fontSize: scaled(40),
                      fontWeight: ds.typography.fontWeight.semibold,
                      color: accentColors[i % accentColors.length],
                      lineHeight: 1,
                      opacity: 0.6
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{
                      fontSize: scaled(32),
                      color: ds.colors.textPrimary,
                      lineHeight: 1.5,
                      margin: 0,
                      flex: 1
                    }}>
                      {text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部英文金句 */}
        <div style={{
          textAlign: 'center',
          marginTop: scaled(48),
          paddingTop: scaled(24),
          borderTop: `1px solid ${ds.colors.divider}`
        }}>
          <p style={{
            fontSize: scaled(ds.typography.fontSize.body),
            color: '#3D4A5C',
            margin: 0,
            lineHeight: 1.6,
            fontStyle: 'italic',
            fontWeight: 500
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

TemplateD.displayName = 'TemplateD';
