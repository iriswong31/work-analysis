# Firecrawl API 参考文档

## API 密钥配置

获取 Firecrawl API 密钥：
1. 访问 [Firecrawl.dev](https://firecrawl.dev)
2. 注册账户并获取API密钥
3. 在脚本中设置 `api_key` 参数

## 核心API端点

### /v0/scrape - 单页爬取

**请求格式:**
```json
{
  "url": "https://example.com",
  "formats": ["markdown", "html"],
  "includeTags": ["main", "article"],
  "excludeTags": ["nav", "footer", "aside"],
  "onlyMainContent": true,
  "waitFor": 0
}
```

**响应格式:**
```json
{
  "success": true,
  "data": {
    "markdown": "# 页面标题\n\n页面内容...",
    "html": "<html>...</html>",
    "metadata": {
      "title": "页面标题",
      "description": "页面描述",
      "language": "zh-CN",
      "sourceURL": "https://example.com"
    },
    "links": ["https://example.com/page1", "https://example.com/page2"]
  }
}
```

### /v0/crawl - 批量爬取

**请求格式:**
```json
{
  "url": "https://example.com",
  "crawlerOptions": {
    "includes": ["blog/*"],
    "excludes": ["admin/*"],
    "maxDepth": 2,
    "limit": 100
  },
  "pageOptions": {
    "onlyMainContent": true,
    "formats": ["markdown"]
  }
}
```

## 高级配置选项

### 内容过滤

- `includeTags`: 包含的HTML标签
- `excludeTags`: 排除的HTML标签  
- `onlyMainContent`: 只提取主要内容
- `removeBase64Images`: 移除base64图片

### 等待和延迟

- `waitFor`: 页面加载等待时间(毫秒)
- `timeout`: 请求超时时间
- `delay`: 请求间隔延迟

### 输出格式

- `markdown`: 清理后的Markdown格式
- `html`: 原始HTML内容
- `text`: 纯文本内容
- `links`: 提取的链接列表
- `screenshot`: 页面截图(base64)

## 错误处理

### 常见错误码

- `400`: 请求参数错误
- `401`: API密钥无效
- `403`: 配额不足或权限不够
- `404`: 页面不存在
- `429`: 请求频率超限
- `500`: 服务器内部错误

### 重试策略

```python
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session_with_retries():
    session = requests.Session()
    
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    return session
```

## 性能优化建议

### 1. 批量处理
- 使用并发请求但控制并发数量(建议3-5个)
- 添加请求间隔避免触发限制

### 2. 内容优化
- 使用 `onlyMainContent=true` 减少无关内容
- 排除不需要的标签(nav, footer, aside)
- 限制内容长度避免上下文溢出

### 3. 缓存策略
- 对相同URL的结果进行本地缓存
- 设置合理的缓存过期时间

### 4. 错误处理
- 实现指数退避重试机制
- 记录失败的URL便于后续处理
- 设置合理的超时时间

## 使用限制

### 免费版限制
- 每月500次请求
- 每分钟10次请求
- 单次请求超时30秒

### 付费版特性
- 更高的请求配额
- 更快的处理速度
- 优先级处理
- 高级功能(截图、PDF生成等)

## 最佳实践

1. **API密钥安全**: 不要在代码中硬编码API密钥
2. **请求频率**: 遵守API限制，避免被封禁
3. **内容处理**: 对爬取的内容进行适当清理和格式化
4. **错误监控**: 记录和监控爬取失败的情况
5. **数据存储**: 合理组织和存储爬取的数据