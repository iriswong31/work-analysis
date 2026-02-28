/**
 * Message-ID 存储管理模块
 * 用于存储和检索邮件的 Message-ID，实现邮件回复链功能
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 存储文件路径
const DATA_DIR = join(__dirname, '../../data');
const STORE_FILE = join(DATA_DIR, 'message-ids.json');

/**
 * Message-ID 记录结构
 */
export interface MessageIdRecord {
  messageId: string;      // 邮件唯一标识
  sentAt: string;         // 发送时间 ISO 格式
  subject: string;        // 邮件主题
  recipient: string;      // 收件人
}

/**
 * 存储结构：按收件人分组
 */
interface MessageIdStore {
  [recipient: string]: MessageIdRecord;
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
function readStore(): MessageIdStore {
  ensureDataDir();
  
  if (!existsSync(STORE_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(content) as MessageIdStore;
  } catch (error) {
    logger.error('读取 Message-ID 存储文件失败:', error);
    return {};
  }
}

/**
 * 写入存储文件
 */
function writeStore(store: MessageIdStore): void {
  ensureDataDir();
  
  try {
    writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
    logger.debug('Message-ID 存储已更新');
  } catch (error) {
    logger.error('写入 Message-ID 存储文件失败:', error);
  }
}

/**
 * 获取指定收件人的最后一封邮件 Message-ID
 */
export function getLastMessageId(recipient: string): MessageIdRecord | null {
  const store = readStore();
  return store[recipient] || null;
}

/**
 * 保存邮件的 Message-ID
 */
export function saveMessageId(record: MessageIdRecord): void {
  const store = readStore();
  store[record.recipient] = record;
  writeStore(store);
  logger.info(`已保存 Message-ID: ${record.messageId} (收件人: ${record.recipient})`);
}

/**
 * 清除指定收件人的 Message-ID 记录
 */
export function clearMessageId(recipient: string): void {
  const store = readStore();
  if (store[recipient]) {
    delete store[recipient];
    writeStore(store);
    logger.info(`已清除 Message-ID 记录 (收件人: ${recipient})`);
  }
}

/**
 * 获取所有存储的 Message-ID 记录
 */
export function getAllMessageIds(): MessageIdStore {
  return readStore();
}
