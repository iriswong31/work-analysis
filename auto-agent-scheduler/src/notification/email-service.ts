/**
 * 邮件发送服务
 * 封装 nodemailer 提供邮件发送能力
 * 支持邮件回复链功能和内容累积功能
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getEmailConfig, isEmailConfigured, type EmailConfig } from './email-config.js';
import { getLastMessageId, saveMessageId, type MessageIdRecord } from './message-id-store.js';
import { getEmailHistory, saveEmailToHistory, type EmailHistoryRecord } from './email-history.js';
import { buildAccumulatedContent, buildAccumulatedText } from './email-content-builder.js';
import { logger } from '../utils/logger.js';

export interface EmailOptions {
  subject: string;
  html: string;
  text?: string;
  /** 是否使用回复链模式（回复上一封邮件） */
  useReplyChain?: boolean;
  /** 是否使用内容累积模式（包含历史邮件内容） */
  useContentAccumulation?: boolean;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;

  /**
   * 初始化邮件传输器
   */
  private initialize(): void {
    if (this.transporter) return;

    if (!isEmailConfigured()) {
      logger.warn('邮件服务未配置，请检查 .env 文件中的 SMTP 配置');
      return;
    }

    this.config = getEmailConfig();
    
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.auth.user,
        pass: this.config.auth.pass,
      },
    });

    logger.info(`邮件服务已初始化: ${this.config.host}:${this.config.port}`);
  }

  /**
   * 测试邮件连接
   */
  async testConnection(): Promise<boolean> {
    this.initialize();
    
    if (!this.transporter) {
      logger.error('邮件服务未初始化');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('邮件服务连接测试成功');
      return true;
    } catch (error) {
      logger.error('邮件服务连接测试失败:', error);
      return false;
    }
  }

  /**
   * 发送邮件
   */
  async send(options: EmailOptions): Promise<SendResult> {
    this.initialize();

    if (!this.transporter || !this.config) {
      return {
        success: false,
        error: '邮件服务未配置或初始化失败',
      };
    }

    try {
      // 准备邮件内容
      let finalHtml = options.html;
      let finalText = options.text;
      const originalHtml = options.html;  // 保存原始内容用于历史记录

      // 如果启用内容累积模式，拼接历史内容
      if (options.useContentAccumulation) {
        const historyRecords = getEmailHistory(this.config.to);
        if (historyRecords.length > 0) {
          finalHtml = buildAccumulatedContent(options.html, historyRecords);
          if (options.text) {
            finalText = buildAccumulatedText(options.text, historyRecords);
          }
          logger.info(`已拼接 ${historyRecords.length} 条历史邮件内容`);
        }
      }

      // 构建邮件选项
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"Iris 数字分身" <${this.config.from}>`,
        to: this.config.to,
        subject: options.subject,
        text: finalText,
        html: finalHtml,
      };

      // 如果启用回复链模式，设置 In-Reply-To 和 References 头部
      if (options.useReplyChain) {
        const lastRecord = getLastMessageId(this.config.to);
        if (lastRecord) {
          mailOptions.inReplyTo = lastRecord.messageId;
          mailOptions.references = lastRecord.messageId;
          logger.info(`使用回复链模式，回复邮件: ${lastRecord.messageId}`);
        } else {
          logger.info('没有找到上一封邮件，将创建新的邮件线程');
        }
      }

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`邮件发送成功: ${info.messageId}`);

      // 如果启用回复链模式，保存当前邮件的 Message-ID
      if (options.useReplyChain && info.messageId) {
        const record: MessageIdRecord = {
          messageId: info.messageId,
          sentAt: new Date().toISOString(),
          subject: options.subject,
          recipient: this.config.to,
        };
        saveMessageId(record);
      }

      // 如果启用内容累积模式，保存当前邮件到历史记录
      if (options.useContentAccumulation) {
        const historyRecord: EmailHistoryRecord = {
          timestamp: new Date().toISOString(),
          subject: options.subject,
          htmlContent: originalHtml,  // 保存原始内容，不包含历史
          recipient: this.config.to,
        };
        saveEmailToHistory(historyRecord);
      }
      
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('邮件发送失败:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 发送日报邮件（使用回复链模式和内容累积模式）
   */
  async sendDailyReport(htmlContent: string, date: string): Promise<SendResult> {
    return this.send({
      subject: `📊 Iris 数字分身日报 - ${date}`,
      html: htmlContent,
      text: `Iris 数字分身日报 - ${date}\n\n请查看 HTML 版本以获得更好的阅读体验。`,
      useReplyChain: true,           // 启用回复链模式
      useContentAccumulation: true,  // 启用内容累积模式
    });
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(): Promise<SendResult> {
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    return this.send({
      subject: '🔔 Iris 数字分身 - 邮件服务测试',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
            ✅ 邮件服务配置成功
          </h1>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            恭喜！您的邮件推送服务已成功配置。
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>测试时间：</strong>${now}
            </p>
          </div>
          <p style="color: #4b5563; font-size: 14px;">
            从现在起，您将在每天 18:00 收到 Iris 数字分身的工作日报。
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            此邮件由 Iris 数字分身自动发送
          </p>
        </div>
      `,
      text: `邮件服务配置成功！\n\n测试时间：${now}\n\n从现在起，您将在每天 18:00 收到 Iris 数字分身的工作日报。`,
    });
  }
}

export const emailService = new EmailService();
