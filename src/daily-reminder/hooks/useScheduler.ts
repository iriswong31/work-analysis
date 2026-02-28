// ==========================================
// 提醒调度器 Hook
// ==========================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { Reminder } from '@/types/reminder';
import { useReminderStore } from '../stores/reminderStore';
import { useNotification } from './useNotification';
import { playReminderSound } from '../utils/sounds';
import { sendReminderToWebhook } from '../utils/webhook';

/** 判断提醒今天是否应该触发 */
function shouldFireToday(reminder: Reminder): boolean {
  if (!reminder.enabled) return false;
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dateOfMonth = now.getDate();

  switch (reminder.repeat) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'weekly':
      return reminder.weekDays?.includes(dayOfWeek) ?? false;
    case 'weekly_times':
      return true;
    case 'monthly':
      return reminder.monthDays?.includes(dateOfMonth) ?? false;
    case 'monthly_times':
      return true;
    case 'once':
      return true;
    default:
      return false;
  }
}

/** 获取当前时间的 HH:MM 格式 */
function currentTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export interface ActiveAlert {
  reminder: Reminder;
  triggeredAt: Date;
}

export function useScheduler() {
  const { reminders, todayLogs } = useReminderStore();
  const { sendNotification, permission } = useNotification();
  const firedRef = useRef<Set<string>>(new Set());
  const lastCheckedMinute = useRef<string>('');
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);

  // 触发提醒
  const fireReminder = useCallback(
    async (reminder: Reminder) => {
      // 检查是否已经完成
      const log = todayLogs.find(
        (l) => l.reminderId === reminder.id && l.status === 'done'
      );
      if (log) return;

      // 防止重复触发
      const fireKey = `${reminder.id}-${reminder.time}`;
      if (firedRef.current.has(fireKey)) return;
      firedRef.current.add(fireKey);

      console.log(`[Scheduler] 触发提醒: ${reminder.title} @ ${currentTimeStr()}`);

      // 页面内弹出提醒（始终生效）
      setActiveAlert({ reminder, triggeredAt: new Date() });

      // 浏览器通知（需要权限）
      if (permission === 'granted') {
        sendNotification(reminder);
      }

      // 声音提醒（始终尝试）
      if (reminder.soundEnabled) {
        await playReminderSound(reminder.urgency);
      }

      // 企业微信推送
      if (reminder.webhookEnabled) {
        const result = await sendReminderToWebhook(reminder);
        console.log(`[Scheduler] 企业微信推送: ${result ? '成功' : '失败'}`);
      }
    },
    [sendNotification, todayLogs, permission]
  );

  // 每秒检查（轻量操作）
  const checkReminders = useCallback(() => {
    const nowStr = currentTimeStr();
    // 同一分钟只检查一次
    if (nowStr === lastCheckedMinute.current) return;
    lastCheckedMinute.current = nowStr;

    reminders.forEach((reminder) => {
      if (!shouldFireToday(reminder)) return;
      // 没有设置时间的提醒不触发定时通知
      if (!reminder.time) return;
      if (reminder.time === nowStr) {
        fireReminder(reminder);
      }
    });
  }, [reminders, fireReminder]);

  // 关闭页面内提醒
  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  // 每天零点重置
  useEffect(() => {
    const resetAtMidnight = () => {
      const now = new Date();
      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
        now.getTime();
      setTimeout(() => {
        firedRef.current.clear();
        lastCheckedMinute.current = '';
        resetAtMidnight();
      }, msUntilMidnight);
    };
    resetAtMidnight();
  }, []);

  // 启动每秒轮询
  useEffect(() => {
    checkReminders();
    const intervalId = setInterval(checkReminders, 1000);
    return () => clearInterval(intervalId);
  }, [checkReminders]);

  // 页面重新可见时检查（从后台切回）
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastCheckedMinute.current = ''; // 重置让它立即检查
        checkReminders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkReminders]);

  return {
    scheduledCount: reminders.filter((r) => shouldFireToday(r)).length,
    activeAlert,
    dismissAlert,
    notificationPermission: permission,
  };
}
