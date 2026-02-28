#!/usr/bin/env python3
"""
长租公寓内容分析脚本
"""

import sys
import os
sys.path.append('scripts')

from firecrawl_scraper import FirecrawlScraper
import json
from datetime import datetime

def analyze_apartment_content():
    """分析长租公寓相关内容"""
    
    # 初始化
    api_key = 'fc-2439b2b6ae0449dba6cb7f1066436122'
    scraper = FirecrawlScraper(api_key)
    
    # 长租公寓相关URL
    urls = [
        'https://www.163.com/dy/article/JU51OFUI0556CZ36.html',
        'https://www.sohu.com/a/895457847_122423553'
    ]
    
    print('🚀 开始分析长租公寓内容...')
    
    # 抓取内容
    results = []
    for i, url in enumerate(urls, 1):
        print(f'📊 正在分析第 {i}/{len(urls)} 个内容源...')
        try:
            result = scraper.scrape_url(url)
            if result.success:
                results.append({
                    'url': url,
                    'title': result.title or f'内容源 {i}',
                    'content': result.content[:2000] + '...' if len(result.content) > 2000 else result.content,
                    'success': True
                })
                print(f'✅ 成功: {result.title}')
            else:
                print(f'❌ 失败: {result.error}')
                results.append({
                    'url': url,
                    'title': f'内容源 {i}',
                    'error': result.error,
                    'success': False
                })
        except Exception as e:
            print(f'❌ 错误: {str(e)}')
            results.append({
                'url': url,
                'title': f'内容源 {i}',
                'error': str(e),
                'success': False
            })
    
    # 保存结果
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f'apartment_analysis_{timestamp}.json'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f'\n📈 分析完成！')
    print(f'📄 结果保存到: {output_file}')
    print(f'✅ 成功分析: {sum(1 for r in results if r.get("success"))} 个')
    print(f'❌ 分析失败: {sum(1 for r in results if not r.get("success"))} 个')
    
    return results

if __name__ == '__main__':
    analyze_apartment_content()