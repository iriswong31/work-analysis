---
name: text-generation
description: 文生文 AI 工具，基于火山方舟 API 提供通用文本生成能力。适用于任务拆解、内容生成、文本分析、摘要提取等所有需要 AI 文本理解与生成的场景。
---

# 文生文 (Text Generation)

本 Skill 提供基于火山方舟 API 的通用文本生成能力，所有需要 AI 文本理解和生成的场景都可以调用。

## 核心能力

### 1. 任务拆解
- 将模糊灵感拆解为具体可执行的子任务
- 智能分析任务依赖关系和执行顺序

### 2. 内容生成
- 文案撰写、报告生成、邮件起草
- 批量脚本生成、创意内容产出

### 3. 文本分析
- 摘要提取、关键信息识别
- 文本分类、情感分析
- 结构化信息提取

### 4. 对话问答
- 通用问答、知识查询
- 代码解释、技术咨询

## API 配置

### 环境变量

在项目根目录 `.env` 文件中：

```bash
# 火山方舟 API 配置（文生文）
ARK_API_KEY=your_api_key_here
ARK_TEXT_MODEL=ep-your-text-endpoint-id
```

### 关键参数

| 参数 | 值 |
|------|-----|
| **基础 URL** | `https://ark.cn-beijing.volces.com/api/v3` |
| **API 路径** | `/chat/completions` |
| **认证方式** | `Authorization: Bearer {ARK_API_KEY}` |
| **文本模型** | `ep-20260226111445-6bhjn`（DeepSeek-V3） |
| **视觉模型** | `ep-20260121005507-nl4gw`（豆包视觉，见 doubao-vision skill） |

> **注意**：`ARK_API_KEY` 与 doubao-vision skill 共用同一个 Key，只是模型接入点不同。

## 使用方式

### 方式一：curl 命令

```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ep-20260226111445-6bhjn",
    "messages": [
      {"role": "system", "content": "你是一个helpful assistant"},
      {"role": "user", "content": "你的问题"}
    ],
    "temperature": 0.7,
    "max_tokens": 2000
  }'
```

### 方式二：前端 fetch 调用

```typescript
const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'ep-20260226111445-6bhjn',
    messages: [
      { role: 'system', content: '你是一个helpful assistant' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  }),
});
const data = await response.json();
const reply = data.choices[0].message.content;
```

### 方式三：Python 调用

```python
import os
import requests

API_KEY = os.getenv("ARK_API_KEY")
MODEL = os.getenv("ARK_TEXT_MODEL", "ep-20260226111445-6bhjn")
BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"

def chat(prompt, system="你是一个helpful assistant", temperature=0.7, max_tokens=2000):
    response = requests.post(
        f"{BASE_URL}/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        },
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]
```

## 使用场景触发词

- "帮我拆解这个任务"
- "生成一段文案"
- "总结这段内容"
- "帮我写一封邮件"
- "分析这段文本"
- 任何需要 AI 文本生成的场景

## 与其他 Skill 的关系

| Skill | 用途 | 共享配置 |
|-------|------|---------|
| **text-generation（本 skill）** | 文本生成/理解/拆解 | `ARK_API_KEY` |
| **doubao-vision** | 图片识别/分析 | `ARK_API_KEY` |

两个 skill 共用同一个火山方舟 API Key，只是模型接入点不同。

## 常见问题

### Q: 跟 doubao-vision 有什么区别？
A: doubao-vision 处理**图片**（需要视觉模型），本 skill 处理**纯文本**（用文本模型，更快更便宜）。

### Q: 免费额度够用吗？
A: 火山方舟每个模型接入点有 50 万 tokens 免费额度，日常任务拆解、文案生成等绰绰有余。

### Q: API 调用失败？
A: 检查：
1. API Key 是否正确（`.env` 中的 `ARK_API_KEY`）
2. 接入点 ID 是否正确（`ep-20260226111445-6bhjn`）
3. 网络是否可访问 `ark.cn-beijing.volces.com`
