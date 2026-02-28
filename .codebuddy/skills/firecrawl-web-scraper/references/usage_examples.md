# Firecrawl 使用示例

## 基础使用场景

### 1. 快速爬取单个网页

```python
from scripts.firecrawl_scraper import quick_scrape

# 简单爬取
content = quick_scrape("https://example.com", api_key="your-api-key")
print(content)
```

### 2. 分析网页结构

```python
from scripts.firecrawl_scraper import analyze_page_structure

# 分析页面
analysis = analyze_page_structure("https://example.com")
print(f"标题: {analysis['title']}")
print(f"内容长度: {analysis['content_length']}")
print(f"链接数量: {analysis['links_count']}")
```

### 3. 批量爬取多个网页

```python
from scripts.firecrawl_scraper import FirecrawlScraper, export_results

scraper = FirecrawlScraper(api_key="your-api-key")

urls = [
    "https://example.com/page1",
    "https://example.com/page2", 
    "https://example.com/page3"
]

results = scraper.batch_scrape(urls, max_concurrent=3)
export_results(results, format='json', filename='batch_results.json')
```

## 高级使用场景

### 4. 提取特定内容

```python
# 只提取主要内容，排除导航和页脚
result = scraper.scrape_url(
    "https://example.com",
    main_content_only=True,
    exclude_tags=['nav', 'footer', 'aside', 'header']
)

# 包含链接和图片信息
result = scraper.scrape_url(
    "https://example.com",
    include_links=True,
    include_images=True
)
```

### 5. 提取所有链接

```python
# 提取页面所有链接
links = scraper.extract_links("https://example.com", include_internal=True)

for link in links:
    print(f"{link['type']}: {link['url']}")
```

### 6. 命令行批量处理

```bash
# 从文件读取URL列表批量爬取
python scripts/batch_scraper.py --urls urls.txt --api-key your-key --format json

# 爬取单个URL
python scripts/batch_scraper.py --url https://example.com --format markdown

# 包含链接和图片信息
python scripts/batch_scraper.py --urls urls.txt --include-links --include-images
```

## 实际应用案例

### 案例1: 新闻网站内容收集

```python
# 收集新闻网站的文章
news_urls = [
    "https://news.site.com/article1",
    "https://news.site.com/article2",
    "https://news.site.com/article3"
]

scraper = FirecrawlScraper(api_key="your-key")
results = scraper.batch_scrape(
    news_urls,
    main_content_only=True,
    exclude_tags=['nav', 'footer', 'sidebar', 'ad']
)

# 导出为Markdown格式便于阅读
export_results(results, format='markdown', filename='news_collection.md')
```

### 案例2: 竞品分析

```python
# 分析竞争对手网站结构
competitor_sites = [
    "https://competitor1.com",
    "https://competitor2.com", 
    "https://competitor3.com"
]

analysis_results = []
for url in competitor_sites:
    analysis = analyze_page_structure(url)
    analysis_results.append({
        'site': url,
        'title': analysis['title'],
        'content_length': analysis['content_length'],
        'links_count': analysis['links_count']
    })

# 生成分析报告
import json
with open('competitor_analysis.json', 'w') as f:
    json.dump(analysis_results, f, indent=2, ensure_ascii=False)
```

### 案例3: 文档站点爬取

```python
# 爬取技术文档网站
doc_urls = [
    "https://docs.example.com/guide/intro",
    "https://docs.example.com/guide/setup",
    "https://docs.example.com/api/reference"
]

results = scraper.batch_scrape(
    doc_urls,
    include_links=True,  # 获取相关链接
    main_content_only=True
)

# 按标题组织内容
organized_docs = {}
for result in results:
    if result.success:
        organized_docs[result.title] = {
            'url': result.url,
            'content': result.content,
            'related_links': result.links
        }

# 保存为结构化JSON
with open('documentation.json', 'w', encoding='utf-8') as f:
    json.dump(organized_docs, f, indent=2, ensure_ascii=False)
```

## 错误处理示例

### 处理失败的请求

```python
results = scraper.batch_scrape(urls)

# 分离成功和失败的结果
successful = [r for r in results if r.success]
failed = [r for r in results if not r.success]

print(f"成功: {len(successful)}, 失败: {len(failed)}")

# 重试失败的URL
if failed:
    print("重试失败的URL...")
    retry_urls = [r.url for r in failed]
    retry_results = scraper.batch_scrape(retry_urls, max_concurrent=1)
    
    # 合并结果
    all_results = successful + retry_results
```

### 处理大量URL

```python
def process_large_url_list(urls, batch_size=50):
    """分批处理大量URL"""
    all_results = []
    
    for i in range(0, len(urls), batch_size):
        batch = urls[i:i+batch_size]
        print(f"处理批次 {i//batch_size + 1}: {len(batch)} 个URL")
        
        batch_results = scraper.batch_scrape(batch)
        all_results.extend(batch_results)
        
        # 批次间暂停
        time.sleep(2)
    
    return all_results

# 使用示例
large_url_list = ["https://example.com/page{}".format(i) for i in range(1, 501)]
results = process_large_url_list(large_url_list)
```

## 性能优化技巧

### 1. 控制并发数量

```python
# 根据API限制调整并发数
results = scraper.batch_scrape(urls, max_concurrent=3)  # 保守设置
```

### 2. 内容长度控制

```python
def truncate_content(results, max_length=2000):
    """截断过长的内容"""
    for result in results:
        if len(result.content) > max_length:
            result.content = result.content[:max_length] + "...[截断]"
    return results
```

### 3. 选择性导出

```python
# 只导出成功的结果
successful_results = [r for r in results if r.success]
export_results(successful_results, format='json')
```