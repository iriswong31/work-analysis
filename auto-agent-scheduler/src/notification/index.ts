/**
 * 通知服务导出
 */

export { emailService } from './email-service.js';
export { getEmailConfig, isEmailConfigured, type EmailConfig } from './email-config.js';
export { generateReportHtml } from './report-template.js';
export { reportScheduler } from './report-scheduler.js';
export { getLastMessageId, saveMessageId, clearMessageId, getAllMessageIds, type MessageIdRecord } from './message-id-store.js';
export { getEmailHistory, saveEmailToHistory, clearEmailHistory, getEmailHistoryCount, type EmailHistoryRecord } from './email-history.js';
export { buildAccumulatedContent, buildAccumulatedText } from './email-content-builder.js';
