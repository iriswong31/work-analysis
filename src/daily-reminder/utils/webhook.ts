// ==========================================
// 企业微信 Webhook 推送
// ==========================================

import { reminderDb } from './db';
import { Reminder } from '@/types/reminder';
import { generateMessage, getTimeGreeting } from '../constants/messages';

/** 将企业微信 URL 转为可用的请求地址（统一走同域代理，无跨域问题） */
function toRequestUrl(originalUrl: string): string {
  try {
    const trimmed = originalUrl.trim();
    // 尝试直接用正则提取 key（更鲁棒）
    const keyMatch = trimmed.match(/[?&]key=([a-zA-Z0-9\-_]+)/);
    if (keyMatch) {
      return `/api/webhook/send?key=${keyMatch[1]}`;
    }
    // fallback: URL 解析
    const url = new URL(trimmed);
    const key = url.searchParams.get('key');
    if (key) {
      return `/api/webhook/send?key=${key}`;
    }
    // 无 key，不走代理
    return trimmed;
  } catch {
    return originalUrl.trim();
  }
}

/** 发送企业微信消息 */
export async function sendWebhookMessage(content: string): Promise<boolean> {
  try {
    const configs = await reminderDb.webhookConfig.toArray();
    const config = configs[0];
    if (!config || !config.enabled || !config.url) {
      console.warn('[Webhook] 未配置或未启用:', { enabled: config?.enabled, hasUrl: !!config?.url });
      return false;
    }

    const requestUrl = toRequestUrl(config.url);
    console.log('[Webhook] 发送请求到:', requestUrl);

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: 'markdown',
        markdown: {
          content,
        },
      }),
    });

    if (!response.ok) {
      console.error('[Webhook] HTTP 错误:', response.status, response.statusText);
      return false;
    }

    // 检查企业微信返回的业务状态码
    const result = await response.json();
    if (result.errcode !== 0) {
      console.error('[Webhook] 企业微信返回错误:', result);
      return false;
    }

    console.log('[Webhook] 发送成功');
    return true;
  } catch (error) {
    console.error('[Webhook] 发送失败:', error);
    return false;
  }
}

/** 发送提醒到企业微信 */
export async function sendReminderToWebhook(reminder: Reminder): Promise<boolean> {
  const greeting = getTimeGreeting();
  const message = generateMessage(reminder.category, reminder.urgency, reminder.customMessage);
  
  const content = [
    `${greeting}**${reminder.title}**`,
    '',
    `> ${message.replace('\n', '\n> ')}`,
    '',
    `⏰ ${reminder.time}${reminder.endTime ? ` - ${reminder.endTime}` : ''}`,
  ].join('\n');

  return sendWebhookMessage(content);
}

/** 发送每日摘要到企业微信 */
export async function sendDailySummary(
  completedCount: number,
  totalCount: number,
  streak: number,
): Promise<boolean> {
  const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const content = [
    '📊 **今日提醒完成情况**',
    '',
    `✅ 完成：${completedCount}/${totalCount} (${rate}%)`,
    streak > 1 ? `🔥 连续打卡：${streak} 天` : '',
    '',
    rate >= 80 ? '> 今天做得很好，继续保持！' :
    rate >= 50 ? '> 完成了一半以上，明天可以更好。' :
    '> 明天是新的开始，不要对自己太苛刻。',
  ].filter(Boolean).join('\n');

  return sendWebhookMessage(content);
}

/** 测试 Webhook 连接 */
export async function testWebhook(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const requestUrl = toRequestUrl(url);
    console.log('[Webhook Test] 原始URL:', url);
    console.log('[Webhook Test] 请求URL:', requestUrl);

    // 验证 URL 提取是否正确
    if (!requestUrl.startsWith('/api/webhook/')) {
      return { success: false, error: `URL格式异常：未能提取key参数。请确认URL格式为 https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx` };
    }

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: 'markdown',
        markdown: {
          content: '✅ **Iris Daily Reminder** 连接测试成功！\n\n> 你的提醒将通过这里推送给你。温柔但坚定，陪伴你成为更好的自己。',
        },
      }),
    });

    console.log('[Webhook Test] HTTP状态:', response.status);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}${text ? ' - ' + text : ''}` };
    }

    const result = await response.json();
    console.log('[Webhook Test] 返回结果:', result);

    if (result.errcode !== 0) {
      return { success: false, error: `企业微信错误(${result.errcode}): ${result.errmsg || JSON.stringify(result)}` };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Webhook Test] 异常:', err);
    return { success: false, error: `网络错误: ${msg}` };
  }
}
