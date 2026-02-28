#!/usr/bin/env tsx
/**
 * 邮件服务测试脚本
 * 用于验证 SMTP 配置、回复链功能和内容累积功能
 */

import 'dotenv/config';
import { emailService } from '../notification/email-service.js';
import { isEmailConfigured, getEmailConfig } from '../notification/email-config.js';
import { getLastMessageId } from '../notification/message-id-store.js';
import { getEmailHistoryCount, clearEmailHistory } from '../notification/email-history.js';

async function main() {
  const args = process.argv.slice(2);
  const testReplyChain = args.includes('--reply') || args.includes('-r');
  const testAccumulation = args.includes('--accumulate') || args.includes('-a');
  const clearHistory = args.includes('--clear') || args.includes('-c');

  console.log('\n🔧 Iris 数字分身 - 邮件服务测试\n');
  console.log('='.repeat(50));

  // 检查配置
  if (!isEmailConfigured()) {
    console.log('❌ 邮件服务未配置');
    console.log('请检查 .env 文件中的 SMTP_USER 和 SMTP_PASS 配置');
    process.exit(1);
  }

  const config = getEmailConfig();
  console.log(`📧 发件邮箱: ${config.auth.user}`);
  console.log(`📬 收件邮箱: ${config.to}`);
  console.log(`🌐 SMTP 服务器: ${config.host}:${config.port}`);
  console.log('='.repeat(50));

  // 清除历史记录
  if (clearHistory) {
    console.log('\n🗑️ 清除邮件历史记录...');
    clearEmailHistory(config.to);
    console.log('✅ 历史记录已清除\n');
    return;
  }

  // 测试连接
  console.log('\n⏳ 正在测试 SMTP 连接...');
  const connected = await emailService.testConnection();
  
  if (!connected) {
    console.log('❌ SMTP 连接失败');
    console.log('请检查：');
    console.log('  1. 邮箱地址是否正确');
    console.log('  2. 授权码是否正确（不是登录密码）');
    console.log('  3. 网络是否可以访问 smtp.qq.com');
    process.exit(1);
  }

  console.log('✅ SMTP 连接成功\n');

  if (testAccumulation) {
    // 测试内容累积功能
    console.log('📚 测试邮件内容累积功能...\n');
    
    const historyCount = getEmailHistoryCount(config.to);
    console.log(`📎 当前历史邮件数量: ${historyCount}`);
    
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const testNumber = historyCount + 1;
    
    const result = await emailService.send({
      subject: `📚 Iris 数字分身 - 累积测试 #${testNumber}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
            📚 累积测试邮件 #${testNumber}
          </h1>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            这是第 ${testNumber} 封累积测试邮件。如果配置正确，这封邮件应该包含之前所有测试邮件的内容。
          </p>
          <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>测试时间：</strong>${now}
            </p>
            <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">
              <strong>历史邮件数：</strong>${historyCount}
            </p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            此邮件由 Iris 数字分身自动发送
          </p>
        </div>
      `,
      text: `累积测试邮件 #${testNumber}\n\n测试时间：${now}\n历史邮件数：${historyCount}`,
      useReplyChain: true,
      useContentAccumulation: true,
    });

    if (result.success) {
      console.log('✅ 累积测试邮件发送成功！');
      console.log(`📨 Message ID: ${result.messageId}`);
      console.log(`\n请检查 ${config.to} 的收件箱，确认邮件是否包含历史内容。`);
    } else {
      console.log('❌ 累积测试邮件发送失败');
      console.log(`错误: ${result.error}`);
      process.exit(1);
    }
  } else if (testReplyChain) {
    // 测试回复链功能
    console.log('🔗 测试邮件回复链功能...\n');
    
    const lastRecord = getLastMessageId(config.to);
    if (lastRecord) {
      console.log(`📎 找到上一封邮件: ${lastRecord.messageId}`);
      console.log(`   发送时间: ${lastRecord.sentAt}`);
      console.log(`   主题: ${lastRecord.subject}\n`);
    } else {
      console.log('📎 没有找到上一封邮件，将创建新的邮件线程\n');
    }

    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const result = await emailService.send({
      subject: `🔗 Iris 数字分身 - 回复链测试`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            🔗 回复链测试邮件
          </h1>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            这是一封回复链测试邮件。如果配置正确，这封邮件应该会出现在同一个邮件会话中。
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>测试时间：</strong>${now}
            </p>
            ${lastRecord ? `<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;"><strong>回复邮件：</strong>${lastRecord.messageId}</p>` : ''}
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            此邮件由 Iris 数字分身自动发送
          </p>
        </div>
      `,
      text: `回复链测试邮件\n\n测试时间：${now}`,
      useReplyChain: true,
    });

    if (result.success) {
      console.log('✅ 回复链测试邮件发送成功！');
      console.log(`📨 Message ID: ${result.messageId}`);
      console.log(`\n请检查 ${config.to} 的收件箱，确认邮件是否在同一会话中。`);
    } else {
      console.log('❌ 回复链测试邮件发送失败');
      console.log(`错误: ${result.error}`);
      process.exit(1);
    }
  } else {
    // 发送普通测试邮件
    console.log('⏳ 正在发送测试邮件...');
    const result = await emailService.sendTestEmail();

    if (result.success) {
      console.log('✅ 测试邮件发送成功！');
      console.log(`📨 Message ID: ${result.messageId}`);
      console.log(`\n请检查 ${config.to} 的收件箱（包括垃圾邮件文件夹）`);
    } else {
      console.log('❌ 测试邮件发送失败');
      console.log(`错误: ${result.error}`);
      process.exit(1);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 邮件服务配置完成！');
  console.log('💡 可用命令:');
  console.log('   npm run email:test              - 发送普通测试邮件');
  console.log('   npm run email:test -- --reply   - 测试回复链功能');
  console.log('   npm run email:test -- -a        - 测试内容累积功能');
  console.log('   npm run email:test -- --clear   - 清除历史记录');
  console.log('每天 18:00 将自动发送工作日报到您的邮箱。');
  console.log('='.repeat(50) + '\n');
}

main().catch(console.error);
