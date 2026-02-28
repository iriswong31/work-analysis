#!/usr/bin/env python3
"""
Firecrawl Web Scraper - Core scraping utilities
High-performance web scraping with minimal context overhead
"""

import requests
import json
import time
import csv
from typing import List, Dict, Optional, Union
from urllib.parse import urljoin, urlparse
import concurrent.futures
from dataclasses import dataclass


@dataclass
class ScrapingResult:
    """结构化的爬取结果"""
    url: str
    title: str
    content: str
    metadata: Dict
    links: List[str] = None
    images: List[str] = None
    tables: List[Dict] = None
    success: bool = True
    error: str = None


class FirecrawlScraper:
    """Firecrawl API 客户端"""
    
    def __init__(self, api_key: str = None, base_url: str = "https://api.firecrawl.dev"):
        self.api_key = api_key or "fc-your-api-key-here"  # 用户需要替换
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        })
    
    def scrape_url(self, url: str, **kwargs) -> ScrapingResult:
        """爬取单个URL"""
        try:
            payload = {
                'url': url,
                'formats': ['markdown', 'html'],
                'includeTags': kwargs.get('include_tags', []),
                'excludeTags': kwargs.get('exclude_tags', ['nav', 'footer']),
                'onlyMainContent': kwargs.get('main_content_only', True)
            }
            
            response = self.session.post(f"{self.base_url}/v0/scrape", json=payload)
            response.raise_for_status()
            
            response_data = response.json()
            
            # Firecrawl API 返回格式: {success: true, data: {markdown: ..., metadata: ...}}
            if response_data.get('success') and 'data' in response_data:
                data = response_data['data']
                
                return ScrapingResult(
                    url=url,
                    title=data.get('metadata', {}).get('title', ''),
                    content=data.get('markdown', ''),
                    metadata=data.get('metadata', {}),
                    links=self._extract_links(data) if kwargs.get('include_links') else None,
                    images=self._extract_images(data) if kwargs.get('include_images') else None
                )
            else:
                # API 调用失败
                error_msg = response_data.get('error', 'Unknown API error')
                return ScrapingResult(
                    url=url, title='', content='', metadata={},
                    success=False, error=error_msg
                )
            
        except Exception as e:
            return ScrapingResult(
                url=url, title='', content='', metadata={},
                success=False, error=str(e)
            )
    
    def batch_scrape(self, urls: List[str], max_concurrent: int = 3, **kwargs) -> List[ScrapingResult]:
        """批量爬取多个URL"""
        results = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_concurrent) as executor:
            future_to_url = {
                executor.submit(self.scrape_url, url, **kwargs): url 
                for url in urls
            }
            
            for future in concurrent.futures.as_completed(future_to_url):
                result = future.result()
                results.append(result)
                
                # 添加延迟避免API限制
                time.sleep(0.5)
        
        return results
    
    def extract_tables(self, url: str) -> List[Dict]:
        """提取页面中的表格数据"""
        result = self.scrape_url(url, include_tags=['table'])
        
        # 这里可以添加表格解析逻辑
        # 实际实现需要解析HTML中的table元素
        tables = []
        # TODO: 实现表格提取逻辑
        
        return tables
    
    def extract_links(self, url: str, include_internal: bool = True) -> List[Dict]:
        """提取页面中的所有链接"""
        result = self.scrape_url(url, include_links=True)
        
        if not result.success:
            return []
        
        links = []
        base_domain = urlparse(url).netloc
        
        for link in result.links or []:
            link_domain = urlparse(link).netloc
            is_internal = link_domain == base_domain or not link_domain
            
            if include_internal or not is_internal:
                links.append({
                    'url': link,
                    'type': 'internal' if is_internal else 'external',
                    'domain': link_domain
                })
        
        return links
    
    def _extract_links(self, data: Dict) -> List[str]:
        """从Firecrawl响应中提取链接"""
        links = []
        if 'links' in data:
            links.extend(data['links'])
        return links
    
    def _extract_images(self, data: Dict) -> List[str]:
        """从Firecrawl响应中提取图片"""
        images = []
        # TODO: 实现图片提取逻辑
        return images


def export_results(results: List[ScrapingResult], format: str = 'json', filename: str = None):
    """导出爬取结果"""
    if not filename:
        filename = f"scraping_results.{format}"
    
    if format == 'json':
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump([{
                'url': r.url,
                'title': r.title,
                'content': r.content[:1000] + '...' if len(r.content) > 1000 else r.content,
                'metadata': r.metadata,
                'success': r.success,
                'error': r.error
            } for r in results], f, ensure_ascii=False, indent=2)
    
    elif format == 'csv':
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['URL', 'Title', 'Content Preview', 'Success', 'Error'])
            
            for r in results:
                content_preview = r.content[:200] + '...' if len(r.content) > 200 else r.content
                writer.writerow([r.url, r.title, content_preview, r.success, r.error or ''])
    
    elif format == 'markdown':
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("# Scraping Results\n\n")
            
            for i, r in enumerate(results, 1):
                f.write(f"## {i}. {r.title or 'Untitled'}\n\n")
                f.write(f"**URL:** {r.url}\n\n")
                f.write(f"**Status:** {'✅ Success' if r.success else '❌ Failed'}\n\n")
                
                if r.error:
                    f.write(f"**Error:** {r.error}\n\n")
                
                if r.content:
                    f.write("**Content:**\n\n")
                    f.write(r.content[:2000] + ('...' if len(r.content) > 2000 else ''))
                    f.write("\n\n---\n\n")


# 便捷函数
def quick_scrape(url: str, api_key: str = None) -> str:
    """快速爬取单个URL，返回清理后的文本内容"""
    scraper = FirecrawlScraper(api_key)
    result = scraper.scrape_url(url)
    
    if result.success:
        return result.content
    else:
        return f"爬取失败: {result.error}"


def analyze_page_structure(url: str, api_key: str = None) -> Dict:
    """分析页面结构"""
    scraper = FirecrawlScraper(api_key)
    result = scraper.scrape_url(url, include_links=True, include_images=True)
    
    if not result.success:
        return {'error': result.error}
    
    return {
        'title': result.title,
        'content_length': len(result.content),
        'links_count': len(result.links) if result.links else 0,
        'images_count': len(result.images) if result.images else 0,
        'metadata': result.metadata
    }


if __name__ == "__main__":
    # 示例用法
    scraper = FirecrawlScraper()
    
    # 单个URL爬取
    result = scraper.scrape_url("https://example.com")
    print(f"Title: {result.title}")
    print(f"Content length: {len(result.content)}")
    
    # 批量爬取
    urls = ["https://example.com", "https://httpbin.org/html"]
    results = scraper.batch_scrape(urls)
    
    # 导出结果
    export_results(results, format='json')
    print("Results exported to scraping_results.json")