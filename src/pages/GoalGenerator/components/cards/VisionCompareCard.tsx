import { forwardRef } from 'react';
import type { GoalFormData } from '../../hooks/useGoalForm';
import { parseList } from '../../utils/parseList';

interface VisionCompareCardProps {
  formData: GoalFormData;
  scale?: number;
}

// 场景卡1：双栏对比布局 - 高级杂志风
export const VisionCompareCard = forwardRef<HTMLDivElement, VisionCompareCardProps>(
  ({ formData, scale = 1 }, ref) => {
    const scaled = (value: number) => value * scale;
    
    const yearGoals = parseList(formData.yearGoals);
    const avoidItems = parseList(formData.antiVision || '');

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
            {formData.vision ? formData.vision.slice(0, 20) + (formData.vision.length > 20 ? '...' : '') : '愿大脑和身体都像战车一样'}
          </p>

          {/* 双栏对比 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: scaled(25),
            marginBottom: scaled(20),
            paddingBottom: scaled(20),
            borderBottom: '1px solid rgba(191, 169, 146, 0.2)',
          }}>
            {/* 我想成为 */}
            <div>
              <div style={{
                fontFamily: cssVars.fontSerif,
                fontWeight: 700,
                fontSize: fontSize.sectionTitle,
                marginBottom: scaled(15),
                textAlign: 'center',
                color: cssVars.textPrimary,
              }}>我想成为</div>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                <li style={{
                  position: 'relative',
                  paddingLeft: scaled(15),
                  marginBottom: scaled(10),
                  fontSize: fontSize.body,
                  lineHeight: 1.75,
                  color: cssVars.textSecondary,
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: scaled(2),
                    color: cssVars.accentGold,
                    fontWeight: 'bold',
                    fontSize: scaled(18),
                  }}>•</span>
                  {formData.vision ? formData.vision.slice(0, 30) : '逻辑清晰敏锐的人'}
                </li>
              </ul>
            </div>

            {/* 我都不做 */}
            <div>
              <div style={{
                fontFamily: cssVars.fontSerif,
                fontWeight: 700,
                fontSize: fontSize.sectionTitle,
                marginBottom: scaled(15),
                textAlign: 'center',
                color: cssVars.textPrimary,
              }}>我都不做</div>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {(avoidItems.length > 0 ? avoidItems.slice(0, 3) : ['时间仍然碎片化被动消耗', '想法很多却什么都没做', '活得不自由']).map((item, i) => (
                  <li key={i} style={{
                    position: 'relative',
                    paddingLeft: scaled(15),
                    marginBottom: scaled(10),
                    fontSize: fontSize.body,
                    lineHeight: 1.75,
                    color: cssVars.textSecondary,
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      top: scaled(2),
                      color: cssVars.accentGold,
                      fontWeight: 'bold',
                      fontSize: scaled(18),
                    }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 我会做 */}
          <div>
            <div style={{
              fontFamily: cssVars.fontSerif,
              fontWeight: 700,
              fontSize: fontSize.sectionTitle,
              marginBottom: scaled(10),
              marginTop: scaled(20),
              color: cssVars.textPrimary,
            }}>我会做</div>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {(yearGoals.length > 0 ? yearGoals.slice(0, 3) : ['编译彩虹代码', '探索第二人生', '之2026：让灵感作品化']).map((goal, i) => (
                <li key={i} style={{
                  position: 'relative',
                  paddingLeft: scaled(15),
                  marginBottom: scaled(10),
                  fontSize: fontSize.body,
                  lineHeight: 1.75,
                  color: cssVars.textSecondary,
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: scaled(2),
                    color: cssVars.accentGold,
                    fontWeight: 'bold',
                    fontSize: scaled(18),
                  }}>•</span>
                  {goal}
                </li>
              ))}
            </ul>
          </div>

          {/* 底部装饰 */}
          <div style={{ textAlign: 'center', marginTop: scaled(20), opacity: 0.6 }}>
            <svg width={scaled(40)} height={scaled(10)} viewBox="0 0 40 10" fill="none">
              <path d="M0 5H40" stroke="#BFA992" strokeWidth="1"/>
              <circle cx="20" cy="5" r="3" fill="#BFA992"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }
);

VisionCompareCard.displayName = 'VisionCompareCard';
