#!/usr/bin/env python3
"""
批量网页爬取工具
支持从文件读取URL列表，批量爬取并导出结果
"""

import argparse
import sys
from pathlib import Path
from firecrawl_scraper import FirecrawlScraper, export_results


def read_urls_from_file(file_path: str) -> list:
    """从文件读取URL列表"""
    urls = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                urls.append(line)
    return urls


def main():
    parser = argparse.ArgumentParser(description='批量网页爬取工具')
    parser.add_argument('--urls', '-u', help='URL列表文件路径')
    parser.add_argument('--url', help='单个URL')
    parser.add_argument('--api-key', '-k', help='Firecrawl API密钥')
    parser.add_argument('--output', '-o', default='results', help='输出文件前缀')
    parser.add_argument('--format', '-f', choices=['json', 'csv', 'markdown'], 
                       default='json', help='输出格式')
    parser.add_argument('--concurrent', '-c', type=int, default=3, 
                       help='并发数量')
    parser.add_argument('--include-links', action='store_true', 
                       help='包含链接信息')
    parser.add_argument('--include-images', action='store_true', 
                       help='包含图片信息')
    
    args = parser.parse_args()
    
    # 获取URL列表
    if args.urls:
        urls = read_urls_from_file(args.urls)
    elif args.url:
        urls = [args.url]
    else:
        print("错误: 请提供URL文件 (--urls) 或单个URL (--url)")
        return 1
    
    print(f"准备爬取 {len(urls)} 个URL...")
    
    # 初始化爬虫
    scraper = FirecrawlScraper(api_key=args.api_key)
    
    # 执行爬取
    results = scraper.batch_scrape(
        urls, 
        max_concurrent=args.concurrent,
        include_links=args.include_links,
        include_images=args.include_images
    )
    
    # 统计结果
    success_count = sum(1 for r in results if r.success)
    failed_count = len(results) - success_count
    
    print(f"爬取完成: {success_count} 成功, {failed_count} 失败")
    
    # 导出结果
    output_file = f"{args.output}.{args.format}"
    export_results(results, format=args.format, filename=output_file)
    print(f"结果已导出到: {output_file}")
    
    # 显示失败的URL
    if failed_count > 0:
        print("\n失败的URL:")
        for r in results:
            if not r.success:
                print(f"  - {r.url}: {r.error}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())