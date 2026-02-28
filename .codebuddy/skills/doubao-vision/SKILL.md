---
name: doubao-vision
description: 豆包视觉 AI 工具，提供图片识别、图片分析和图像理解能力。当用户需要分析图片内容、识别图片中的物体/文字/场景、或进行图片问答时使用此 Skill。
---

# 豆包视觉 AI (Doubao Vision)

本 Skill 提供基于豆包 API 的视觉 AI 能力，支持图片识别、内容分析和视觉问答。

## 核心能力

### 1. 图片识别与分析
- **物体识别**: 识别图片中的物体、人物、动物等
- **场景理解**: 分析图片的场景、环境、氛围
- **文字识别 (OCR)**: 提取图片中的文字内容
- **图表分析**: 解读图表、流程图、架构图等

### 2. 视觉问答
根据图片内容回答问题，支持：
- 描述图片内容
- 分析图片细节
- 比较多张图片
- 提取结构化信息

## 使用场景

触发此 Skill 的典型请求：
- "帮我分析这张图片"
- "识别图片中的文字"
- "这张图片里有什么？"
- "解读这个流程图/架构图"
- "比较这两张图片的差异"

## API 配置

### 环境变量设置

在项目根目录创建或编辑 `.env` 文件：

```bash
# 豆包 API 配置
ARK_API_KEY=your_api_key_here
DOUBAO_MODEL=ep-20260121005507-nl4gw
```

或在终端临时设置：
```bash
export ARK_API_KEY="your_api_key_here"
```

### API 端点

- **基础 URL**: `https://ark.cn-beijing.volces.com/api/v3`
- **视觉模型**: `ep-20260121005507-nl4gw`

## 快速开始

### 方式一：使用 Python 脚本

```bash
# 分析本地图片
python scripts/vision_analyzer.py --image /path/to/image.jpg --question "描述这张图片"

# 分析网络图片
python scripts/vision_analyzer.py --url "https://example.com/image.jpg" --question "图片中有什么？"

# OCR 文字识别
python scripts/vision_analyzer.py --image /path/to/image.jpg --ocr
```

### 方式二：使用 curl 命令

```bash
# 分析网络图片
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "ep-20260121005507-nl4gw",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/image.jpg"
            }
          },
          {
            "type": "text",
            "text": "描述这张图片的内容"
          }
        ]
      }
    ]
  }'
```

### 方式三：Python SDK

```python
from scripts.vision_analyzer import DoubaoVision

# 初始化
vision = DoubaoVision(api_key="your_api_key")

# 分析图片
result = vision.analyze_image(
    image_path="/path/to/image.jpg",
    question="这张图片中有什么？"
)
print(result)

# OCR 识别
text = vision.extract_text("/path/to/document.png")
print(text)
```

## 脚本说明

### scripts/vision_analyzer.py

核心视觉分析脚本，提供 `DoubaoVision` 类：

```python
class DoubaoVision:
    def analyze_image(image_path, question)  # 分析本地图片
    def analyze_url(image_url, question)     # 分析网络图片
    def extract_text(image_path)             # OCR 文字提取
    def describe_image(image_path)           # 生成图片描述
```

### scripts/batch_analyzer.py

批量图片分析脚本，支持：
- 批量处理文件夹中的图片
- 输出 JSON/Markdown 格式报告
- 自动生成图片描述

## 支持的图片格式

- JPEG/JPG
- PNG
- GIF (静态)
- WebP
- BMP

## 图片输入方式

1. **本地文件**: 自动转换为 base64 编码
2. **网络 URL**: 直接传入图片 URL
3. **Base64 字符串**: 支持 data URI 格式

## 最佳实践

### 提高识别准确率

1. **图片质量**: 使用清晰、光线充足的图片
2. **合适尺寸**: 建议分辨率 512x512 以上
3. **明确问题**: 问题越具体，回答越准确

### 问题提示词示例

| 场景 | 推荐提示词 |
|------|-----------|
| 通用描述 | "详细描述这张图片的内容" |
| 物体识别 | "列出图片中所有可识别的物体" |
| 场景分析 | "这是什么场景？描述环境特征" |
| 文字提取 | "提取图片中的所有文字内容" |
| 图表解读 | "解读这个图表，说明关键数据点" |
| 比较分析 | "比较这两张图片的主要差异" |

## 常见问题

### Q: API 调用失败？
A: 检查：
1. API Key 是否正确设置
2. 网络是否可访问 `ark.cn-beijing.volces.com`
3. 模型 endpoint ID 是否正确

### Q: 图片无法识别？
A: 确保：
1. 图片格式受支持
2. 图片大小不超过限制 (通常 20MB)
3. 图片 URL 可公开访问（如果使用 URL 方式）

### Q: 如何提高 OCR 准确率？
A: 建议：
1. 使用高清扫描件
2. 保持文字方向正确
3. 避免复杂背景干扰

## 安全提醒

1. **API Key 保密**: 不要将 API Key 提交到代码仓库
2. **添加 .gitignore**: 确保 `.env` 文件被忽略
3. **敏感图片**: 注意图片内容的隐私和合规性
