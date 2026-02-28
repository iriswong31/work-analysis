#!/usr/bin/env python3
"""
内容工厂工作流 - 一键式热点分析和内容创意生成
专门为内容创作者设计的自动化工作流
"""

import argparse
import sys
import json
from pathlib import Path
from datetime import datetime
from content_analyzer import ContentAnalyzer, export_analysis_report


class ContentFactoryWorkflow:
    """内容工厂工作流管理器"""
    
    def __init__(self, api_key: str):
        self.analyzer = ContentAnalyzer(api_key)
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def run_full_workflow(self, urls: list, output_dir: str = "content_factory_output"):
        """运行完整的内容工厂工作流"""
        print("🚀 启动内容工厂工作流...")
        
        # 创建输出目录
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # 步骤1: 批量内容分析
        print("\n📊 步骤1: 批量分析内容...")
        analyses = self.analyzer.batch_analyze(urls)
        
        success_count = sum(1 for a in analyses if a.title)
        print(f"✅ 成功分析 {success_count}/{len(urls)} 个内容")
        
        # 步骤2: 趋势分析
        print("\n🔥 步骤2: 分析热点趋势...")
        trends = self.analyzer.find_trending_topics(analyses)
        
        print(f"📈 发现 {len(trends['trending_keywords'])} 个热门关键词")
        print(f"🏷️ 识别 {len(trends['trending_topics'])} 个热门话题")
        
        # 步骤3: 生成内容创意
        print("\n💡 步骤3: 生成内容创意...")
        ideas = self.analyzer.generate_content_ideas(trends)
        
        print(f"🎯 生成 {len(ideas)} 个内容创意")
        
        # 步骤4: 导出报告
        print("\n📄 步骤4: 生成分析报告...")
        
        # 导出完整报告
        report_file = output_path / f"content_analysis_report_{self.timestamp}.json"
        export_analysis_report(analyses, trends, ideas, str(report_file))
        
        # 导出简化的创意列表
        ideas_file = output_path / f"content_ideas_{self.timestamp}.md"
        self._export_ideas_markdown(ideas, trends, str(ideas_file))
        
        # 导出热点关键词
        keywords_file = output_path / f"trending_keywords_{self.timestamp}.txt"
        self._export_keywords_list(trends['trending_keywords'], str(keywords_file))
        
        print(f"\n✅ 工作流完成！输出文件:")
        print(f"   📊 完整报告: {report_file}")
        print(f"   💡 内容创意: {ideas_file}")
        print(f"   🔥 热门关键词: {keywords_file}")
        
        # 显示快速摘要
        self._print_quick_summary(trends, ideas)
        
        return {
            "analyses": analyses,
            "trends": trends,
            "ideas": ideas,
            "output_files": {
                "report": str(report_file),
                "ideas": str(ideas_file),
                "keywords": str(keywords_file)
            }
        }
    
    def _export_ideas_markdown(self, ideas: list, trends: dict, filename: str):
        """导出内容创意为Markdown格式"""
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"# 内容创意报告 - {datetime.now().strftime('%Y年%m月%d日')}\n\n")
            
            # 热门趋势概览
            f.write("## 🔥 热门趋势概览\n\n")
            f.write("### 热门关键词 TOP 10\n")
            for i, (keyword, count) in enumerate(trends['trending_keywords'][:10], 1):
                f.write(f"{i}. **{keyword}** (出现{count}次)\n")
            
            f.write("\n### 热门话题 TOP 5\n")
            for i, (topic, count) in enumerate(trends['trending_topics'][:5], 1):
                f.write(f"{i}. **{topic}** (出现{count}次)\n")
            
            # 内容创意
            f.write("\n## 💡 推荐内容创意\n\n")
            
            for i, idea in enumerate(ideas, 1):
                f.write(f"### {i}. {idea['title']}\n\n")
                f.write(f"**类型:** {idea['type']}\n\n")
                f.write(f"**预估热度:** {'⭐' * int(idea['estimated_popularity'])} ({idea['estimated_popularity']:.1f}/10)\n\n")
                f.write(f"**关键词:** {', '.join(idea['keywords'])}\n\n")
                f.write(f"**内容角度:** {idea['content_angle']}\n\n")
                f.write("---\n\n")
            
            # 创作建议
            f.write("## 📝 创作建议\n\n")
            f.write("### 内容方向\n")
            f.write("- 重点关注上述热门关键词和话题\n")
            f.write("- 结合时事热点，提升内容时效性\n")
            f.write("- 注意内容的实用性和可操作性\n\n")
            
            f.write("### 发布策略\n")
            f.write("- 优先制作高热度预估的内容\n")
            f.write("- 在多平台同步发布，扩大影响力\n")
            f.write("- 关注用户反馈，及时调整内容策略\n")
    
    def _export_keywords_list(self, keywords: list, filename: str):
        """导出关键词列表"""
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"# 热门关键词列表 - {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")
            
            for keyword, count in keywords:
                f.write(f"{keyword} ({count})\n")
    
    def _print_quick_summary(self, trends: dict, ideas: list):
        """打印快速摘要"""
        print("\n" + "="*50)
        print("📋 快速摘要")
        print("="*50)
        
        # 最热关键词
        if trends['trending_keywords']:
            top_keywords = [kw[0] for kw in trends['trending_keywords'][:5]]
            print(f"🔥 最热关键词: {', '.join(top_keywords)}")
        
        # 最热话题
        if trends['trending_topics']:
            top_topics = [tp[0] for tp in trends['trending_topics'][:3]]
            print(f"🏷️ 最热话题: {', '.join(top_topics)}")
        
        # 推荐创意
        if ideas:
            print(f"💡 推荐创意: {ideas[0]['title']} (热度: {ideas[0]['estimated_popularity']:.1f})")
        
        print("="*50)


def main():
    parser = argparse.ArgumentParser(description='内容工厂工作流 - 自动化热点分析和创意生成')
    parser.add_argument('--urls', '-u', required=True, help='URL列表文件路径')
    parser.add_argument('--api-key', '-k', required=True, help='Firecrawl API密钥')
    parser.add_argument('--output', '-o', default='content_factory_output', help='输出目录')
    parser.add_argument('--sample-urls', action='store_true', help='使用示例URL进行测试')
    
    args = parser.parse_args()
    
    # 获取URL列表
    if args.sample_urls:
        # 示例URL用于测试
        urls = [
            "https://www.xiaohongshu.com/explore",
            "https://www.douyin.com/",
            "https://www.bilibili.com/",
        ]
        print("🧪 使用示例URL进行测试...")
    else:
        try:
            with open(args.urls, 'r', encoding='utf-8') as f:
                urls = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        except FileNotFoundError:
            print(f"❌ 错误: 找不到URL文件 {args.urls}")
            return 1
    
    if not urls:
        print("❌ 错误: 没有找到有效的URL")
        return 1
    
    print(f"📋 准备分析 {len(urls)} 个URL...")
    
    # 运行工作流
    workflow = ContentFactoryWorkflow(args.api_key)
    
    try:
        result = workflow.run_full_workflow(urls, args.output)
        print("\n🎉 内容工厂工作流执行成功！")
        return 0
        
    except Exception as e:
        print(f"\n❌ 工作流执行失败: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())