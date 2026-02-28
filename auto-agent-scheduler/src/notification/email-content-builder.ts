/**
 * 邮件内容拼接工具
 * 用于将当前日报与历史日报内容按格式拼接
 */

import type { EmailHistoryRecord } from './email-history.js';

/**
 * 生成分隔线 HTML
 */
function generateSeparator(): string {
  return `
    <div style="margin: 32px 0; text-align: center;">
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
      <span style="display: inline-block; background: #fff; padding: 0 16px; position: relative; top: -12px; color: #9ca3af; font-size: 12px;">
        ▼ 历史日报 ▼
      </span>
    </div>
  `;
}

/**
 * 将历史邮件内容包装为引用样式
 */
function wrapAsQuote(record: EmailHistoryRecord): string {
  const date = new Date(record.timestamp).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border-left: 4px solid #6366f1; border-radius: 0 8px 8px 0;">
      <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
        <span style="color: #6b7280; font-size: 12px;">📅 ${date}</span>
        <span style="color: #374151; font-size: 14px; font-weight: 500; margin-left: 12px;">${record.subject}</span>
      </div>
      <div style="color: #4b5563;">
        ${record.htmlContent}
      </div>
    </div>
  `;
}

/**
 * 构建累积邮件内容
 * @param currentContent 当前日报 HTML 内容
 * @param historyRecords 历史邮件记录（已按时间倒序排列）
 * @returns 累积后的完整 HTML 内容
 */
export function buildAccumulatedContent(
  currentContent: string,
  historyRecords: EmailHistoryRecord[]
): string {
  // 如果没有历史记录，直接返回当前内容
  if (historyRecords.length === 0) {
    return currentContent;
  }

  // 构建历史内容部分
  const historyHtml = historyRecords
    .map(record => wrapAsQuote(record))
    .join('\n');

  // 拼接：当前内容 + 分隔线 + 历史内容
  return `
    ${currentContent}
    ${generateSeparator()}
    ${historyHtml}
  `;
}

/**
 * 获取累积邮件的纯文本版本
 */
export function buildAccumulatedText(
  currentText: string,
  historyRecords: EmailHistoryRecord[]
): string {
  if (historyRecords.length === 0) {
    return currentText;
  }

  const historyText = historyRecords
    .map(record => {
      const date = new Date(record.timestamp).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      });
      return `\n--- ${date} ---\n${record.subject}\n`;
    })
    .join('\n');

  return `${currentText}\n\n========== 历史日报 ==========\n${historyText}`;
}
