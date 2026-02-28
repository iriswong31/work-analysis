#!/usr/bin/env node
/**
 * 三 Agent 协作系统 CLI
 * 执行完整的规划-执行-审查流程
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { runAgentWorkflow } from '../agents/index.js';
import type { PlanRequest } from '../agents/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🤖 三 Agent 协作系统

用法:
  npx ts-node src/cli/run-agents.ts <command> [options]

命令:
  run <title> <requirements...>  执行完整的规划-执行-审查流程
  check                          检查产出一致性

示例:
  npx ts-node src/cli/run-agents.ts run "创建用户模块" "实现用户注册功能" "实现用户登录功能"
  npx ts-node src/cli/run-agents.ts check
`);
    return;
  }

  const command = args[0];
  const projectRoot = path.resolve(__dirname, '../../../');

  switch (command) {
    case 'run':
      await runWorkflow(args.slice(1), projectRoot);
      break;
    
    case 'check':
      // 调用一致性检查
      const { checkOutputConsistency } = await import('../agents');
      const result = await checkOutputConsistency(projectRoot);
      console.log(JSON.stringify(result, null, 2));
      break;
    
    default:
      console.error(`未知命令: ${command}`);
      process.exit(1);
  }
}

async function runWorkflow(args: string[], projectRoot: string) {
  if (args.length < 2) {
    console.error('用法: run <title> <requirements...>');
    process.exit(1);
  }

  const title = args[0];
  const requirements = args.slice(1);

  const request: PlanRequest = {
    title,
    description: `执行任务: ${title}`,
    requirements,
  };

  console.log('🚀 启动三 Agent 协作系统\n');
  console.log(`📋 任务: ${title}`);
  console.log(`📝 需求: ${requirements.join(', ')}\n`);

  console.log('━'.repeat(50));
  console.log('阶段 1: Planner Agent 规划任务...');
  console.log('━'.repeat(50));

  try {
    const result = await runAgentWorkflow(request, projectRoot, {
      maxRetries: 2,
      minPassScore: 70,
      autoFix: true,
    });

    console.log('\n' + '━'.repeat(50));
    console.log('执行结果');
    console.log('━'.repeat(50));

    if (result.success) {
      console.log('✅ 任务成功完成！\n');
      
      if (result.plan) {
        console.log(`📋 计划: ${result.plan.title}`);
        console.log(`   任务数: ${result.plan.tasks.length}`);
        console.log(`   预估时间: ${result.plan.estimatedMinutes} 分钟`);
      }

      if (result.executionResults.length > 0) {
        console.log('\n📦 产出:');
        result.executionResults.forEach(r => {
          r.actualOutputs.forEach(o => {
            const icon = o.created ? '✅' : '❌';
            console.log(`   ${icon} ${o.name} (${o.type})`);
          });
        });
      }

      if (result.validationResult) {
        console.log(`\n🔍 验证分数: ${result.validationResult.score}/100`);
      }
    } else {
      console.log('❌ 任务执行失败\n');
      console.log(`错误: ${result.error}`);

      if (result.validationResult?.issues) {
        console.log('\n问题列表:');
        result.validationResult.issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. [${issue.severity}] ${issue.message}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ 执行出错:', error);
    process.exit(1);
  }
}

main();
