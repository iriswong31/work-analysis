#!/usr/bin/env node
/**
 * 自主任务系统 CLI 命令
 * 
 * 使用方法:
 *   npx tsx src/cli/autonomous-cmd.ts run      # 立即执行
 *   npx tsx src/cli/autonomous-cmd.ts preview  # 预览计划
 *   npx tsx src/cli/autonomous-cmd.ts start    # 启动后台模式
 *   npx tsx src/cli/autonomous-cmd.ts status   # 查看状态
 */

import { 
  runNow, 
  previewPlan, 
  startBackground, 
  stopBackground, 
  getStatus,
  abort,
  exportForCodeBuddy,
  getTaskPrompt,
} from '../autonomous/index.js';

const command = process.argv[2];

async function main() {
  console.log();

  switch (command) {
    case 'run':
    case 'now':
      console.log('🚀 立即执行每日任务...\n');
      try {
        await runNow();
      } catch (error) {
        console.error('执行失败:', error);
        process.exit(1);
      }
      break;

    case 'preview':
    case 'plan':
      console.log('📋 预览每日计划...\n');
      try {
        await previewPlan();
      } catch (error) {
        console.error('生成计划失败:', error);
        process.exit(1);
      }
      break;

    case 'start':
    case 'background':
      console.log('🕐 启动后台定时模式...\n');
      startBackground();
      console.log('\n按 Ctrl+C 停止后台模式');
      // 保持进程运行
      process.on('SIGINT', () => {
        console.log('\n\n👋 停止后台模式...');
        stopBackground();
        process.exit(0);
      });
      break;

    case 'stop':
      console.log('⏹️ 停止后台模式...\n');
      stopBackground();
      break;

    case 'status':
      console.log('📊 当前状态:\n');
      const status = getStatus();
      console.log(`   运行中: ${status.isRunning ? '是' : '否'}`);
      console.log(`   模式: ${status.mode === 'interactive' ? '交互模式' : '后台模式'}`);
      console.log(`   后台定时: ${status.backgroundEnabled ? '已启用' : '未启用'}`);
      console.log(`   定时时间: ${status.scheduledTime}`);
      if (status.currentPlan) {
        console.log(`   当前计划: ${status.currentPlan.date} (${status.currentPlan.tasks.length} 个任务)`);
      }
      break;

    case 'abort':
      console.log('⚠️ 中止当前执行...\n');
      abort();
      break;

    case 'export':
    case 'codebuddy':
      console.log('📤 导出为 CodeBuddy 对话格式...\n');
      try {
        const format = process.argv[3] === '--json' ? 'json' : 'markdown';
        const output = await exportForCodeBuddy(format as 'markdown' | 'json');
        console.log(output);
      } catch (error) {
        console.error('导出失败:', error);
        process.exit(1);
      }
      break;

    case 'task':
      const taskIndex = parseInt(process.argv[3] || '0', 10);
      console.log(`📝 获取任务 ${taskIndex + 1} 的执行指令...\n`);
      try {
        const prompt = await getTaskPrompt(taskIndex);
        if (prompt) {
          console.log(prompt);
        } else {
          console.log('任务不存在');
        }
      } catch (error) {
        console.error('获取失败:', error);
        process.exit(1);
      }
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      printHelp();
      break;
  }
}

function printHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   🤖 Iris 数字分身 - 自主任务系统                           ║
╚════════════════════════════════════════════════════════════╝

使用方法:
  npx tsx src/cli/autonomous-cmd.ts <command>

命令:
  run, now       立即执行每日任务
  preview, plan  预览每日计划（不执行）
  export         导出为 CodeBuddy 对话格式（无需 API Key）
  task <n>       获取第 n 个任务的执行指令
  start          启动后台定时模式
  stop           停止后台定时模式
  status         查看当前状态
  abort          中止当前执行
  help           显示帮助信息

示例:
  # 导出任务计划到 CodeBuddy 对话
  npx tsx src/cli/autonomous-cmd.ts export

  # 导出为 JSON 格式
  npx tsx src/cli/autonomous-cmd.ts export --json

  # 获取第 1 个任务的执行指令
  npx tsx src/cli/autonomous-cmd.ts task 0

  # 立即开始执行今日任务
  npx tsx src/cli/autonomous-cmd.ts run

  # 先预览计划，确认后再执行
  npx tsx src/cli/autonomous-cmd.ts preview
  npx tsx src/cli/autonomous-cmd.ts run

  # 启动后台模式，每天定时执行
  npx tsx src/cli/autonomous-cmd.ts start
`);
}

main().catch(error => {
  console.error('发生错误:', error);
  process.exit(1);
});
