// ==========================================
// Reminder Zustand Store
// ==========================================

import { create } from 'zustand';
import { reminderDb, initReminderDb } from '../utils/db';
import { syncRemindersToServer } from '../utils/syncToServer';
import {
  Reminder,
  ReminderLog,
  FocusSession,
  WebhookConfig,
  DailyStats,
  ReminderStatus,
  CompoundCategory,
} from '@/types/reminder';

/** 防抖同步到服务端 */
let syncTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncRemindersToServer();
  }, 1000);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 旧分类 key → 新分类 key 映射 */
const categoryMigrationMap: Record<string, CompoundCategory> = {
  body: 'health',
  mind: 'creation',
  review: 'joy',
};

function migrateCategoryKey(category: CompoundCategory): CompoundCategory {
  return categoryMigrationMap[category] || category;
}

interface ReminderState {
  reminders: Reminder[];
  todayLogs: ReminderLog[];
  webhookConfig: WebhookConfig | null;
  focusSession: FocusSession | null;
  isInitialized: boolean;
  isLoading: boolean;

  // 初始化
  initialize: () => Promise<void>;

  // Reminder CRUD
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt' | 'sortOrder'>) => Promise<Reminder>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  importTemplateReminders: (templates: Omit<Reminder, 'id' | 'createdAt' | 'sortOrder'>[]) => Promise<void>;
  clearAllReminders: () => Promise<void>;

  // Logs
  markReminder: (reminderId: string, status: ReminderStatus) => Promise<void>;
  getTodayStats: () => DailyStats;
  getStreak: () => Promise<number>;
  getWeeklyStats: () => Promise<DailyStats[]>;
  getMonthlyCompletion: () => Promise<Record<string, number>>;

  // Monthly
  getMonthlyDetailedLogs: (year: number, month: number) => Promise<{
    date: string;
    reminderId: string;
    category: CompoundCategory;
    status: ReminderStatus | 'pending';
  }[]>;

  // Focus
  startFocus: (title: string, duration: number, reminderId?: string) => void;
  endFocus: (interrupted: boolean) => Promise<void>;

  // Webhook
  updateWebhookConfig: (config: Partial<WebhookConfig>) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  todayLogs: [],
  webhookConfig: null,
  focusSession: null,
  isInitialized: false,
  isLoading: false,

  initialize: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });
    try {
      await initReminderDb();
      const reminders = await reminderDb.reminders.orderBy('sortOrder').toArray();
      const todayLogs = await reminderDb.reminderLogs
        .where('date')
        .equals(todayStr())
        .toArray();
      const configs = await reminderDb.webhookConfig.toArray();
      set({
        reminders,
        todayLogs,
        webhookConfig: configs[0] || null,
        isInitialized: true,
        isLoading: false,
      });
      // 初始化后同步一次到服务端
      debouncedSync();
    } catch (error) {
      console.error('Failed to initialize reminder store:', error);
      set({ isLoading: false });
    }
  },

  addReminder: async (data) => {
    const reminder: Reminder = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      sortOrder: get().reminders.length,
    };
    await reminderDb.reminders.add(reminder);
    set({ reminders: [...get().reminders, reminder] });
    debouncedSync();
    return reminder;
  },

  updateReminder: async (id, updates) => {
    await reminderDb.reminders.update(id, updates);
    set({
      reminders: get().reminders.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    });
    debouncedSync();
  },

  deleteReminder: async (id) => {
    await reminderDb.reminders.delete(id);
    await reminderDb.reminderLogs.where('reminderId').equals(id).delete();
    set({
      reminders: get().reminders.filter((r) => r.id !== id),
      todayLogs: get().todayLogs.filter((l) => l.reminderId !== id),
    });
    debouncedSync();
  },

  toggleReminder: async (id) => {
    const r = get().reminders.find((r) => r.id === id);
    if (!r) return;
    await reminderDb.reminders.update(id, { enabled: !r.enabled });
    set({
      reminders: get().reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    });
    debouncedSync();
  },

  importTemplateReminders: async (templates) => {
    const existing = get().reminders;
    const newReminders: Reminder[] = templates.map((t, i) => ({
      ...t,
      id: generateId() + i,
      createdAt: new Date(),
      sortOrder: existing.length + i,
    }));
    await reminderDb.reminders.bulkAdd(newReminders);
    set({ reminders: [...existing, ...newReminders] });
    debouncedSync();
  },

  clearAllReminders: async () => {
    await reminderDb.reminders.clear();
    await reminderDb.reminderLogs.clear();
    set({ reminders: [], todayLogs: [] });
    debouncedSync();
  },

  markReminder: async (reminderId, status) => {
    const date = todayStr();
    const existing = get().todayLogs.find(
      (l) => l.reminderId === reminderId && l.date === date
    );

    if (existing) {
      await reminderDb.reminderLogs.update(existing.id, {
        status,
        completedAt: status === 'done' ? new Date() : undefined,
      });
      set({
        todayLogs: get().todayLogs.map((l) =>
          l.id === existing.id
            ? { ...l, status, completedAt: status === 'done' ? new Date() : undefined }
            : l
        ),
      });
    } else {
      const log: ReminderLog = {
        id: generateId(),
        reminderId,
        date,
        status,
        completedAt: status === 'done' ? new Date() : undefined,
      };
      await reminderDb.reminderLogs.add(log);
      set({ todayLogs: [...get().todayLogs, log] });
    }
  },

  getTodayStats: () => {
    const { reminders, todayLogs } = get();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dateOfMonth = today.getDate();

    const activeReminders = reminders.filter((r) => {
      if (!r.enabled) return false;
      switch (r.repeat) {
        case 'daily': return true;
        case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
        case 'weekends': return dayOfWeek === 0 || dayOfWeek === 6;
        case 'weekly': return r.weekDays?.includes(dayOfWeek) ?? false;
        case 'weekly_times': return true;
        case 'monthly': return r.monthDays?.includes(dateOfMonth) ?? false;
        case 'monthly_times': return true;
        case 'once': return true;
        default: return false;
      }
    });

    const total = activeReminders.length;
    const completed = todayLogs.filter((l) => l.status === 'done').length;
    const skipped = todayLogs.filter((l) => l.status === 'skipped').length;
    const missed = todayLogs.filter((l) => l.status === 'missed').length;
    const focusMinutes = todayLogs.reduce((sum, l) => sum + (l.actualFocusDuration || 0), 0);

    return {
      date: todayStr(),
      total,
      completed,
      skipped,
      missed,
      focusMinutes,
      completionRate: total > 0 ? completed / total : 0,
    };
  },

  getStreak: async () => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      const logs = await reminderDb.reminderLogs
        .where('date')
        .equals(dateStr)
        .toArray();
      
      if (logs.length === 0 && i > 0) break;
      if (logs.length === 0 && i === 0) continue; // 今天还没开始
      
      const doneCount = logs.filter((l) => l.status === 'done').length;
      if (doneCount > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  },

  getWeeklyStats: async () => {
    const stats: DailyStats[] = [];
    const today = new Date();
    // 本周从周日开始
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);

      // 未来的日期不查数据
      if (d > today) {
        stats.push({
          date: dateStr,
          total: 0,
          completed: 0,
          skipped: 0,
          missed: 0,
          focusMinutes: 0,
          completionRate: 0,
        });
        continue;
      }

      const logs = await reminderDb.reminderLogs
        .where('date')
        .equals(dateStr)
        .toArray();

      const completed = logs.filter((l) => l.status === 'done').length;
      const total = Math.max(logs.length, 1);

      stats.push({
        date: dateStr,
        total,
        completed,
        skipped: logs.filter((l) => l.status === 'skipped').length,
        missed: logs.filter((l) => l.status === 'missed').length,
        focusMinutes: logs.reduce((s, l) => s + (l.actualFocusDuration || 0), 0),
        completionRate: completed / total,
      });
    }
    return stats;
  },

  getMonthlyCompletion: async () => {
    const result: Record<string, number> = {};
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const logs = await reminderDb.reminderLogs
        .where('date')
        .equals(dateStr)
        .toArray();

      if (logs.length > 0) {
        const done = logs.filter((l) => l.status === 'done').length;
        result[dateStr] = done / logs.length;
      }
    }
    return result;
  },

  getMonthlyDetailedLogs: async (year, month) => {
    const { reminders } = get();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const results: {
      date: string;
      reminderId: string;
      category: CompoundCategory;
      status: ReminderStatus | 'pending';
    }[] = [];

    // 获取当月所有日志
    const allLogs: ReminderLog[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const logs = await reminderDb.reminderLogs
        .where('date')
        .equals(dateStr)
        .toArray();
      allLogs.push(...logs);
    }

    // 对每一天，每个启用的提醒生成一条记录
    const todayDate = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      if (d > todayDate) break; // 未来的天不生成
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = d.getDay();

      for (const r of reminders) {
        if (!r.enabled) continue;
        // 判断这天是否需要执行这个提醒
        let shouldRun = false;
        switch (r.repeat) {
          case 'daily': shouldRun = true; break;
          case 'weekdays': shouldRun = dayOfWeek >= 1 && dayOfWeek <= 5; break;
          case 'weekends': shouldRun = dayOfWeek === 0 || dayOfWeek === 6; break;
          case 'weekly': shouldRun = r.weekDays?.includes(dayOfWeek) ?? false; break;
          case 'weekly_times': shouldRun = true; break;
          case 'monthly': shouldRun = r.monthDays?.includes(day) ?? false; break;
          case 'monthly_times': shouldRun = true; break;
          case 'once': shouldRun = dateStr === new Date(r.createdAt).toISOString().slice(0, 10); break;
        }
        if (!shouldRun) continue;

        const log = allLogs.find(l => l.reminderId === r.id && l.date === dateStr);
        results.push({
          date: dateStr,
          reminderId: r.id,
          category: migrateCategoryKey(r.category),
          status: log?.status ?? 'pending',
        });
      }
    }

    return results;
  },

  startFocus: (title, duration, reminderId) => {
    set({
      focusSession: {
        id: generateId(),
        reminderId,
        title,
        duration,
        startedAt: new Date(),
        interrupted: false,
      },
    });
  },

  endFocus: async (interrupted) => {
    const session = get().focusSession;
    if (!session) return;

    const endedAt = new Date();
    const actualMinutes = Math.round(
      (endedAt.getTime() - session.startedAt.getTime()) / 60000
    );

    const completed: FocusSession = {
      ...session,
      endedAt,
      interrupted,
    };

    await reminderDb.focusSessions.add(completed);

    if (session.reminderId) {
      const date = todayStr();
      const existingLog = get().todayLogs.find(
        (l) => l.reminderId === session.reminderId && l.date === date
      );
      if (existingLog) {
        await reminderDb.reminderLogs.update(existingLog.id, {
          focusDuration: session.duration,
          actualFocusDuration: actualMinutes,
          status: interrupted ? 'skipped' : 'done',
          completedAt: interrupted ? undefined : endedAt,
        });
      }
    }

    set({ focusSession: null });
  },

  updateWebhookConfig: async (updates) => {
    const configs = await reminderDb.webhookConfig.toArray();
    if (configs[0]) {
      await reminderDb.webhookConfig.update(configs[0].id!, updates);
      set({ webhookConfig: { ...configs[0], ...updates } });
      debouncedSync();
    }
  },
}));
