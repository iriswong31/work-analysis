/**
 * 历史邮件存储服务
 * 用于存储和检索历史邮件内容，实现邮件内容累积功能
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 存储文件路径
const DATA_DIR = join(__dirname, '../../data');
const HISTORY_FILE = join(DATA_DIR, 'email-history.json');

/**
 * 历史邮件记录结构
 */
export interface EmailHistoryRecord {
  timestamp: string;      // ISO格式时间戳
  subject: string;        // 邮件主题
  htmlContent: string;    // 邮件HTML正文
  recipient: string;      // 收件人
}

/**
 * 存储结构：按收件人分组的历史记录数组
 */
interface EmailHistoryStore {
  [recipient: string]: EmailHistoryRecord[];
}

/**
 * 确保数据目录存在
 */
function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    logger.info(`创建数据目录: ${DATA_DIR}`);
  }
}

/**
 * 读取存储文件
 */
function readStore(): EmailHistoryStore {
  ensureDataDir();
  
  if (!existsSync(HISTORY_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(content) as EmailHistoryStore;
  } catch (error) {
    logger.error('读取邮件历史存储文件失败:', error);
    return {};
  }
}

/**
 * 写入存储文件
 */
function writeStore(store: EmailHistoryStore): void {
  ensureDataDir();
  
  try {
    writeFileSync(HISTORY_FILE, JSON.stringify(store, null, 2), 'utf-8');
    logger.debug('邮件历史存储已更新');
  } catch (error) {
    logger.error('写入邮件历史存储文件失败:', error);
  }
}

/**
 * 获取指定收件人的历史邮件记录
 * @param recipient 收件人邮箱
 * @returns 历史记录数组（按时间倒序，最新的在前）
 */
export function getEmailHistory(recipient: string): EmailHistoryRecord[] {
  const store = readStore();
  const history = store[recipient] || [];
  // 按时间倒序排列
  return history.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * 保存邮件到历史记录
 */
export function saveEmailToHistory(record: EmailHistoryRecord): void {
  const store = readStore();
  
  if (!store[record.recipient]) {
    store[record.recipient] = [];
  }
  
  store[record.recipient].push(record);
  writeStore(store);
  
  logger.info(`已保存邮件到历史记录 (收件人: ${record.recipient}, 主题: ${record.subject})`);
}

/**
 * 清除指定收件人的历史记录
 */
export function clearEmailHistory(recipient: string): void {
  const store = readStore();
  
  if (store[recipient]) {
    delete store[recipient];
    writeStore(store);
    logger.info(`已清除邮件历史记录 (收件人: ${recipient})`);
  }
}

/**
 * 获取历史记录数量
 */
export function getEmailHistoryCount(recipient: string): number {
  const store = readStore();
  return store[recipient]?.length || 0;
}
