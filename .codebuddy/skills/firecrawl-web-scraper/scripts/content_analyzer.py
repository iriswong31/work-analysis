#!/usr/bin/env python3
"""
内容分析器 - 专门用于内容工厂工作流
分析文章、视频内容，提取热点和趋势
"""

import re
import json
from typing import List, Dict, Optional
from dataclasses import dataclass
from collections import Counter
from urllib.parse import urlparse
from firecrawl_scraper import FirecrawlScraper, ScrapingResult


@dataclass
class ContentAnalysis:
    """内容分析结果"""
    url: str
    title: str
    content_type: str  # article, video, social_post
    keywords: List[str]
    topics: List[str]
    sentiment: str  # positive, negative, neutral
    engagement_signals: Dict  # 点赞、评论、分享等
    video_info: Optional[Dict] = None
    summary: str = ""
    hotness_score: float = 0.0


class ContentAnalyzer:
    """内容分析器"""
    
    def __init__(self, api_key: str):
        self.scraper = FirecrawlScraper(api_key)
        
        # 热点关键词库（可以根据行业调整）
        self.trending_keywords = [
            "AI", "人工智能", "ChatGPT", "短视频", "直播", "电商", 
            "新媒体", "内容创作", "流量", "变现", "副业", "创业",
            "抖音", "小红书", "B站", "微信", "视频号"
        ]
        
        # 视频平台识别
        self.video_platforms = {
            'youtube.com': 'YouTube',
            'bilibili.com': 'B站',
            'douyin.com': '抖音',
            'xiaohongshu.com': '小红书',
            'weixin.qq.com': '微信视频号'
        }
    
    def analyze_content(self, url: str) -> ContentAnalysis:
        """分析单个内容"""
        # 爬取内容
        result = self.scraper.scrape_url(url, include_links=True, include_images=True)
        
        if not result.success:
            return ContentAnalysis(
                url=url, title="", content_type="unknown",
                keywords=[], topics=[], sentiment="neutral",
                engagement_signals={}
            )
        
        # 识别内容类型
        content_type = self._identify_content_type(url, result)
        
        # 提取关键词
        keywords = self._extract_keywords(result.content)
        
        # 识别话题
        topics = self._extract_topics(result.content, result.title)
        
        # 情感分析（简单版本）
        sentiment = self._analyze_sentiment(result.content)
        
        # 提取互动数据
        engagement = self._extract_engagement_signals(result.content)
        
        # 视频信息提取
        video_info = None
        if content_type == "video":
            video_info = self._extract_video_info(result)
        
        # 生成摘要
        summary = self._generate_summary(result.content, result.title)
        
        # 计算热度分数
        hotness_score = self._calculate_hotness_score(
            keywords, topics, engagement, content_type
        )
        
        return ContentAnalysis(
            url=url,
            title=result.title,
            content_type=content_type,
            keywords=keywords,
            topics=topics,
            sentiment=sentiment,
            engagement_signals=engagement,
            video_info=video_info,
            summary=summary,
            hotness_score=hotness_score
        )
    
    def batch_analyze(self, urls: List[str]) -> List[ContentAnalysis]:
        """批量分析内容"""
        analyses = []
        
        for url in urls:
            print(f"正在分析: {url}")
            analysis = self.analyze_content(url)
            analyses.append(analysis)
        
        return analyses
    
    def find_trending_topics(self, analyses: List[ContentAnalysis]) -> Dict:
        """找出热门话题和趋势"""
        all_keywords = []
        all_topics = []
        high_engagement_content = []
        
        for analysis in analyses:
            all_keywords.extend(analysis.keywords)
            all_topics.extend(analysis.topics)
            
            if analysis.hotness_score > 7.0:  # 高热度内容
                high_engagement_content.append(analysis)
        
        # 统计热门关键词
        keyword_counts = Counter(all_keywords)
        topic_counts = Counter(all_topics)
        
        return {
            "trending_keywords": keyword_counts.most_common(20),
            "trending_topics": topic_counts.most_common(15),
            "high_engagement_content": high_engagement_content,
            "content_type_distribution": self._get_content_type_stats(analyses),
            "sentiment_distribution": self._get_sentiment_stats(analyses),
            "platform_analysis": self._get_platform_stats(analyses)
        }
    
    def generate_content_ideas(self, trend_analysis: Dict) -> List[Dict]:
        """基于趋势分析生成内容创意"""
        ideas = []
        
        trending_keywords = [kw[0] for kw in trend_analysis["trending_keywords"][:10]]
        trending_topics = [tp[0] for tp in trend_analysis["trending_topics"][:8]]
        
        # 组合热门关键词和话题生成创意
        for i, keyword in enumerate(trending_keywords[:5]):
            for j, topic in enumerate(trending_topics[:3]):
                idea = {
                    "title": f"如何用{keyword}实现{topic}",
                    "type": "教程类",
                    "keywords": [keyword, topic],
                    "estimated_popularity": 8.5 - (i * 0.3) - (j * 0.2),
                    "content_angle": f"结合{keyword}的最新趋势，深度解析{topic}的实操方法"
                }
                ideas.append(idea)
        
        # 基于高互动内容生成相似创意
        for content in trend_analysis["high_engagement_content"][:3]:
            similar_idea = {
                "title": f"【热门解析】{content.title}背后的成功秘诀",
                "type": "分析类", 
                "keywords": content.keywords[:3],
                "estimated_popularity": content.hotness_score * 0.9,
                "content_angle": f"深度分析热门内容的成功要素和可复制方法"
            }
            ideas.append(similar_idea)
        
        # 按预估热度排序
        ideas.sort(key=lambda x: x["estimated_popularity"], reverse=True)
        
        return ideas[:15]  # 返回前15个创意
    
    def _identify_content_type(self, url: str, result: ScrapingResult) -> str:
        """识别内容类型"""
        domain = urlparse(url).netloc.lower()
        content = result.content.lower()
        
        # 视频平台检测
        for platform_domain in self.video_platforms:
            if platform_domain in domain:
                return "video"
        
        # 关键词检测
        if any(word in content for word in ["视频", "播放", "观看", "时长"]):
            return "video"
        elif any(word in content for word in ["文章", "阅读", "作者"]):
            return "article"
        elif any(word in content for word in ["动态", "发布", "转发", "点赞"]):
            return "social_post"
        
        return "article"  # 默认为文章
    
    def _extract_keywords(self, content: str) -> List[str]:
        """提取关键词"""
        keywords = []
        
        # 查找预定义的热点关键词
        for keyword in self.trending_keywords:
            if keyword in content:
                keywords.append(keyword)
        
        # 简单的关键词提取（可以用更高级的NLP库）
        # 提取2-4字的高频词组
        words = re.findall(r'[\u4e00-\u9fff]{2,4}', content)
        word_counts = Counter(words)
        
        # 过滤掉常见停用词
        stop_words = {"这个", "那个", "可以", "就是", "如果", "因为", "所以", "但是", "然后", "现在", "时候", "什么", "怎么", "为了"}
        
        for word, count in word_counts.most_common(20):
            if word not in stop_words and len(word) >= 2:
                keywords.append(word)
        
        return list(set(keywords))[:15]  # 去重并限制数量
    
    def _extract_topics(self, content: str, title: str) -> List[str]:
        """提取话题标签"""
        topics = []
        
        # 从标题和内容中提取话题
        text = f"{title} {content}"
        
        # 预定义话题模式
        topic_patterns = {
            "赚钱": ["赚钱", "收入", "变现", "盈利", "副业"],
            "创业": ["创业", "创始人", "公司", "团队", "融资"],
            "技能": ["技能", "学习", "教程", "方法", "技巧"],
            "生活": ["生活", "日常", "分享", "体验", "感受"],
            "科技": ["科技", "技术", "AI", "数字化", "智能"],
            "娱乐": ["娱乐", "搞笑", "有趣", "好玩", "轻松"],
            "教育": ["教育", "知识", "学习", "课程", "培训"],
            "健康": ["健康", "养生", "运动", "饮食", "医疗"]
        }
        
        for topic, keywords in topic_patterns.items():
            if any(keyword in text for keyword in keywords):
                topics.append(topic)
        
        return topics
    
    def _analyze_sentiment(self, content: str) -> str:
        """简单情感分析"""
        positive_words = ["好", "棒", "优秀", "成功", "赞", "喜欢", "推荐", "值得", "满意"]
        negative_words = ["差", "坏", "失败", "糟糕", "不好", "讨厌", "不推荐", "失望"]
        
        positive_count = sum(1 for word in positive_words if word in content)
        negative_count = sum(1 for word in negative_words if word in content)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _extract_engagement_signals(self, content: str) -> Dict:
        """提取互动数据"""
        engagement = {
            "likes": 0,
            "comments": 0,
            "shares": 0,
            "views": 0
        }
        
        # 使用正则表达式提取数字
        patterns = {
            "likes": [r"(\d+)\s*[点个]赞", r"点赞\s*(\d+)", r"👍\s*(\d+)"],
            "comments": [r"(\d+)\s*[条个]评论", r"评论\s*(\d+)", r"💬\s*(\d+)"],
            "shares": [r"(\d+)\s*[次个]分享", r"分享\s*(\d+)", r"转发\s*(\d+)"],
            "views": [r"(\d+)\s*[次个]播放", r"播放量\s*(\d+)", r"观看\s*(\d+)"]
        }
        
        for metric, pattern_list in patterns.items():
            for pattern in pattern_list:
                matches = re.findall(pattern, content)
                if matches:
                    try:
                        engagement[metric] = max(int(match) for match in matches)
                        break
                    except ValueError:
                        continue
        
        return engagement
    
    def _extract_video_info(self, result: ScrapingResult) -> Dict:
        """提取视频信息"""
        video_info = {
            "duration": "",
            "creator": "",
            "upload_date": "",
            "description": "",
            "tags": []
        }
        
        content = result.content
        
        # 提取时长
        duration_patterns = [r"时长[：:]\s*(\d+:\d+)", r"(\d+:\d+)", r"(\d+分\d+秒)"]
        for pattern in duration_patterns:
            match = re.search(pattern, content)
            if match:
                video_info["duration"] = match.group(1)
                break
        
        # 提取创作者
        creator_patterns = [r"作者[：:]\s*([^\s\n]+)", r"UP主[：:]\s*([^\s\n]+)", r"博主[：:]\s*([^\s\n]+)"]
        for pattern in creator_patterns:
            match = re.search(pattern, content)
            if match:
                video_info["creator"] = match.group(1)
                break
        
        return video_info
    
    def _generate_summary(self, content: str, title: str) -> str:
        """生成内容摘要"""
        # 简单的摘要生成（取前200字符）
        summary = content[:200].strip()
        if len(content) > 200:
            summary += "..."
        
        return summary
    
    def _calculate_hotness_score(self, keywords: List[str], topics: List[str], 
                                engagement: Dict, content_type: str) -> float:
        """计算热度分数"""
        score = 5.0  # 基础分数
        
        # 关键词加分
        trending_keyword_bonus = sum(1 for kw in keywords if kw in self.trending_keywords)
        score += trending_keyword_bonus * 0.5
        
        # 话题加分
        score += len(topics) * 0.3
        
        # 互动数据加分
        total_engagement = sum(engagement.values())
        if total_engagement > 1000:
            score += 2.0
        elif total_engagement > 100:
            score += 1.0
        elif total_engagement > 10:
            score += 0.5
        
        # 内容类型加分
        if content_type == "video":
            score += 0.5  # 视频内容通常更受欢迎
        
        return min(score, 10.0)  # 最高10分
    
    def _get_content_type_stats(self, analyses: List[ContentAnalysis]) -> Dict:
        """获取内容类型统计"""
        type_counts = Counter(analysis.content_type for analysis in analyses)
        return dict(type_counts)
    
    def _get_sentiment_stats(self, analyses: List[ContentAnalysis]) -> Dict:
        """获取情感分布统计"""
        sentiment_counts = Counter(analysis.sentiment for analysis in analyses)
        return dict(sentiment_counts)
    
    def _get_platform_stats(self, analyses: List[ContentAnalysis]) -> Dict:
        """获取平台分布统计"""
        platform_counts = {}
        
        for analysis in analyses:
            domain = urlparse(analysis.url).netloc.lower()
            platform = "其他"
            
            for platform_domain, platform_name in self.video_platforms.items():
                if platform_domain in domain:
                    platform = platform_name
                    break
            
            platform_counts[platform] = platform_counts.get(platform, 0) + 1
        
        return platform_counts


def export_analysis_report(analyses: List[ContentAnalysis], trend_analysis: Dict, 
                          content_ideas: List[Dict], filename: str = "content_analysis_report.json"):
    """导出完整的分析报告"""
    report = {
        "analysis_summary": {
            "total_content": len(analyses),
            "average_hotness": sum(a.hotness_score for a in analyses) / len(analyses) if analyses else 0,
            "content_types": trend_analysis["content_type_distribution"],
            "sentiment_distribution": trend_analysis["sentiment_distribution"]
        },
        "trending_analysis": trend_analysis,
        "content_ideas": content_ideas,
        "detailed_analyses": [
            {
                "url": a.url,
                "title": a.title,
                "content_type": a.content_type,
                "keywords": a.keywords,
                "topics": a.topics,
                "sentiment": a.sentiment,
                "hotness_score": a.hotness_score,
                "engagement": a.engagement_signals,
                "summary": a.summary
            }
            for a in analyses
        ]
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"分析报告已导出到: {filename}")


if __name__ == "__main__":
    # 示例使用
    analyzer = ContentAnalyzer(api_key="your-firecrawl-api-key")
    
    # 示例URL列表
    urls = [
        "https://example.com/article1",
        "https://example.com/video1"
    ]
    
    # 批量分析
    analyses = analyzer.batch_analyze(urls)
    
    # 趋势分析
    trends = analyzer.find_trending_topics(analyses)
    
    # 生成内容创意
    ideas = analyzer.generate_content_ideas(trends)
    
    # 导出报告
    export_analysis_report(analyses, trends, ideas)