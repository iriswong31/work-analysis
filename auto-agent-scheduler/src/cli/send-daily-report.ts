#!/usr/bin/env tsx
/**
 * 发送日报邮件脚本
 * 读取指定日期的日报 Markdown 文件并发送邮件
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
import { emailService } from '../notification/email-service.js';
import { isEmailConfigured, getEmailConfig } from '../notification/email-config.js';

async function main() {
  const args = process.argv.slice(2);
  const dateArg = args[0] || new Date().toISOString().split('T')[0];
  
  console.log('\n📧 Iris 数字分身 - 发送日报邮件\n');
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
  console.log(`📅 日报日期: ${dateArg}`);
  console.log('='.repeat(50));

  // 读取日报文件
  const reportPath = path.join(
    process.cwd(),
    'data',
    'daily-reports',
    `${dateArg}.md`
  );

  if (!fs.existsSync(reportPath)) {
    console.log(`❌ 日报文件不存在: ${reportPath}`);
    process.exit(1);
  }

  const markdownContent = fs.readFileSync(reportPath, 'utf-8');
  console.log(`\n📄 已读取日报文件: ${reportPath}`);

  // 转换为 HTML
  const htmlBody = await marked(markdownContent);
  
  // 包装成完整的邮件 HTML
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📊 Iris 数字分身日报</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">${dateArg}</p>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${htmlBody}
        </div>
      </div>
      <div style="text-align: center; padding: 16px; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">此邮件由 Iris 数字分身自动发送</p>
        <p style="margin: 4px 0 0 0;">回复此邮件可提供反馈</p>
      </div>
    </div>
  `;

  // 测试连接
  console.log('\n⏳ 正在测试 SMTP 连接...');
  const connected = await emailService.testConnection();
  
  if (!connected) {
    console.log('❌ SMTP 连接失败');
    process.exit(1);
  }
  console.log('✅ SMTP 连接成功');

  // 发送邮件
  console.log('\n⏳ 正在发送日报邮件...');
  const result = await emailService.sendDailyReport(htmlContent, dateArg);

  if (result.success) {
    console.log('✅ 日报邮件发送成功！');
    console.log(`📨 Message ID: ${result.messageId}`);
    console.log(`\n请检查 ${config.to} 的收件箱。`);
  } else {
    console.log('❌ 日报邮件发送失败');
    console.log(`错误: ${result.error}`);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 日报发送完成！');
  console.log('='.repeat(50) + '\n');
}

main().catch(console.error);
