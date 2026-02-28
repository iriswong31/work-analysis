import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import type { AppConfig } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 默认配置
const defaultConfig: AppConfig = {
  scheduler: {
    enabled: true,
    timezone: 'Asia/Shanghai',
    dailyExecutionTime: '09:00',
    maxTasksPerDay: 5,
    retryAttempts: 3,
    retryDelayMs: 5000,
  },
  ai: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    temperature: 0.7,
  },
  memory: {
    syncIntervalMs: 60000,
    maxHistoryDays: 30,
  },
  delivery: {
    outputDir: './data/deliveries',
    reportFormat: 'markdown',
  },
  logging: {
    level: 'info',
    maxFiles: 7,
    maxSize: '10m',
  },
};

// 加载配置文件
function loadConfigFile(): Partial<AppConfig> {
  const configPath = path.join(__dirname, '../../config/default.json');
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('Failed to load config file:', error);
  }
  return {};
}

// 合并配置
function mergeConfig(): AppConfig {
  const fileConfig = loadConfigFile();
  
  const config: AppConfig = {
    scheduler: {
      ...defaultConfig.scheduler,
      ...fileConfig.scheduler,
      dailyExecutionTime: process.env.DAILY_EXECUTION_TIME || fileConfig.scheduler?.dailyExecutionTime || defaultConfig.scheduler.dailyExecutionTime,
      timezone: process.env.TIMEZONE || fileConfig.scheduler?.timezone || defaultConfig.scheduler.timezone,
      maxTasksPerDay: parseInt(process.env.MAX_TASKS_PER_DAY || '') || fileConfig.scheduler?.maxTasksPerDay || defaultConfig.scheduler.maxTasksPerDay,
    },
    ai: {
      ...defaultConfig.ai,
      ...fileConfig.ai,
    },
    memory: {
      ...defaultConfig.memory,
      ...fileConfig.memory,
    },
    delivery: {
      ...defaultConfig.delivery,
      ...fileConfig.delivery,
    },
    logging: {
      ...defaultConfig.logging,
      ...fileConfig.logging,
      level: process.env.LOG_LEVEL || fileConfig.logging?.level || defaultConfig.logging.level,
    },
  };

  return config;
}

export const config = mergeConfig();

export function getIrisMePath(): string {
  return process.env.IRIS_ME_PATH || path.join(__dirname, '../../../');
}

export function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return key;
}

export default config;
