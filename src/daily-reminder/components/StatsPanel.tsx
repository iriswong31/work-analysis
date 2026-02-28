import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Flame, Clock, Target, Pencil, Check, Lightbulb, X } from 'lucide-react';
import { useReminderStore } from '../stores/reminderStore';
import { useIdeaStore } from '../stores/ideaStore';
import { categoryInfo, categoryLeafColors } from '../constants/messages';
import { CompoundCategory, DailyStats, ReminderStatus, MonthlySummary } from '@/types/reminder';
import { reminderDb } from '../utils/db';
import ProgressRing from './ProgressRing';

const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

interface MonthlyLeaf {
  date: string;
  reminderId: string;
  category: CompoundCategory;
  status: ReminderStatus | 'pending';
}

interface StatsPanelProps {
  section?: 'download' | 'extra';
}

export default function StatsPanel({ section }: StatsPanelProps) {
  const { getTodayStats, getStreak, getWeeklyStats, getMonthlyCompletion, getMonthlyDetailedLogs, isInitialized } =
    useReminderStore();
  const { ideas, loadIdeas } = useIdeaStore();
  const [streak, setStreak] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<Record<string, number>>({});
  const [monthlyLeaves, setMonthlyLeaves] = useState<MonthlyLeaf[]>([]);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const todayStats = getTodayStats();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  useEffect(() => {
    getStreak().then(setStreak);
    getWeeklyStats().then(setWeeklyStats);
    getMonthlyCompletion().then(setMonthlyData);
    loadIdeas();
    if (isInitialized) {
      getMonthlyDetailedLogs(year, month).then(setMonthlyLeaves);
    }
  }, [getStreak, getWeeklyStats, getMonthlyCompletion, getMonthlyDetailedLogs, isInitialized, year, month, loadIdeas]);

  // 加载月度总结
  useEffect(() => {
    reminderDb.monthlySummaries
      .where({ year, month })
      .toArray()
      .then((items) => {
        const map: Record<string, string> = {};
        items.forEach((item) => {
          map[item.category] = item.content;
        });
        setSummaries(map);
      });
  }, [year, month]);

  const saveSummary = useCallback(async (cat: string) => {
    const id = `${year}-${String(month + 1).padStart(2, '0')}-${cat}`;
    const content = editText.trim();
    if (content) {
      await reminderDb.monthlySummaries.put({
        id,
        year,
        month,
        category: cat as CompoundCategory,
        content,
        updatedAt: new Date(),
      });
      setSummaries((prev) => ({ ...prev, [cat]: content }));
    } else {
      await reminderDb.monthlySummaries.delete(id);
      setSummaries((prev) => {
        const next = { ...prev };
        delete next[cat];
        return next;
      });
    }
    setEditingCategory(null);
    setEditText('');
  }, [editText, year, month]);

  const startEdit = useCallback((cat: string) => {
    setEditingCategory(cat);
    setEditText(summaries[cat] || '');
  }, [summaries]);

  // 按复利分类统计
  const categoryStats = useMemo(() => {
    const result: Record<string, { total: number; done: number; category: CompoundCategory }> = {};
    monthlyLeaves.forEach(l => {
      if (!result[l.category]) {
        result[l.category] = { total: 0, done: 0, category: l.category };
      }
      result[l.category].total++;
      if (l.status === 'done') result[l.category].done++;
    });
    return result;
  }, [monthlyLeaves]);

  // 灵感池统计
  const ideaStats = useMemo(() => {
    const thisMonthIdeas = ideas.filter(i => {
      const d = new Date(i.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const totalIdeas = thisMonthIdeas.length;
    const doneIdeas = thisMonthIdeas.filter(i => i.status === 'done').length;
    const totalSubTasks = thisMonthIdeas.reduce((s, i) => s + i.subTasks.length, 0);
    const doneSubTasks = thisMonthIdeas.reduce((s, i) => s + i.subTasks.filter(st => st.done).length, 0);
    const convertedToReminder = thisMonthIdeas.reduce((s, i) => s + i.subTasks.filter(st => st.reminderId).length, 0);

    // 按分类分组（支持多分类，一个灵感可能归属多个分类）
    const byCategory: Record<string, { ideas: number; done: number; subTotal: number; subDone: number }> = {};
    thisMonthIdeas.forEach(idea => {
      const cats = (idea.categories && idea.categories.length > 0) ? idea.categories : (idea.category ? [idea.category] : ['custom']);
      cats.forEach(cat => {
        if (!byCategory[cat]) {
          byCategory[cat] = { ideas: 0, done: 0, subTotal: 0, subDone: 0 };
        }
        byCategory[cat].ideas++;
        if (idea.status === 'done') byCategory[cat].done++;
        byCategory[cat].subTotal += idea.subTasks.length;
        byCategory[cat].subDone += idea.subTasks.filter(st => st.done).length;
      });
    });

    return { totalIdeas, doneIdeas, totalSubTasks, doneSubTasks, convertedToReminder, byCategory, thisMonthIdeas };
  }, [ideas, year, month]);

  const chartData = weeklyStats.map((s) => {
    const date = new Date(s.date);
    return {
      name: dayLabels[date.getDay()],
      完成: s.completed,
      总数: s.total,
      rate: Math.round(s.completionRate * 100),
    };
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  return (
    <div className="space-y-5">
      {/* download 区域：概览卡片 + 复利分类统计 */}
      {(!section || section === 'download') && (
        <>
          {/* 概览卡片 */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Target className="w-5 h-5" style={{ color: '#D49A85' }} />}
              label="今日完成"
              value={`${todayStats.completed}/${todayStats.total}`}
              sub={todayStats.total > 0 ? `${Math.round(todayStats.completionRate * 100)}%` : '—'}
            />
            <StatCard
              icon={<Flame className="w-5 h-5" style={{ color: '#D49A85' }} />}
              label="连续天数"
              value={`${streak}`}
              sub={streak > 0 ? '天' : '开始吧'}
            />
            <StatCard
              icon={<Clock className="w-5 h-5" style={{ color: '#A8C298' }} />}
              label="今日专注"
              value={`${todayStats.focusMinutes}`}
              sub="分钟"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" style={{ color: '#A8C298' }} />}
              label="本周均值"
              value={
                weeklyStats.length > 0
                  ? `${Math.round(
                      (weeklyStats.reduce((s, d) => s + d.completionRate, 0) /
                        weeklyStats.length) *
                        100
                    )}%`
                  : '—'
              }
              sub="完成率"
            />
          </div>

          {/* 复利分类统计 */}
          <div>
            <div className="cb-glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: 'var(--cb-color-primary-dark)' }}>
                  {month + 1}月复利统计
                </h3>
              </div>

              {Object.keys(categoryStats).length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--cb-color-primary-medium)' }}>
                  暂无本月数据
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(categoryStats)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .map(([key, val]) => {
                      const cat = key as CompoundCategory;
                      const colors = categoryLeafColors[cat] || categoryLeafColors.custom;
                      const info = categoryInfo[cat] || { label: key, icon: '📌', color: 'text-stone-500' };
                      const rate = val.total > 0 ? val.done / val.total : 0;
                      return (
                        <div key={key}>
                          {/* 分类名 + 进度条 + 数据 同一行 */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium flex-shrink-0" style={{ color: colors.fill, width: '4.5em' }}>
                              {info.label}
                            </span>
                            <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(109,76,51,0.06)', flex: '1 1 0', minWidth: 20 }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: colors.fill }}
                                initial={{ width: 0 }}
                                animate={{ width: `${rate * 100}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                              />
                            </div>
                            <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--cb-color-primary-medium)' }}>
                              {val.done}/{val.total} · {Math.round(rate * 100)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {/* 汇总 */}
                  <div className="flex justify-around pt-3 mt-2 border-t" style={{ borderColor: 'rgba(109,76,51,0.08)' }}>
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: 'var(--cb-color-primary-dark)' }}>
                        {monthlyLeaves.filter(l => l.status === 'done').length}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>已完成</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: 'var(--cb-color-primary-dark)' }}>
                        {monthlyLeaves.length}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>总计</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: 'var(--cb-color-primary-dark)' }}>
                        {monthlyLeaves.length > 0 ? Math.round(monthlyLeaves.filter(l => l.status === 'done').length / monthlyLeaves.length * 100) : 0}%
                      </div>
                      <div className="text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>完成率</div>
                    </div>
                  </div>

                  {/* 复利统计备注 */}
                  {editingCategory === '_compound_note' ? (
                    <div className="pt-3 mt-2 border-t" style={{ borderColor: 'rgba(109,76,51,0.08)' }}>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="写一写本月复利总结..."
                        className="w-full text-sm bg-transparent border border-gray-200 rounded-lg p-2.5 outline-none resize-none"
                        style={{ color: 'var(--cb-color-primary-dark)' }}
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveSummary('_compound_note')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6D4C33] text-white active:scale-[0.98]"
                        >
                          <Check className="w-3 h-3" /> 保存
                        </button>
                        <button
                          onClick={() => { setEditingCategory(null); setEditText(''); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100"
                          style={{ color: 'var(--cb-color-primary-dark)' }}
                        >
                          <X className="w-3 h-3" /> 取消
                        </button>
                      </div>
                    </div>
                  ) : summaries['_compound_note'] ? (
                    <div
                      className="pt-3 mt-2 border-t cursor-pointer group"
                      style={{ borderColor: 'rgba(109,76,51,0.08)' }}
                      onClick={() => startEdit('_compound_note')}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--cb-color-primary-dark)' }}>
                        {summaries['_compound_note']}
                      </p>
                      <Pencil className="w-3 h-3 text-gray-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit('_compound_note')}
                      className="w-full pt-3 mt-2 border-t text-xs text-center transition-colors"
                      style={{ borderColor: 'rgba(109,76,51,0.08)', color: 'var(--cb-color-primary-medium)' }}
                    >
                      <Pencil className="w-3 h-3 inline mr-1" />
                      添加本月总结
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 灵感池统计 */}
          {ideaStats.totalIdeas > 0 && (
            <div className="cb-glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4" style={{ color: '#D49A85' }} />
                <h3 className="font-semibold" style={{ color: 'var(--cb-color-primary-dark)' }}>
                  {month + 1}月灵感池
                </h3>
              </div>

              {/* 灵感完成数 + 任务完成数 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(109,76,51,0.04)' }}>
                  <div className="text-lg font-bold" style={{ color: 'var(--cb-color-primary-dark)' }}>
                    {ideaStats.doneIdeas}/{ideaStats.totalIdeas}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--cb-color-primary-medium)' }}>灵感完成</div>
                </div>
                <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(212,154,133,0.08)' }}>
                  <div className="text-lg font-bold" style={{ color: '#D49A85' }}>
                    {ideaStats.doneSubTasks}/{ideaStats.totalSubTasks}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--cb-color-primary-medium)' }}>任务完成</div>
                </div>
              </div>

              {/* 灵感列表：灵感名 + 固定宽度进度条 + 数据 */}
              <div className="space-y-2.5">
                {ideaStats.thisMonthIdeas.map(idea => {
                  const cats = (idea.categories && idea.categories.length > 0) ? idea.categories : (idea.category ? [idea.category] : ['custom'] as CompoundCategory[]);
                  const colors = categoryLeafColors[cats[0]] || categoryLeafColors.custom;
                  const subDone = idea.subTasks.filter(st => st.done).length;
                  const subTotal = idea.subTasks.length;
                  const rate = subTotal > 0 ? subDone / subTotal : 0;
                  return (
                    <div key={idea.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--cb-color-primary-dark)' }}>
                        {idea.title}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(109,76,51,0.06)', width: 80 }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: colors.fill }}
                            initial={{ width: 0 }}
                            animate={{ width: `${rate * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-[11px] w-7 text-right flex-shrink-0" style={{ color: 'var(--cb-color-primary-medium)' }}>
                          {subDone}/{subTotal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 灵感池备注 */}
              {editingCategory === '_idea_note' ? (
                <div className="pt-3 mt-3 border-t" style={{ borderColor: 'rgba(109,76,51,0.08)' }}>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="写一写灵感池的总结..."
                    className="w-full text-sm bg-transparent border border-gray-200 rounded-lg p-2.5 outline-none resize-none"
                    style={{ color: 'var(--cb-color-primary-dark)' }}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => saveSummary('_idea_note')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6D4C33] text-white active:scale-[0.98]"
                    >
                      <Check className="w-3 h-3" /> 保存
                    </button>
                    <button
                      onClick={() => { setEditingCategory(null); setEditText(''); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100"
                      style={{ color: 'var(--cb-color-primary-dark)' }}
                    >
                      <X className="w-3 h-3" /> 取消
                    </button>
                  </div>
                </div>
              ) : summaries['_idea_note'] ? (
                <div
                  className="pt-3 mt-3 border-t cursor-pointer group"
                  style={{ borderColor: 'rgba(109,76,51,0.08)' }}
                  onClick={() => startEdit('_idea_note')}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--cb-color-primary-dark)' }}>
                    {summaries['_idea_note']}
                  </p>
                  <Pencil className="w-3 h-3 text-gray-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <button
                  onClick={() => startEdit('_idea_note')}
                  className="w-full pt-3 mt-3 border-t text-xs text-center transition-colors"
                  style={{ borderColor: 'rgba(109,76,51,0.08)', color: 'var(--cb-color-primary-medium)' }}
                >
                  <Pencil className="w-3 h-3 inline mr-1" />
                  添加灵感总结
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* extra 区域：今日进度 + 周趋势 + 热力图 */}
      {(!section || section === 'extra') && (
        <>
          {/* 今日进度 */}
          <div className="cb-glass-card p-5 flex items-center gap-6">
        <ProgressRing progress={todayStats.completionRate} size={90} strokeWidth={5}>
          <div className="text-center">
            <span className="text-xl font-bold" style={{ color: 'var(--cb-color-primary-dark)' }}>
              {Math.round(todayStats.completionRate * 100)}
            </span>
            <span className="text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>%</span>
          </div>
        </ProgressRing>
        <div className="flex-1">
          <h3 className="font-semibold mb-2" style={{ color: 'var(--cb-color-primary-dark)' }}>今日进度</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#A8C298' }} />
              <span style={{ color: 'var(--cb-color-primary-medium)' }}>已完成 {todayStats.completed} 项</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span style={{ color: 'var(--cb-color-primary-medium)' }}>
                待完成 {todayStats.total - todayStats.completed - todayStats.skipped} 项
              </span>
            </div>
            {todayStats.skipped > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#D49A85' }} />
                <span style={{ color: 'var(--cb-color-primary-medium)' }}>已跳过 {todayStats.skipped} 项</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 周趋势图 */}
      <div className="cb-glass-card p-5">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--cb-color-primary-dark)' }}>本周趋势</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(109,76,51,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8F6E53' }} />
              <YAxis tick={{ fontSize: 12, fill: '#8F6E53' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(109,76,51,0.1)',
                  fontSize: 13,
                  background: 'rgba(255,250,245,0.95)',
                  color: '#6D4C33',
                }}
              />
              <Bar dataKey="完成" fill="#A8C298" radius={[6, 6, 0, 0]} />
              <Bar dataKey="总数" fill="rgba(109,76,51,0.1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 月度热力图 */}
      <div className="cb-glass-card p-5">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--cb-color-primary-dark)' }}>
          {month + 1}月完成热力图
        </h3>
        <div className="grid grid-cols-7 gap-1.5">
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <div key={d} className="text-center text-xs pb-1" style={{ color: 'var(--cb-color-primary-medium)' }}>
              {d}
            </div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const rate = monthlyData[dateStr];
            const isToday = day === now.getDate();

            let bg = 'rgba(109,76,51,0.06)';
            let textColor = 'var(--cb-color-primary-medium)';
            if (rate !== undefined) {
              if (rate >= 0.8) { bg = '#A8C298'; textColor = '#fff'; }
              else if (rate >= 0.5) { bg = '#C6D9B8'; textColor = '#fff'; }
              else if (rate > 0) { bg = '#DDE9D4'; textColor = '#6D4C33'; }
              else { bg = 'rgba(212,154,133,0.2)'; }
            }

            return (
              <motion.div
                key={day}
                className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium"
                style={{
                  background: bg,
                  color: textColor,
                  border: isToday ? '2px solid #A8C298' : 'none',
                }}
                whileHover={{ scale: 1.1 }}
                title={rate !== undefined ? `${Math.round(rate * 100)}% 完成` : '无数据'}
              >
                {day}
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 justify-end text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>
          <span>少</span>
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(109,76,51,0.06)' }} />
          <div className="w-3 h-3 rounded" style={{ background: '#DDE9D4' }} />
          <div className="w-3 h-3 rounded" style={{ background: '#C6D9B8' }} />
          <div className="w-3 h-3 rounded" style={{ background: '#A8C298' }} />
          <span>多</span>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="cb-glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color: 'var(--cb-color-primary-dark)' }}>{value}</span>
        <span className="text-xs" style={{ color: 'var(--cb-color-primary-medium)' }}>{sub}</span>
      </div>
    </div>
  );
}
