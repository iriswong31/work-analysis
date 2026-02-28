#!/usr/bin/env python3
"""
豆包视觉 AI 分析器
Doubao Vision Analyzer - 图片识别与分析工具
"""

import os
import sys
import json
import base64
import argparse
import requests
from pathlib import Path
from typing import Optional, Union


class DoubaoVision:
    """豆包视觉 AI 客户端"""
    
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """
        初始化豆包视觉 AI 客户端
        
        Args:
            api_key: API 密钥，如果不提供则从环境变量 ARK_API_KEY 获取
            model: 模型 endpoint ID，如果不提供则从环境变量 DOUBAO_MODEL 获取
        """
        self.api_key = api_key or os.getenv("ARK_API_KEY")
        self.model = model or os.getenv("DOUBAO_MODEL", "ep-20260121005507-nl4gw")
        self.base_url = "https://ark.cn-beijing.volces.com/api/v3"
        
        if not self.api_key:
            raise ValueError(
                "API Key 未设置。请通过以下方式之一设置：\n"
                "1. 传入 api_key 参数\n"
                "2. 设置环境变量: export ARK_API_KEY='your_key'\n"
                "3. 在 .env 文件中设置 ARK_API_KEY"
            )
    
    def _encode_image(self, image_path: str) -> str:
        """将本地图片编码为 base64"""
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"图片文件不存在: {image_path}")
        
        # 获取 MIME 类型
        suffix = path.suffix.lower()
        mime_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.bmp': 'image/bmp'
        }
        mime_type = mime_types.get(suffix, 'image/jpeg')
        
        with open(path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        return f"data:{mime_type};base64,{image_data}"
    
    def _call_api(self, messages: list) -> dict:
        """调用豆包 API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages
        }
        
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code != 200:
            raise Exception(f"API 调用失败: {response.status_code} - {response.text}")
        
        return response.json()
    
    def analyze_image(
        self, 
        image_path: str, 
        question: str = "请详细描述这张图片的内容"
    ) -> str:
        """
        分析本地图片
        
        Args:
            image_path: 本地图片路径
            question: 要问的问题
            
        Returns:
            AI 的回答
        """
        image_url = self._encode_image(image_path)
        
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    },
                    {
                        "type": "text",
                        "text": question
                    }
                ]
            }
        ]
        
        result = self._call_api(messages)
        return result["choices"][0]["message"]["content"]
    
    def analyze_url(
        self, 
        image_url: str, 
        question: str = "请详细描述这张图片的内容"
    ) -> str:
        """
        分析网络图片
        
        Args:
            image_url: 图片 URL
            question: 要问的问题
            
        Returns:
            AI 的回答
        """
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    },
                    {
                        "type": "text",
                        "text": question
                    }
                ]
            }
        ]
        
        result = self._call_api(messages)
        return result["choices"][0]["message"]["content"]
    
    def extract_text(self, image_path: str) -> str:
        """
        OCR 文字提取
        
        Args:
            image_path: 图片路径
            
        Returns:
            提取的文字内容
        """
        return self.analyze_image(
            image_path,
            "请提取并输出这张图片中的所有文字内容。如果是表格，请尽量保持格式。如果没有文字，请说明。"
        )
    
    def describe_image(self, image_path: str) -> str:
        """
        生成图片描述
        
        Args:
            image_path: 图片路径
            
        Returns:
            图片描述
        """
        return self.analyze_image(
            image_path,
            "请用简洁的语言描述这张图片的主要内容，包括：场景、主要物体、颜色、氛围等。"
        )
    
    def analyze_chart(self, image_path: str) -> str:
        """
        分析图表
        
        Args:
            image_path: 图表图片路径
            
        Returns:
            图表分析结果
        """
        return self.analyze_image(
            image_path,
            "这是一张图表或流程图。请分析并解读其内容，包括：\n"
            "1. 图表类型\n"
            "2. 主要数据或流程\n"
            "3. 关键发现或结论"
        )


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="豆包视觉 AI 分析器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 分析本地图片
  python vision_analyzer.py --image photo.jpg --question "图片中有什么？"
  
  # 分析网络图片
  python vision_analyzer.py --url "https://example.com/image.jpg"
  
  # OCR 文字识别
  python vision_analyzer.py --image document.png --ocr
  
  # 图表分析
  python vision_analyzer.py --image chart.png --chart
        """
    )
    
    # 输入源
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--image", "-i", help="本地图片路径")
    input_group.add_argument("--url", "-u", help="网络图片 URL")
    
    # 分析模式
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument("--question", "-q", help="自定义问题")
    mode_group.add_argument("--ocr", action="store_true", help="OCR 文字提取模式")
    mode_group.add_argument("--chart", action="store_true", help="图表分析模式")
    mode_group.add_argument("--describe", action="store_true", help="生成描述模式")
    
    # API 配置
    parser.add_argument("--api-key", help="API Key (或设置 ARK_API_KEY 环境变量)")
    parser.add_argument("--model", help="模型 endpoint ID")
    
    # 输出选项
    parser.add_argument("--json", action="store_true", help="输出 JSON 格式")
    parser.add_argument("--output", "-o", help="输出到文件")
    
    args = parser.parse_args()
    
    try:
        # 初始化客户端
        vision = DoubaoVision(
            api_key=args.api_key,
            model=args.model
        )
        
        # 执行分析
        if args.image:
            if args.ocr:
                result = vision.extract_text(args.image)
            elif args.chart:
                result = vision.analyze_chart(args.image)
            elif args.describe:
                result = vision.describe_image(args.image)
            else:
                question = args.question or "请详细描述这张图片的内容"
                result = vision.analyze_image(args.image, question)
        else:  # URL
            question = args.question or "请详细描述这张图片的内容"
            result = vision.analyze_url(args.url, question)
        
        # 输出结果
        if args.json:
            output = json.dumps({
                "source": args.image or args.url,
                "result": result
            }, ensure_ascii=False, indent=2)
        else:
            output = result
        
        if args.output:
            Path(args.output).write_text(output, encoding='utf-8')
            print(f"结果已保存到: {args.output}")
        else:
            print(output)
            
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
