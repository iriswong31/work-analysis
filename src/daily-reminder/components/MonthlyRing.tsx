import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CompoundCategory, ReminderStatus } from '@/types/reminder';
import { useReminderStore } from '../stores/reminderStore';
import { useIdeaStore } from '../stores/ideaStore';
import { categoryLeafColors, categoryInfo } from '../constants/messages';
import { Share2, Download } from 'lucide-react';

interface MonthlyLeaf {
  date: string;
  reminderId: string;
  category: CompoundCategory;
  status: ReminderStatus | 'pending';
}

interface MonthlyFlower {
  id: string;
  category: CompoundCategory;
  categories: CompoundCategory[]; // 所有分类（用于多色花瓣）
  totalPetals: number;   // 子任务总数 = 花瓣总数
  donePetals: number;    // 已完成子任务数 = 上色花瓣数
}

interface MonthlyRingProps {
  onShare?: () => void;
  onDownload?: () => void;
}

// 分类排序：custom排最后
const categoryOrder: CompoundCategory[] = ['health', 'finance', 'relation', 'creation', 'joy', 'skill', 'custom'];

function sortedCategoryEntries<T>(obj: Record<string, T>): [string, T][] {
  return Object.entries(obj).sort(([a], [b]) => {
    const ai = categoryOrder.indexOf(a as CompoundCategory);
    const bi = categoryOrder.indexOf(b as CompoundCategory);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

// 基于种子的伪随机数，让叶子位置稳定
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function MonthlyRing({ onShare, onDownload }: MonthlyRingProps) {
  const { getMonthlyDetailedLogs, isInitialized } = useReminderStore();
  const { ideas, loadIdeas } = useIdeaStore();
  const [leaves, setLeaves] = useState<MonthlyLeaf[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();

  useEffect(() => {
    if (!isInitialized) return;
    setLoading(true);
    Promise.all([
      getMonthlyDetailedLogs(year, month),
      loadIdeas(),
    ]).then(([data]) => {
      // 过滤掉灵感来源的提醒（它们只对应花瓣，不新增叶子）
      const { reminders } = useReminderStore.getState();
      const ideaReminderIds = new Set(
        reminders.filter(r => r.sourceIdeaId).map(r => r.id)
      );
      setLeaves(data.filter(l => !ideaReminderIds.has(l.reminderId)));
      setLoading(false);
    });
  }, [isInitialized, year, month, getMonthlyDetailedLogs, loadIdeas]);

  // 每个灵感 = 一朵花，子任务数 = 花瓣数，完成一个 = 一片花瓣上色
  const flowers: MonthlyFlower[] = useMemo(() => {
    return ideas
      .filter(idea => idea.subTasks.length > 0)
      .map(idea => {
        const cats = (idea.categories && idea.categories.length > 0) ? idea.categories : (idea.category ? [idea.category] : ['custom'] as CompoundCategory[]);
        return {
          id: idea.id,
          category: cats[0],
          categories: cats,
          totalPetals: idea.subTasks.length,
          donePetals: idea.subTasks.filter(st => st.done).length,
        };
      });
  }, [ideas]);

  const flowerCount = flowers.length;
  const totalDonePetals = flowers.reduce((s, f) => s + f.donePetals, 0);

  // 统计
  const stats = useMemo(() => {
    const total = leaves.length;
    const completed = leaves.filter(l => l.status === 'done').length;
    const rate = total > 0 ? completed / total : 0;

    const byCategory: Record<string, { total: number; done: number; category: CompoundCategory }> = {};
    leaves.forEach(l => {
      if (!byCategory[l.category]) {
        byCategory[l.category] = { total: 0, done: 0, category: l.category };
      }
      byCategory[l.category].total++;
      if (l.status === 'done') byCategory[l.category].done++;
    });

    return { total, completed, rate, byCategory };
  }, [leaves]);

  // 布局参数 — 三层同心嵌套
  const containerSize = 280;
  const svgSize = containerSize;
  const center = svgSize / 2;

  // 外围花环半径（叶子中心所在的圆）
  const wreathRadius = 110;
  // 进度弧半径 — 紧贴花环内边缘，不被叶片完全遮挡
  const progressRadius = 96;
  const circumference = 2 * Math.PI * progressRadius;
  const progressOffset = circumference * (1 - stats.rate);

  const leafRadius = wreathRadius;

  // 稳定随机打乱叶子顺序 — 让 done 的叶子不扎堆
  const shuffledLeaves = useMemo(() => {
    if (leaves.length === 0) return [];
    const arr = leaves.map((leaf, origIdx) => ({ leaf, origIdx }));
    const shuffleSeed = year * 13 + month * 7 + leaves.length * 3;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(shuffleSeed + i * 97) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [leaves, year, month]);

  // ★ 花环叶片：80-90片水滴形叶子均匀分布，形成紧密层叠
  const WREATH_LEAF_COUNT = 85;

  const wreathLeafArray = useMemo(() => {
    if (shuffledLeaves.length === 0) return [];
    return Array.from({ length: WREATH_LEAF_COUNT }, (_, i) => {
      const src = shuffledLeaves[i % shuffledLeaves.length];
      return { ...src, wreathIdx: i };
    });
  }, [shuffledLeaves]);

  const leafCount = shuffledLeaves.length;

  const monthName = `${month + 1}月`;

  if (loading) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="text-sm" style={{ color: 'var(--cb-color-primary-medium)' }}>
          加载月度数据...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* 月份标题 */}
      <div className="flex items-center justify-between w-full px-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: 'var(--cb-color-primary-dark)' }}>
            {year}年{monthName}
          </span>
          <span className="text-sm" style={{ color: 'var(--cb-color-primary-medium)' }}>
            第{currentDay}/{daysInMonth}天
          </span>
        </div>
        {onDownload && (
          <button
            onClick={onDownload}
            data-html2canvas-ignore="true"
            className="p-2 rounded-xl transition-all active:scale-90"
            style={{ color: 'var(--cb-color-primary-medium)' }}
            title="下载月度盘点图"
          >
            <Download className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* 月度环 — 单一 SVG，内部分层 */}
      <div style={{
        position: 'relative',
        width: containerSize,
        height: containerSize,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
      }}>
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="monthRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7BAF6E" />
              <stop offset="50%" stopColor="#5B9A4E" />
              <stop offset="100%" stopColor="#7BAF6E" />
            </linearGradient>
          </defs>

          {/* Layer 1: 表盘 — 圆框 + 罗马数字 + 扇形进度 */}
          <g>
            {/* 表盘底色圆 */}
            <circle cx={center} cy={center} r={progressRadius} fill="rgba(255,252,247,0.6)" />

            {/* 扇形进度填充 */}
            {stats.rate > 0 && (() => {
              const r = progressRadius - 1;
              const ang = stats.rate * 2 * Math.PI;
              const startA = -Math.PI / 2;
              const endA = startA + ang;
              const x1 = center + r * Math.cos(startA);
              const y1 = center + r * Math.sin(startA);
              const x2 = center + r * Math.cos(endA);
              const y2 = center + r * Math.sin(endA);
              const large = stats.rate > 0.5 ? 1 : 0;
              const d = stats.rate >= 1
                ? `M ${center},${center} m 0,${-r} a ${r},${r} 0 1,1 0,${2*r} a ${r},${r} 0 1,1 0,${-2*r} Z`
                : `M ${center},${center} L ${x1},${y1} A ${r},${r} 0 ${large},1 ${x2},${y2} Z`;
              return <path d={d} fill="#E8C4B0" opacity={0.25} />;
            })()}

            {/* 表盘外圈 */}
            <circle
              cx={center} cy={center} r={progressRadius}
              fill="none"
              stroke="#C4B5A0"
              strokeWidth={3.5}
              opacity={0.5}
            />

            {/* 进度弧 */}
            {stats.rate > 0 && (
              <motion.circle
                cx={center} cy={center} r={progressRadius}
                fill="none"
                strokeWidth={5}
                strokeLinecap="round"
                stroke="url(#monthRingGrad)"
                style={{
                  strokeDasharray: circumference,
                  transformOrigin: `${center}px ${center}px`,
                  transform: 'rotate(-90deg)',
                }}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: progressOffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            )}

            {/* 罗马数字刻度 */}
            {['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].map((num, i) => {
              const a = -Math.PI / 2 + (2 * Math.PI / 12) * i;
              const textR = progressRadius - 16;
              const tx = center + Math.cos(a) * textR;
              const ty = center + Math.sin(a) * textR;
              return (
                <text
                  key={num}
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12}
                  fontFamily="'Times New Roman', Georgia, serif"
                  fontWeight={700}
                  fill="#8B7B68"
                  opacity={0.8}
                >
                  {num}
                </text>
              );
            })}

            {/* 小时刻度线 */}
            {Array.from({ length: 12 }).map((_, i) => {
              const a = -Math.PI / 2 + (2 * Math.PI / 12) * i;
              const r1 = progressRadius - 2;
              const r2 = progressRadius - 6;
              return (
                <line
                  key={`tick-${i}`}
                  x1={center + Math.cos(a) * r1}
                  y1={center + Math.sin(a) * r1}
                  x2={center + Math.cos(a) * r2}
                  y2={center + Math.sin(a) * r2}
                  stroke="#8B7B68"
                  strokeWidth={1.5}
                  opacity={0.5}
                />
              );
            })}
          </g>

          {/* Layer 2: 花环 — 水滴叶径向朝外，叶脉垂直于圆环，适度层叠 */}
          <g>
            {wreathLeafArray.length > 0 && wreathLeafArray.map(({ leaf, origIdx, wreathIdx }) => {
              const seed = wreathIdx * 137 + origIdx * 31 + 42;
              const n = WREATH_LEAF_COUNT;
              const angle = -Math.PI / 2 + (2 * Math.PI / n) * wreathIdx;

              const isDone = leaf.status === 'done';
              const colors = categoryLeafColors[leaf.category] || categoryLeafColors.custom;
              const fillColor = isDone ? colors.fill : colors.fillDim;
              const strokeColor = isDone ? colors.stroke : colors.strokeDim;

              // 叶片尺寸：适中，16-22px高，宽=高*0.7
              const h = 16 + seededRandom(seed + 4) * 6; // 16~22px
              const w = h * 0.7;

              // 叶形：尖端(0,0)朝外，底部(0,h)最宽最圆润
              // 用更大的控制点让底部鼓出去，形成饱满的水滴/卵叶
              const leafPath = [
                `M 0,0`,  // 尖端
                `C ${w * 0.2},${h * 0.08} ${w * 0.5},${h * 0.3} ${w * 0.6},${h * 0.55}`, // 右侧：逐渐展开
                `C ${w * 0.68},${h * 0.75} ${w * 0.6},${h * 0.95} 0,${h * 1.02}`, // 右侧：鼓到最宽后圆润收底
                `C ${-w * 0.6},${h * 0.95} ${-w * 0.68},${h * 0.75} ${-w * 0.6},${h * 0.55}`, // 左侧：底部大圆弧
                `C ${-w * 0.5},${h * 0.3} ${-w * 0.2},${h * 0.08} 0,0`, // 左侧：收回尖端
                `Z`
              ].join(' ');

              // 锚点：叶片中心在 wreathRadius 上，±8px 径向偏移产生层叠厚度
              const radialOffset = (seededRandom(seed + 1) - 0.5) * 16;
              const anchorR = wreathRadius + radialOffset;
              const lx = center + Math.cos(angle) * anchorR;
              const ly = center + Math.sin(angle) * anchorR;

              // 旋转：径向朝外（叶脉中线垂直于圆环）+ 微小随机倾斜 ±12°
              const angleDeg = angle * 180 / Math.PI + 90; // 尖端指向圆外
              const tiltJitter = (seededRandom(seed + 5) - 0.5) * 24; // ±12°
              const rot = angleDeg + tiltJitter;

              const leafOpacity = isDone ? 0.92 : 0.38;

              // 短茎线长度
              const stemLen = 3 + seededRandom(seed + 8) * 2;

              return (
                <g key={`wreath-${wreathIdx}`}>
                  {/* 短茎线：从叶片底部(圆弧端)向圆心方向延伸 */}
                  <line
                    x1={lx + Math.cos(angle + Math.PI) * (h * 0.5)}
                    y1={ly + Math.sin(angle + Math.PI) * (h * 0.5)}
                    x2={lx + Math.cos(angle + Math.PI) * (h * 0.5 + stemLen)}
                    y2={ly + Math.sin(angle + Math.PI) * (h * 0.5 + stemLen)}
                    stroke={strokeColor}
                    strokeWidth={0.8}
                    strokeLinecap="round"
                    opacity={leafOpacity * 0.7}
                  />
                  {/* 水滴叶片 */}
                  <path
                    d={leafPath}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={0.5}
                    opacity={leafOpacity}
                    transform={`translate(${lx}, ${ly}) rotate(${rot}) translate(0, ${-h / 2})`}
                  />
                  {/* 叶脉：简单Y形，垂直于圆环 */}
                  <g
                    transform={`translate(${lx}, ${ly}) rotate(${rot}) translate(0, ${-h / 2})`}
                    opacity={leafOpacity * 0.5}
                  >
                    {/* 中脉 */}
                    <line x1={0} y1={h * 0.15} x2={0} y2={h * 0.8}
                      stroke="rgba(255,255,255,0.6)" strokeWidth={0.4} strokeLinecap="round" />
                    {/* 侧脉 */}
                    <line x1={0} y1={h * 0.4} x2={w * 0.3} y2={h * 0.25}
                      stroke="rgba(255,255,255,0.45)" strokeWidth={0.3} strokeLinecap="round" />
                    <line x1={0} y1={h * 0.4} x2={-w * 0.3} y2={h * 0.25}
                      stroke="rgba(255,255,255,0.45)" strokeWidth={0.3} strokeLinecap="round" />
                    <line x1={0} y1={h * 0.6} x2={w * 0.25} y2={h * 0.45}
                      stroke="rgba(255,255,255,0.35)" strokeWidth={0.3} strokeLinecap="round" />
                    <line x1={0} y1={h * 0.6} x2={-w * 0.25} y2={h * 0.45}
                      stroke="rgba(255,255,255,0.35)" strokeWidth={0.3} strokeLinecap="round" />
                  </g>
                </g>
              );
            })}

            {/* 花朵 — 在花环上 */}
            {flowerCount > 0 && flowers.map((flower, i) => {
              const seed = i * 173 + 99;
              const angle = -Math.PI / 2 + (2 * Math.PI / Math.max(flowerCount, 1)) * i + 0.3;
              const tinyOffset = (seededRandom(seed + 1) - 0.5) * 4;
              const dist = leafRadius + tinyOffset;
              const fx = center + Math.cos(angle) * dist;
              const fy = center + Math.sin(angle) * dist;

              const colors = categoryLeafColors[flower.category] || categoryLeafColors.custom;
              const nPetals = Math.max(flower.totalPetals, 3);
              const nDone = flower.donePetals;
              const fSize = flowerCount <= 3 ? 18 : flowerCount <= 6 ? 15 : flowerCount <= 10 ? 12 : 9;

              return (
                <motion.g
                  key={flower.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.5, ease: 'backOut' }}
                  style={{ transformOrigin: `${fx}px ${fy}px` }}
                >
                  {Array.from({ length: nPetals }).map((_, pi) => {
                    const pAngle = (360 / nPetals) * pi;
                    const isDone = pi < nDone;
                    const petalCat = flower.categories[pi % flower.categories.length];
                    const petalColors = categoryLeafColors[petalCat] || categoryLeafColors.custom;
                    const px = fx + Math.cos((pAngle - 90) * Math.PI / 180) * fSize * 0.55;
                    const py = fy + Math.sin((pAngle - 90) * Math.PI / 180) * fSize * 0.55;
                    return (
                      <ellipse
                        key={pi}
                        cx={px} cy={py}
                        rx={fSize * 0.35} ry={fSize * 0.6}
                        fill={isDone ? petalColors.fill : petalColors.fillDim}
                        stroke={isDone ? petalColors.stroke : petalColors.strokeDim}
                        strokeWidth={0.5}
                        opacity={isDone ? 0.9 : 0.35}
                        transform={`rotate(${pAngle}, ${px}, ${py})`}
                      />
                    );
                  })}
                  <circle cx={fx} cy={fy} r={fSize * 0.22} fill={colors.stroke} />
                  <circle cx={fx - fSize * 0.04} cy={fy - fSize * 0.04} r={fSize * 0.08} fill="rgba(255,255,255,0.5)" />
                </motion.g>
              );
            })}
          </g>
        </svg>

        {/* Layer 4: 中心文字 */}
        <div style={{
          position: 'absolute',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: 30,
            lineHeight: 1.1,
            fontWeight: 800,
            color: 'var(--cb-color-primary-dark)',
          }}>
            {Math.round(stats.rate * 100)}%
          </span>
          <span style={{
            fontSize: 12,
            lineHeight: 1.4,
            color: 'var(--cb-color-primary-medium)',
            marginTop: 2,
          }}>
            {stats.completed}/{stats.total} 已完成
          </span>
        </div>
      </div>

      {/* 图例 — 文字版 */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3 px-4">
        {(() => {
          const entries = sortedCategoryEntries(stats.byCategory);
          // 把"其他"(custom)从排序结果中拆出来，在灵感前面插入
          const customEntry = entries.find(([k]) => k === 'custom');
          const nonCustomEntries = entries.filter(([k]) => k !== 'custom');

          // 渲染：非其他分类 → 灵感数 → 其他
          const items: React.ReactNode[] = [];

          nonCustomEntries.forEach(([key, val]) => {
            const colors = categoryLeafColors[key as CompoundCategory] || categoryLeafColors.custom;
            const info = categoryInfo[key as CompoundCategory] || { label: key, icon: '📌', color: 'text-stone-500' };
            items.push(
              <span key={key} className="text-xs">
                <span className="font-medium" style={{ color: colors.fill }}>{info.label}</span>
                <span style={{ color: 'var(--cb-color-primary-medium)' }}> {val.done}/{val.total}</span>
              </span>
            );
          });

          // 灵感数（花朵）
          if (flowerCount > 0) {
            items.push(
              <span key="ideas" className="text-xs">
                <span className="font-medium" style={{ color: '#E8B4B8' }}>灵感</span>
                <span style={{ color: 'var(--cb-color-primary-medium)' }}> {totalDonePetals}/{flowers.reduce((s, f) => s + f.totalPetals, 0)}</span>
              </span>
            );
          }

          // 其他
          if (customEntry) {
            const [key, val] = customEntry;
            const colors = categoryLeafColors[key as CompoundCategory] || categoryLeafColors.custom;
            const info = categoryInfo[key as CompoundCategory] || { label: key, icon: '📌', color: 'text-stone-500' };
            items.push(
              <span key={key} className="text-xs">
                <span className="font-medium" style={{ color: colors.fill }}>{info.label}</span>
                <span style={{ color: 'var(--cb-color-primary-medium)' }}> {val.done}/{val.total}</span>
              </span>
            );
          }

          return items;
        })()}
      </div>

      {/* 分享按钮（月底时显示） */}
      {currentDay === daysInMonth && onShare && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onShare}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{ background: 'var(--cb-color-primary-dark)', boxShadow: '0 4px 12px rgba(109,76,51,0.2)' }}
        >
          <Share2 className="w-4 h-4" />
          分享本月成就
        </motion.button>
      )}
    </div>
  );
}
