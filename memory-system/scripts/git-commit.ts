/**
 * Git 自动提交脚本
 * 自动提交记忆系统的变更
 */

import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORY_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(MEMORY_ROOT, '..');

interface CommitOptions {
  action: 'update' | 'init' | 'sync' | 'review';
  layer?: string;
  summary?: string;
}

function getGitStatus(): string {
  try {
    return execSync('git status --porcelain memory-system/', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
  } catch {
    return '';
  }
}

function getChangedFiles(): string[] {
  const status = getGitStatus();
  if (!status) return [];
  
  return status
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.slice(3)); // 移除状态标记
}

function generateCommitMessage(options: CommitOptions): string {
  const { action, layer, summary } = options;
  
  const actionMap: Record<string, string> = {
    update: '更新',
    init: '初始化',
    sync: '同步',
    review: '复盘',
  };
  
  const actionText = actionMap[action] || action;
  
  if (layer) {
    return `[memory] ${actionText}: ${layer}${summary ? ` - ${summary}` : ''}`;
  }
  
  return `[memory] ${actionText}${summary ? `: ${summary}` : ''}`;
}

function gitCommit(message: string): void {
  try {
    // 添加 memory-system 目录的所有变更
    execSync('git add memory-system/', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    
    // 提交
    execSync(`git commit -m "${message}"`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    
    console.log(`✅ 已提交: ${message}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('nothing to commit')) {
      console.log('ℹ️ 没有需要提交的变更');
    } else {
      throw error;
    }
  }
}

function detectLayerFromFiles(files: string[]): string | undefined {
  const layerPatterns = [
    { pattern: /L0_状态层/, layer: 'L0_状态层' },
    { pattern: /L1_情境层/, layer: 'L1_情境层' },
    { pattern: /L2_行为层/, layer: 'L2_行为层' },
    { pattern: /L3_认知层/, layer: 'L3_认知层' },
    { pattern: /L4_核心层/, layer: 'L4_核心层' },
    { pattern: /Intent/, layer: 'Intent' },
    { pattern: /Meta/, layer: 'Meta' },
  ];
  
  const detectedLayers = new Set<string>();
  
  for (const file of files) {
    for (const { pattern, layer } of layerPatterns) {
      if (pattern.test(file)) {
        detectedLayers.add(layer);
        break;
      }
    }
  }
  
  if (detectedLayers.size === 1) {
    return Array.from(detectedLayers)[0];
  } else if (detectedLayers.size > 1) {
    return Array.from(detectedLayers).join(', ');
  }
  
  return undefined;
}

async function main(): Promise<void> {
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('ℹ️ 没有检测到 memory-system 目录的变更');
    return;
  }
  
  console.log('📝 检测到以下变更:');
  changedFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');
  
  // 从命令行参数获取选项
  const action = (process.argv[2] as CommitOptions['action']) || 'update';
  const summary = process.argv[3];
  const layer = detectLayerFromFiles(changedFiles);
  
  const message = generateCommitMessage({ action, layer, summary });
  
  console.log(`📦 准备提交: ${message}\n`);
  
  gitCommit(message);
}

main().catch(console.error);
