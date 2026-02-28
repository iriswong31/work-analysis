import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Reminder, ReminderLog } from '@/types/reminder';
import { useReminderStore } from '../stores/reminderStore';
import { reminderDb } from '../utils/db';
import { cn } from '@/lib/utils';
import ReminderCard from './ReminderCard';

const weekDayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

interface TimelineViewProps {
  reminders: Reminder[];
  logs: ReminderLog[];
  onEdit: (reminder: Reminder) => void;
  onFocus?: (reminder: Reminder) => void;
}

export default function TimelineView({ reminders, logs, onEdit, onFocus }: TimelineViewProps) {
  const { markReminder } = useReminderStore();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay();
  const dateOfMonth = now.getDate();

  // 本周完成次数 (for weekly_times reminders)
  const [weeklyDoneCounts, setWeeklyDoneCounts] = useState<Record<string, number>>({});

  // 计算本周的日期范围 (周一到周日)
  const getWeekDates = useCallback(() => {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return dates;
  }, []);

  // 加载本周每个 weekly_times 提醒的完成次数
  const weeklyTimesReminders = useMemo(() => {
    return reminders.filter((r) => r.enabled && r.repeat === 'weekly_times');
  }, [reminders]);

  // 加载本月每个 monthly_times 提醒的完成次数
  const monthlyTimesReminders = useMemo(() => {
    return reminders.filter((r) => r.enabled && r.repeat === 'monthly_times');
  }, [reminders]);

  const [monthlyDoneCounts, setMonthlyDoneCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (weeklyTimesReminders.length === 0) return;
    const weekDates = getWeekDates();
    
    Promise.all(
      weeklyTimesReminders.map(async (r) => {
        const weekLogs = await reminderDb.reminderLogs
          .where('[reminderId+date]')
          .between([r.id, weekDates[0]], [r.id, weekDates[6] + '\uffff'])
          .toArray();
        const doneCount = weekLogs.filter((l) => l.status === 'done').length;
        return { id: r.id, count: doneCount };
      })
    ).then((results) => {
      const counts: Record<string, number> = {};
      results.forEach((r) => { counts[r.id] = r.count; });
      setWeeklyDoneCounts(counts);
    });
  }, [weeklyTimesReminders, getWeekDates, logs]); // logs changes trigger refresh

  // 加载本月每个 monthly_times 提醒的完成次数
  useEffect(() => {
    if (monthlyTimesReminders.length === 0) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-31`;

    Promise.all(
      monthlyTimesReminders.map(async (r) => {
        const monthLogs = await reminderDb.reminderLogs
          .where('[reminderId+date]')
          .between([r.id, firstDay], [r.id, lastDay + '\uffff'])
          .toArray();
        const doneCount = monthLogs.filter((l) => l.status === 'done').length;
        return { id: r.id, count: doneCount };
      })
    ).then((results) => {
      const counts: Record<string, number> = {};
      results.forEach((r) => { counts[r.id] = r.count; });
      setMonthlyDoneCounts(counts);
    });
  }, [monthlyTimesReminders, logs]);

  // 处理 weekly_times 的打勾/取消
  const handleWeeklyTimesToggle = useCallback(async (reminder: Reminder, slotIndex: number) => {
    const currentCount = weeklyDoneCounts[reminder.id] || 0;
    const target = reminder.weeklyTimesTarget || 3;
    
    if (slotIndex < currentCount) {
      // 取消：把今天的 done 标记为 pending（如果今天有的话）
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const todayLog = await reminderDb.reminderLogs
        .where('[reminderId+date]')
        .equals([reminder.id, todayStr])
        .first();
      if (todayLog && todayLog.status === 'done') {
        await markReminder(reminder.id, 'pending' as any);
      }
    } else {
      // 打勾：标记今天为 done
      await markReminder(reminder.id, 'done');
    }
  }, [weeklyDoneCounts, markReminder]);

  // 处理 monthly_times 的打勾/取消
  const handleMonthlyTimesToggle = useCallback(async (reminder: Reminder, slotIndex: number) => {
    const currentCount = monthlyDoneCounts[reminder.id] || 0;

    if (slotIndex < currentCount) {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const todayLog = await reminderDb.reminderLogs
        .where('[reminderId+date]')
        .equals([reminder.id, todayStr])
        .first();
      if (todayLog && todayLog.status === 'done') {
        await markReminder(reminder.id, 'pending' as any);
      }
    } else {
      await markReminder(reminder.id, 'done');
    }
  }, [monthlyDoneCounts, markReminder]);

  // 非 weekly/monthly_times 的每日提醒（按时间排序）
  const todayReminders = useMemo(() => {
    return reminders
      .filter((r) => {
        if (!r.enabled) return false;
        if (r.repeat === 'weekly' || r.repeat === 'weekly_times' || r.repeat === 'monthly_times') return false;
        switch (r.repeat) {
          case 'daily': return true;
          case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
          case 'weekends': return dayOfWeek === 0 || dayOfWeek === 6;
          case 'monthly': return r.monthDays?.includes(dateOfMonth) ?? false;
          case 'once': return true;
          default: return true;
        }
      })
      .sort((a, b) => {
        // 没有时间的排在最后
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        const [aH, aM] = a.time.split(':').map(Number);
        const [bH, bM] = b.time.split(':').map(Number);
        return (aH * 60 + aM) - (bH * 60 + bM);
      });
  }, [reminders, dayOfWeek, dateOfMonth]);

  // 每周提醒（常驻显示，不限周几）
  const weeklyReminders = useMemo(() => {
    return reminders.filter((r) => r.enabled && (r.repeat === 'weekly' || r.repeat === 'weekly_times'));
  }, [reminders]);

  // 每月弹性提醒（monthly_times）
  const monthlyFlexReminders = useMemo(() => {
    return reminders.filter((r) => r.enabled && r.repeat === 'monthly_times');
  }, [reminders]);

  const nextReminderId = useMemo(() => {
    for (const r of todayReminders) {
      if (!r.time) continue; // 没时间的不参与"下一个"
      const [h, m] = r.time.split(':').map(Number);
      const rMinutes = h * 60 + m;
      const log = logs.find((l) => l.reminderId === r.id);
      if (!log || (log.status !== 'done' && log.status !== 'skipped')) {
        if (rMinutes >= currentMinutes - 30) {
          return r.id;
        }
      }
    }
    return null;
  }, [todayReminders, logs, currentMinutes]);

  function getStatus(reminderId: string) {
    const log = logs.find((l) => l.reminderId === reminderId);
    return log?.status;
  }

  function isPast(time: string) {
    if (!time) return false;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m < currentMinutes;
  }

  const hasAny = todayReminders.length > 0 || weeklyReminders.length > 0 || monthlyFlexReminders.length > 0;

  if (!hasAny) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🌿</p>
        <p className="text-lg font-medium" style={{ color: 'var(--cb-color-primary-dark)' }}>
          今天还没有提醒
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--cb-color-primary-medium)' }}>
          添加一些复利提醒，让每天都在积累
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 每日提醒（按时间排序） */}
      <AnimatePresence mode="popLayout">
        {todayReminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            status={getStatus(reminder.id)}
            onEdit={onEdit}
            onFocus={onFocus}
            isPast={isPast(reminder.time)}
            isNext={reminder.id === nextReminderId}
          />
        ))}
      </AnimatePresence>

      {/* 每周提醒（常驻在最后面） */}
      {weeklyReminders.length > 0 && (
        <div className="pt-3 mt-2" style={{ borderTop: '1px dashed rgba(109,76,51,0.12)' }}>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <span className="text-xs font-semibold" style={{ color: 'var(--cb-color-primary-medium)' }}>
              每周待办
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(109,76,51,0.06)' }} />
          </div>
          <div className="space-y-1.5">
            {weeklyReminders.map((reminder) => {
              const isWeeklyTimes = reminder.repeat === 'weekly_times';
              const target = reminder.weeklyTimesTarget || 3;
              const weekDoneCount = weeklyDoneCounts[reminder.id] || 0;
              const isDone = isWeeklyTimes ? weekDoneCount >= target : getStatus(reminder.id) === 'done';
              const subText = isWeeklyTimes
                ? `每周 ${target} 次 · 已完成 ${weekDoneCount}/${target}`
                : reminder.weekDays?.length
                  ? reminder.weekDays.map(d => weekDayLabels[d]).join('、')
                  : '未设置';

              return (
                <motion.div
                  key={reminder.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'cb-task-card flex items-center gap-3 !py-3 !px-4',
                    isDone && 'is-done',
                  )}
                >
                  {/* 内容（左侧） */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(reminder)}>
                    <h3
                      className={cn(
                        'font-semibold text-[15px] truncate',
                        isDone && 'line-through opacity-60',
                      )}
                      style={{ color: 'var(--cb-color-primary-dark)' }}
                    >
                      {reminder.title}
                    </h3>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--cb-color-primary-medium)' }}>
                      {subText}
                    </p>
                  </div>

                  {/* 打勾（右侧） */}
                  {isWeeklyTimes ? (
                    <div className="flex-shrink-0 flex gap-1.5">
                      {Array.from({ length: target }).map((_, idx) => {
                        const checked = idx < weekDoneCount;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleWeeklyTimesToggle(reminder, idx)}
                            className={cn(
                              'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
                              checked
                                ? 'bg-[#A8C298] border-[#A8C298]'
                                : 'border-gray-300/50 bg-white/50 active:border-[#A8C298] active:bg-[#A8C298]/10',
                            )}
                          >
                            {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      onClick={() => markReminder(reminder.id, isDone ? 'pending' as any : 'done')}
                      className={cn(
                        'flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all',
                        isDone
                          ? 'bg-[#A8C298] border-[#A8C298]'
                          : 'border-gray-300/50 bg-white/50 active:border-[#A8C298] active:bg-[#A8C298]/10',
                      )}
                    >
                      {isDone && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 每月弹性提醒（monthly_times） */}
      {monthlyFlexReminders.length > 0 && (
        <div className="pt-3 mt-2" style={{ borderTop: '1px dashed rgba(109,76,51,0.12)' }}>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <span className="text-xs font-semibold" style={{ color: 'var(--cb-color-primary-medium)' }}>
              每月待办
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(109,76,51,0.06)' }} />
          </div>
          <div className="space-y-1.5">
            {monthlyFlexReminders.map((reminder) => {
              const target = reminder.monthlyTimesTarget || 2;
              const monthDoneCount = monthlyDoneCounts[reminder.id] || 0;
              const isDone = monthDoneCount >= target;
              const subText = `每月 ${target} 次 · 已完成 ${monthDoneCount}/${target}`;

              return (
                <motion.div
                  key={reminder.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'cb-task-card flex items-center gap-3 !py-3 !px-4',
                    isDone && 'is-done',
                  )}
                >
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(reminder)}>
                    <h3
                      className={cn(
                        'font-semibold text-[15px] truncate',
                        isDone && 'line-through opacity-60',
                      )}
                      style={{ color: 'var(--cb-color-primary-dark)' }}
                    >
                      {reminder.title}
                    </h3>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--cb-color-primary-medium)' }}>
                      {subText}
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex gap-1.5 flex-wrap max-w-[160px] justify-end">
                    {Array.from({ length: Math.min(target, 10) }).map((_, idx) => {
                      const checked = idx < monthDoneCount;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleMonthlyTimesToggle(reminder, idx)}
                          className={cn(
                            'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all',
                            checked
                              ? 'bg-[#A8C298] border-[#A8C298]'
                              : 'border-gray-300/50 bg-white/50 active:border-[#A8C298] active:bg-[#A8C298]/10',
                          )}
                        >
                          {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </button>
                      );
                    })}
                    {target > 10 && (
                      <span className="text-xs self-center" style={{ color: 'var(--cb-color-primary-medium)' }}>
                        +{target - 10}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
