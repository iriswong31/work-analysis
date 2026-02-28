// ==========================================
// 同步提醒数据到服务端（供定时调度器使用）
// ==========================================

import { reminderDb } from './db';

/** 获取服务端 API base URL */
function getApiBase(): string {
  // 本地开发时也走同一个地址（vite proxy 或 localhost）
  return '';
}

/** 将前端 IndexedDB 中的提醒数据同步到服务端 */
export async function syncRemindersToServer(): Promise<boolean> {
  try {
    const reminders = await reminderDb.reminders.toArray();
    const configs = await reminderDb.webhookConfig.toArray();
    const config = configs[0];

    const payload = {
      reminders: reminders.map((r) => ({
        id: r.id,
        title: r.title,
        time: r.time,
        endTime: r.endTime,
        repeat: r.repeat,
        weekDays: r.weekDays,
        monthDay: r.monthDay,
        category: r.category,
        urgency: r.urgency,
        customMessage: r.customMessage,
        enabled: r.enabled,
        webhookEnabled: r.webhookEnabled,
      })),
      webhookUrl: config?.url || '',
      enabled: config?.enabled || false,
    };

    const resp = await fetch(`${getApiBase()}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) return false;

    const result = await resp.json();
    console.log('[Sync] 同步到服务端成功:', result);
    return result.ok === true;
  } catch (err) {
    console.warn('[Sync] 同步失败（服务端可能未启动）:', err);
    return false;
  }
}
