import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { CompoundCategory, ReminderStatus } from '@/types/reminder';
import { useReminderStore } from '../stores/reminderStore';
import { categoryLeafColors, categoryInfo } from '../constants/messages';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface MonthlyShareCardProps {
  open: boolean;
  onClose: () => void;
}

interface MonthlyLeaf {
  date: string;
  reminderId: string;
  category: CompoundCategory;
  status: ReminderStatus | 'pending';
}

export default function MonthlyShareCard({ open, onClose }: MonthlyShareCardProps) {
  const { getMonthlyDetailedLogs, reminders, isInitialized } = useReminderStore();
  const [leaves, setLeaves] = useState<MonthlyLeaf[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  useEffect(() => {
    if (!open || !isInitialized) return;
    getMonthlyDetailedLogs(year, month).then(setLeaves);
  }, [open, isInitialized, year, month]);

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

    // 按日统计
    const byDate: Record<string, { total: number; done: number }> = {};
    leaves.forEach(l => {
      if (!byDate[l.date]) byDate[l.date] = { total: 0, done: 0 };
      byDate[l.date].total++;
      if (l.status === 'done') byDate[l.date].done++;
    });

    const perfectDays = Object.values(byDate).filter(d => d.total > 0 && d.done === d.total).length;
    const activeDays = Object.keys(byDate).length;

    return { total, completed, rate, byCategory, perfectDays, activeDays };
  }, [leaves]);

  // 生成小结
  const summary = useMemo(() => {
    const parts: string[] = [];
    if (stats.rate >= 0.9) parts.push('本月表现极佳！几乎完美完成所有习惯。');
    else if (stats.rate >= 0.7) parts.push('本月完成度很好，继续保持！');
    else if (stats.rate >= 0.5) parts.push('完成了一半以上，每一步都有意义。');
    else parts.push('起步的月份，坚持就是胜利。');

    if (stats.perfectDays > 0) {
      parts.push(`有${stats.perfectDays}天完美完成所有习惯。`);
    }

    // 找表现最好的分类
    let bestCat = '';
    let bestRate = 0;
    Object.entries(stats.byCategory).forEach(([cat, val]) => {
      const r = val.total > 0 ? val.done / val.total : 0;
      if (r > bestRate) { bestRate = r; bestCat = cat; }
    });
    if (bestCat) {
      const info = categoryInfo[bestCat as CompoundCategory];
      parts.push(`${info.icon} ${info.label}完成率最高(${Math.round(bestRate * 100)}%)。`);
    }

    return parts.join(' ');
  }, [stats]);

  const monthName = `${year}年${month + 1}月`;

  // 环参数（分享卡内缩小）
  const size = 150;
  const pad = 24;
  const svgSize = size + pad * 2;
  const ctr = svgSize / 2;
  const ringR = size / 2 - 10;
  const vineR = ringR + 6;
  const circ = 2 * Math.PI * ringR;
  const pOff = circ * (1 - stats.rate);
  const leafCount = leaves.length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-3xl border-0">
        <div
          ref={cardRef}
          className="p-6"
          style={{
            background: 'linear-gradient(180deg, #FFF3E6 0%, #FFDECC 40%, #F5C9A8 100%)',
            fontFamily: 'var(--cb-font-family)',
            color: 'var(--cb-color-primary-dark)',
          }}
        >
          {/* 标题 */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">{monthName} 复利报告</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--cb-color-primary-medium)' }}>
              Iris Daily Reminder
            </p>
          </div>

          {/* 迷你叶子环 */}
          <div className="flex justify-center">
            <div className="cb-progress-ring-container" style={{ width: svgSize, height: svgSize }}>
              <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="shareRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A8C298" />
                    <stop offset="100%" stopColor="#88B070" />
                  </linearGradient>
                </defs>
                <circle cx={ctr} cy={ctr} r={ringR} fill="none" stroke="rgba(168,194,152,0.12)" strokeWidth={6} />
                <circle
                  cx={ctr} cy={ctr} r={ringR}
                  fill="none" strokeWidth={6} strokeLinecap="round"
                  stroke="url(#shareRingGrad)"
                  style={{
                    strokeDasharray: circ,
                    strokeDashoffset: pOff,
                    transformOrigin: `${ctr}px ${ctr}px`,
                    transform: 'rotate(-90deg)',
                  }}
                />
                {leafCount > 0 && leaves.map((leaf, i) => {
                  const angle = -Math.PI / 2 + (2 * Math.PI / leafCount) * i;
                  const lx = ctr + Math.cos(angle) * vineR;
                  const ly = ctr + Math.sin(angle) * vineR;
                  const rotDeg = (angle * 180) / Math.PI + 90;
                  const tilt = i % 2 === 0 ? -28 : 28;
                  const isDone = leaf.status === 'done';
                  const colors = categoryLeafColors[leaf.category];
                  const baseSize = leafCount <= 10 ? 1.0 : leafCount <= 30 ? 0.7 : leafCount <= 60 ? 0.5 : 0.35;
                  return (
                    <g
                      key={`${leaf.date}-${leaf.reminderId}`}
                      transform={`translate(${lx}, ${ly}) rotate(${rotDeg + tilt}) scale(${isDone ? baseSize : baseSize * 0.75}) translate(-11, -18)`}
                      opacity={isDone ? 1 : 0.5}
                    >
                      <path
                        d="M11 2 C5 5.5, 1.5 11, 4 15.5 C6 19, 9 20, 11 20 C13 20, 16 19, 18 15.5 C20.5 11, 17 5.5, 11 2Z"
                        fill={isDone ? colors.fill : colors.fillDim}
                        stroke={isDone ? colors.stroke : colors.strokeDim}
                        strokeWidth="0.8"
                      />
                    </g>
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold">{Math.round(stats.rate * 100)}%</span>
                <span className="text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>
                  {stats.completed}/{stats.total}
                </span>
              </div>
            </div>
          </div>

          {/* 分类统计 */}
          <div className="mt-4 space-y-2">
            {Object.entries(stats.byCategory).map(([key, val]) => {
              const cat = key as CompoundCategory;
              const colors = categoryLeafColors[cat];
              const info = categoryInfo[cat];
              const rate = val.total > 0 ? val.done / val.total : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.fill }}
                  />
                  <span className="text-sm font-medium flex-1">{info.icon} {info.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(109,76,51,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${rate * 100}%`, backgroundColor: colors.fill }}
                    />
                  </div>
                  <span className="text-xs font-medium w-16 text-right" style={{ color: 'var(--cb-color-primary-medium)' }}>
                    {val.done}/{val.total}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 关键数据 */}
          <div className="flex justify-around mt-4 pt-3 border-t" style={{ borderColor: 'rgba(109,76,51,0.08)' }}>
            <div className="text-center">
              <div className="text-lg font-bold">{stats.activeDays}</div>
              <div className="text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>活跃天数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{stats.perfectDays}</div>
              <div className="text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>完美天数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{stats.completed}</div>
              <div className="text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>完成习惯</div>
            </div>
          </div>

          {/* 小结 */}
          <div
            className="mt-4 p-3 rounded-2xl text-sm leading-relaxed"
            style={{ background: 'rgba(255,250,245,0.7)', color: 'var(--cb-color-primary-dark)' }}
          >
            {summary}
          </div>

          {/* 底部签名 */}
          <div className="text-center mt-4">
            <p className="text-xs italic" style={{ color: 'var(--cb-color-primary-medium)' }}>
              "Small daily actions compound into life-changing results."
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
