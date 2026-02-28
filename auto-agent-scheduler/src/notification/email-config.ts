/**
 * 邮箱 SMTP 配置
 */

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  to: string;
}

export function getEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
    to: process.env.SMTP_TO || process.env.SMTP_USER || '',
  };
}

export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  return !!(config.auth.user && config.auth.pass);
}
