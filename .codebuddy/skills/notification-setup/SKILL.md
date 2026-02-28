---
name: notification-setup
description: 指导用户配置企业微信群机器人 Webhook 和邮箱 SMTP 推送服务。当用户需要设置消息通知、日报推送、企业微信机器人、邮件发送等功能时使用此 Skill。
---

# 通知推送配置指南

本 Skill 用于指导配置企业微信群机器人和邮箱 SMTP 推送服务，实现自动化消息通知。

## 使用场景

- 配置数字分身日报推送
- 设置企业微信群机器人通知
- 配置邮件自动发送服务
- 需要多渠道消息推送时

## 配置流程

### 一、企业微信群机器人配置

#### 1. 创建群机器人

1. 打开企业微信桌面客户端
2. 进入目标群聊（或新建一个群）
3. 点击群聊右上角「...」→「添加群机器人」
4. 点击「新创建一个机器人」
5. 输入机器人名称（如：Iris 数字分身）
6. 点击「添加」完成创建

#### 2. 获取 Webhook URL

创建成功后会显示 Webhook 地址，格式如下：
```
https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**重要**：妥善保存此 URL，不要泄露给他人。

#### 3. 测试机器人

使用 curl 命令测试：
```bash
curl 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"msgtype": "text", "text": {"content": "Hello from Iris!"}}'
```

#### 4. 消息格式参考

企业微信机器人支持多种消息类型：

**文本消息**：
```json
{
  "msgtype": "text",
  "text": {
    "content": "消息内容",
    "mentioned_list": ["@all"]
  }
}
```

**Markdown 消息**（推荐用于日报）：
```json
{
  "msgtype": "markdown",
  "markdown": {
    "content": "# 今日工作报告\n> 完成任务: 3/5\n\n**主要成果**：\n- 完成功能A开发\n- 修复Bug若干"
  }
}
```

---

### 二、邮箱 SMTP 配置

#### 1. QQ 邮箱配置

1. 登录 [mail.qq.com](https://mail.qq.com)
2. 点击「设置」→「账户」
3. 找到「POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务」
4. 开启「IMAP/SMTP服务」
5. 按提示发送短信验证
6. 获取**授权码**（16位字母，不是登录密码）

**QQ 邮箱 SMTP 配置**：
- 服务器：`smtp.qq.com`
- 端口：`465`（SSL）或 `587`（TLS）
- 用户名：完整邮箱地址
- 密码：授权码（非登录密码）

#### 2. 163 邮箱配置

1. 登录 [mail.163.com](https://mail.163.com)
2. 点击「设置」→「POP3/SMTP/IMAP」
3. 开启「IMAP/SMTP服务」
4. 设置**客户端授权密码**

**163 邮箱 SMTP 配置**：
- 服务器：`smtp.163.com`
- 端口：`465`（SSL）或 `25`
- 用户名：完整邮箱地址
- 密码：客户端授权密码

#### 3. Gmail 配置

1. 登录 Google 账号
2. 前往 [安全设置](https://myaccount.google.com/security)
3. 开启「两步验证」
4. 生成「应用专用密码」

**Gmail SMTP 配置**：
- 服务器：`smtp.gmail.com`
- 端口：`587`（TLS）或 `465`（SSL）
- 用户名：完整 Gmail 地址
- 密码：应用专用密码

---

### 三、配置到项目

获取上述信息后，需要将配置添加到项目的 `.env` 文件中：

```bash
# 企业微信机器人
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY

# 邮箱 SMTP 配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@qq.com
SMTP_PASS=your_authorization_code
SMTP_FROM=your_email@qq.com
SMTP_TO=recipient@example.com
```

---

## 安全提醒

1. **不要将敏感信息提交到 Git**：确保 `.env` 文件已添加到 `.gitignore`
2. **定期更换授权码**：建议每 3-6 个月更换一次
3. **Webhook URL 保密**：不要在公开场合分享
4. **使用环境变量**：生产环境使用系统环境变量而非文件

---

## 常见问题

### Q: 企业微信机器人发送失败？
A: 检查 Webhook URL 是否正确，确保网络可访问企业微信服务器。

### Q: 邮件发送失败提示认证错误？
A: 确认使用的是**授权码**而非登录密码。

### Q: 邮件发送成功但收不到？
A: 检查垃圾邮件文件夹，或尝试更换收件邮箱测试。

### Q: 如何测试邮件配置？
A: 使用以下 Node.js 代码测试：
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: process.env.SMTP_TO,
  subject: '测试邮件',
  text: 'Hello from Iris!',
});
```
