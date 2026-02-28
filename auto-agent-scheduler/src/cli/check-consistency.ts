#!/usr/bin/env node
/**
 * 产出一致性检查 CLI
 * 检查 outputs.json 中记录的产出是否都有对应的实际内容
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { checkOutputConsistency } from '../agents/index.js';
import type { ValidationResult, ValidationIssue } from '../agents/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🔍 开始检查产出一致性...\n');

  // 项目根目录（iris-me）
  const projectRoot = path.resolve(__dirname, '../../../');
  
  try {
    const result = await checkOutputConsistency(projectRoot);
    
    if (!result.success) {
      console.error('❌ 检查失败:', result.error);
      process.exit(1);
    }

    const validation = result.data as ValidationResult;
    
    console.log(`📊 检查结果:`);
    console.log(`   通过: ${validation.passed ? '✅ 是' : '❌ 否'}`);
    console.log(`   分数: ${validation.score}/100`);
    console.log(`   问题数: ${validation.issues.length}`);
    console.log('');

    if (validation.issues.length > 0) {
      console.log('⚠️  发现的问题:\n');
      
      validation.issues.forEach((issue: ValidationIssue, index: number) => {
        const icon = issue.severity === 'error' ? '❌' : 
                     issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${index + 1}. ${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
        if (issue.suggestedFix) {
          console.log(`      💡 建议: ${issue.suggestedFix}`);
        }
        console.log('');
      });
    }

    if (validation.fixTasks && validation.fixTasks.length > 0) {
      console.log('🔧 建议的修复任务:\n');
      
      validation.fixTasks.forEach((task, index) => {
        console.log(`   ${index + 1}. [${task.priority.toUpperCase()}] ${task.description}`);
        console.log(`      类型: ${task.type}`);
        console.log('');
      });
    }

    if (validation.passed) {
      console.log('✅ 所有产出记录都有对应的实际内容！');
    } else {
      console.log('❌ 存在不一致的产出记录，请根据建议进行修复。');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ 执行出错:', error);
    process.exit(1);
  }
}

main();
