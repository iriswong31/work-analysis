/**
 * 记忆更新脚本
 * 用于从 auto-agent-scheduler 触发记忆更新
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORY_ROOT = path.resolve(__dirname, '..');

interface UpdatePayload {
  layer: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'Intent' | 'Meta';
  action: 'append' | 'update' | 'merge';
  path?: string; // YAML 路径，如 "recent_dialogues" 或 "project_states.0.status"
  data: unknown;
  source?: string;
  timestamp?: string;
}

const LAYER_FILES: Record<string, string> = {
  L0: 'Memory/L0_状态层.yaml',
  L1: 'Memory/L1_情境层.yaml',
  L2: 'Memory/L2_行为层.yaml',
  L3: 'Memory/L3_认知层.yaml',
  L4: 'Memory/L4_核心层.yaml',
};

function readYamlFile(filePath: string): Record<string, unknown> {
  const fullPath = path.join(MEMORY_ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    return {};
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  return YAML.parse(content) || {};
}

function writeYamlFile(filePath: string, data: Record<string, unknown>): void {
  const fullPath = path.join(MEMORY_ROOT, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // 更新时间戳
  data.last_updated = new Date().toISOString();
  
  const content = YAML.stringify(data, { indent: 2 });
  fs.writeFileSync(fullPath, content, 'utf-8');
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  
  current[keys[keys.length - 1]] = value;
}

function appendToArray(obj: Record<string, unknown>, path: string, item: unknown): void {
  const array = getNestedValue(obj, path);
  if (Array.isArray(array)) {
    array.push(item);
  } else {
    setNestedValue(obj, path, [item]);
  }
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

async function updateMemory(payload: UpdatePayload): Promise<void> {
  const { layer, action, path: yamlPath, data, source } = payload;
  
  // 检查 L4 层的特殊规则
  if (layer === 'L4' && source !== 'human') {
    console.error('❌ L4 核心层只能由人工修改');
    process.exit(1);
  }
  
  const filePath = LAYER_FILES[layer];
  if (!filePath) {
    console.error(`❌ 未知的层级: ${layer}`);
    process.exit(1);
  }
  
  console.log(`📝 更新 ${layer} 层...`);
  
  const currentData = readYamlFile(filePath);
  
  switch (action) {
    case 'append':
      if (!yamlPath) {
        console.error('❌ append 操作需要指定 path');
        process.exit(1);
      }
      appendToArray(currentData, yamlPath, data);
      console.log(`  ✅ 已追加到 ${yamlPath}`);
      break;
      
    case 'update':
      if (yamlPath) {
        setNestedValue(currentData, yamlPath, data);
        console.log(`  ✅ 已更新 ${yamlPath}`);
      } else {
        Object.assign(currentData, data);
        console.log(`  ✅ 已更新根级数据`);
      }
      break;
      
    case 'merge':
      const merged = deepMerge(currentData, data as Record<string, unknown>);
      Object.assign(currentData, merged);
      console.log(`  ✅ 已合并数据`);
      break;
      
    default:
      console.error(`❌ 未知的操作: ${action}`);
      process.exit(1);
  }
  
  writeYamlFile(filePath, currentData);
  console.log(`  💾 已保存到 ${filePath}`);
}

// 添加对话摘要到 L1
async function addDialogueSummary(summary: {
  date: string;
  summary: string;
  key_decisions: string[];
  action_items: string[];
}): Promise<void> {
  await updateMemory({
    layer: 'L1',
    action: 'append',
    path: 'recent_dialogues',
    data: summary,
    source: 'auto-agent-scheduler',
  });
}

// 更新项目状态
async function updateProjectStatus(projectId: string, status: string, nextAction: string): Promise<void> {
  const filePath = LAYER_FILES.L1;
  const data = readYamlFile(filePath);
  
  const projects = data.project_states as Array<Record<string, unknown>> || [];
  const project = projects.find(p => p.project_id === projectId);
  
  if (project) {
    project.status = status;
    project.next_action = nextAction;
    project.last_activity = new Date().toISOString().split('T')[0];
    writeYamlFile(filePath, data);
    console.log(`✅ 已更新项目 ${projectId} 状态`);
  } else {
    console.error(`❌ 未找到项目: ${projectId}`);
  }
}

// 添加行为模式观察
async function addBehaviorObservation(observation: {
  habit: string;
  context: string;
  example: string;
}): Promise<void> {
  const filePath = LAYER_FILES.L2;
  const data = readYamlFile(filePath);
  
  const habits = data.work_habits as Array<Record<string, unknown>> || [];
  const existing = habits.find(h => h.habit === observation.habit);
  
  if (existing) {
    // 增加观察次数
    existing.observed_count = ((existing.observed_count as number) || 0) + 1;
    (existing.examples as string[]).push(observation.example);
    console.log(`✅ 已更新习惯观察: ${observation.habit} (${existing.observed_count} 次)`);
  } else {
    // 添加新习惯
    habits.push({
      habit: observation.habit,
      frequency: 'sometimes',
      context: observation.context,
      observed_count: 1,
      first_observed: new Date().toISOString().split('T')[0],
      examples: [observation.example],
    });
    console.log(`✅ 已添加新习惯观察: ${observation.habit}`);
  }
  
  writeYamlFile(filePath, data);
}

// 添加洞察到队列
async function addInsight(insight: {
  insight: string;
  source_layer: string;
  target_layer: string;
}): Promise<void> {
  await updateMemory({
    layer: 'Meta' as UpdatePayload['layer'],
    action: 'append',
    path: 'pending_insights',
    data: {
      ...insight,
      observed_at: new Date().toISOString(),
      observation_count: 1,
      status: 'pending',
    },
    source: 'auto-agent-scheduler',
  });
}

// 命令行接口
async function main(): Promise<void> {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  switch (command) {
    case 'dialogue':
      // 示例: npx tsx update-memory.ts dialogue "今日对话摘要" "决策1,决策2" "行动1,行动2"
      await addDialogueSummary({
        date: new Date().toISOString().split('T')[0],
        summary: args[0] || '',
        key_decisions: args[1]?.split(',') || [],
        action_items: args[2]?.split(',') || [],
      });
      break;
      
    case 'project':
      // 示例: npx tsx update-memory.ts project shanzhi_mei active "下一步行动"
      await updateProjectStatus(args[0], args[1], args[2]);
      break;
      
    case 'behavior':
      // 示例: npx tsx update-memory.ts behavior "习惯" "上下文" "示例"
      await addBehaviorObservation({
        habit: args[0],
        context: args[1],
        example: args[2],
      });
      break;
      
    case 'insight':
      // 示例: npx tsx update-memory.ts insight "洞察内容" L1 L2
      await addInsight({
        insight: args[0],
        source_layer: args[1],
        target_layer: args[2],
      });
      break;
      
    default:
      console.log(`
记忆更新脚本使用方法:

  npx tsx update-memory.ts <command> [args...]

命令:
  dialogue <summary> <decisions> <actions>  添加对话摘要到 L1
  project <id> <status> <next_action>       更新项目状态
  behavior <habit> <context> <example>      添加行为观察到 L2
  insight <insight> <source> <target>       添加洞察到队列

示例:
  npx tsx update-memory.ts dialogue "完成记忆系统初始化" "采用YAML存储" "配置Gist同步"
  npx tsx update-memory.ts project shanzhi_mei active "完成方案设计"
  npx tsx update-memory.ts behavior "先列大纲再写内容" "写作" "今天写文章时先画了思维导图"
  npx tsx update-memory.ts insight "遇到问题先画图是视觉化思维的体现" L2 L3
      `);
  }
}

main().catch(console.error);

export {
  updateMemory,
  addDialogueSummary,
  updateProjectStatus,
  addBehaviorObservation,
  addInsight,
};
