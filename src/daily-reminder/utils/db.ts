// ==========================================
// Daily Reminder 数据库扩展
// ==========================================

import Dexie, { Table } from 'dexie';
import { Reminder, ReminderLog, FocusSession, WebhookConfig, MonthlySummary, Idea } from '@/types/reminder';

export interface UserSetting {
  key: string;
  value: string;
}

class ReminderDatabase extends Dexie {
  reminders!: Table<Reminder, string>;
  reminderLogs!: Table<ReminderLog, string>;
  focusSessions!: Table<FocusSession, string>;
  webhookConfig!: Table<WebhookConfig, number>;
  monthlySummaries!: Table<MonthlySummary, string>;
  userSettings!: Table<UserSetting, string>;
  ideas!: Table<Idea, string>;

  constructor() {
    super('IrisReminder');

    this.version(1).stores({
      reminders: 'id, category, time, enabled, createdAt, sortOrder',
      reminderLogs: 'id, reminderId, date, status, [reminderId+date]',
      focusSessions: 'id, reminderId, startedAt',
      webhookConfig: '++id',
    });

    this.version(2).stores({
      reminders: 'id, category, time, enabled, createdAt, sortOrder',
      reminderLogs: 'id, reminderId, date, status, [reminderId+date]',
      focusSessions: 'id, reminderId, startedAt',
      webhookConfig: '++id',
      monthlySummaries: 'id, year, month, category',
    });

    this.version(3).stores({
      reminders: 'id, category, time, enabled, createdAt, sortOrder',
      reminderLogs: 'id, reminderId, date, status, [reminderId+date]',
      focusSessions: 'id, reminderId, startedAt',
      webhookConfig: '++id',
      monthlySummaries: 'id, year, month, category',
      userSettings: 'key',
    });

    this.version(4).stores({
      reminders: 'id, category, time, enabled, createdAt, sortOrder',
      reminderLogs: 'id, reminderId, date, status, [reminderId+date]',
      focusSessions: 'id, reminderId, startedAt',
      webhookConfig: '++id',
      monthlySummaries: 'id, year, month, category',
      userSettings: 'key',
      ideas: 'id, status, category, createdAt',
    });

    // v5: ideas 支持多选分类 (category → *categories)
    this.version(5).stores({
      reminders: 'id, category, time, enabled, createdAt, sortOrder',
      reminderLogs: 'id, reminderId, date, status, [reminderId+date]',
      focusSessions: 'id, reminderId, startedAt',
      webhookConfig: '++id',
      monthlySummaries: 'id, year, month, category',
      userSettings: 'key',
      ideas: 'id, status, *categories, createdAt',
    }).upgrade(tx => {
      // 迁移旧数据：category → categories
      return tx.table('ideas').toCollection().modify(idea => {
        if (!idea.categories && idea.category) {
          idea.categories = [idea.category];
        } else if (!idea.categories) {
          idea.categories = ['custom'];
        }
      });
    });
  }
}

export const reminderDb = new ReminderDatabase();

/** 初始化默认 webhook 配置 */
export async function initReminderDb(): Promise<void> {
  const existingConfig = await reminderDb.webhookConfig.count();
  if (existingConfig === 0) {
    await reminderDb.webhookConfig.add({
      url: '',
      enabled: false,
    });
  }
}
