# 豆包视觉 API 参考文档

## API 基础信息

- **基础 URL**: `https://ark.cn-beijing.volces.com/api/v3`
- **认证方式**: Bearer Token (API Key)
- **请求格式**: JSON
- **响应格式**: JSON

## 认证

所有 API 请求需要在 Header 中携带 API Key：

```http
Authorization: Bearer {ARK_API_KEY}
Content-Type: application/json
```

## 视觉分析端点

### POST /chat/completions

多模态对话接口，支持图片+文本输入。

#### 请求体

```json
{
    "model": "ep-20260121005507-nl4gw",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "图片URL或base64"
                    }
                },
                {
                    "type": "text",
                    "text": "你的问题"
                }
            ]
        }
    ],
    "max_tokens": 1024,
    "temperature": 0.7
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 是 | 模型 endpoint ID |
| messages | array | 是 | 对话消息列表 |
| max_tokens | integer | 否 | 最大生成 token 数 |
| temperature | float | 否 | 采样温度 (0-1) |
| top_p | float | 否 | 核采样参数 |
| stream | boolean | 否 | 是否流式输出 |

#### 图片输入格式

**1. URL 方式**
```json
{
    "type": "image_url",
    "image_url": {
        "url": "https://example.com/image.jpg"
    }
}
```

**2. Base64 方式**
```json
{
    "type": "image_url",
    "image_url": {
        "url": "data:image/jpeg;base64,/9j/4AAQ..."
    }
}
```

#### 响应格式

```json
{
    "id": "chatcmpl-xxx",
    "object": "chat.completion",
    "created": 1706000000,
    "model": "ep-20260121005507-nl4gw",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "这张图片展示了..."
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 100,
        "completion_tokens": 50,
        "total_tokens": 150
    }
}
```

## 错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 401 | 认证失败 | 检查 API Key 是否正确 |
| 400 | 请求参数错误 | 检查请求体格式 |
| 413 | 图片太大 | 压缩图片或减小分辨率 |
| 429 | 请求频率超限 | 降低请求频率 |
| 500 | 服务器错误 | 稍后重试 |

## 使用限制

- **图片大小**: 最大 20MB
- **支持格式**: JPEG, PNG, GIF, WebP, BMP
- **请求频率**: 根据套餐不同有所限制
- **并发数**: 建议控制在 5 以内

## 最佳实践

### 1. 图片预处理

```python
from PIL import Image

def optimize_image(image_path, max_size=1920):
    """优化图片尺寸，减少 API 调用时间"""
    img = Image.open(image_path)
    if max(img.size) > max_size:
        ratio = max_size / max(img.size)
        new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    return img
```

### 2. 错误重试

```python
import time
from functools import wraps

def retry(max_attempts=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt < max_attempts - 1:
                        time.sleep(delay * (attempt + 1))
                    else:
                        raise
        return wrapper
    return decorator
```

### 3. 批量处理优化

```python
from concurrent.futures import ThreadPoolExecutor

def batch_analyze(images, max_workers=3):
    """控制并发数，避免触发限流"""
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(analyze_single, images))
    return results
```

## curl 示例

### 基础调用

```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ep-20260121005507-nl4gw",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/test.jpg"
            }
          },
          {
            "type": "text",
            "text": "描述这张图片"
          }
        ]
      }
    ]
  }'
```

### 流式输出

```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ep-20260121005507-nl4gw",
    "stream": true,
    "messages": [...]
  }'
```
