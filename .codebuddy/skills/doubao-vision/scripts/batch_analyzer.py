#!/usr/bin/env python3
"""
批量图片分析器
Batch Image Analyzer - 批量处理多张图片
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# 添加当前目录到 path
sys.path.insert(0, str(Path(__file__).parent))
from vision_analyzer import DoubaoVision


class BatchAnalyzer:
    """批量图片分析器"""
    
    SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
    
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """初始化批量分析器"""
        self.vision = DoubaoVision(api_key=api_key, model=model)
    
    def find_images(self, directory: str, recursive: bool = False) -> List[Path]:
        """
        在目录中查找所有支持的图片
        
        Args:
            directory: 目录路径
            recursive: 是否递归搜索子目录
            
        Returns:
            图片文件路径列表
        """
        dir_path = Path(directory)
        if not dir_path.exists():
            raise FileNotFoundError(f"目录不存在: {directory}")
        
        if recursive:
            files = dir_path.rglob("*")
        else:
            files = dir_path.glob("*")
        
        images = [f for f in files if f.suffix.lower() in self.SUPPORTED_EXTENSIONS]
        return sorted(images)
    
    def analyze_batch(
        self,
        images: List[str],
        question: str = "请简洁描述这张图片的内容",
        max_workers: int = 3
    ) -> List[dict]:
        """
        批量分析图片
        
        Args:
            images: 图片路径列表
            question: 要问的问题
            max_workers: 最大并发数
            
        Returns:
            分析结果列表
        """
        results = []
        
        def analyze_one(image_path: str) -> dict:
            try:
                result = self.vision.analyze_image(str(image_path), question)
                return {
                    "file": str(image_path),
                    "status": "success",
                    "result": result
                }
            except Exception as e:
                return {
                    "file": str(image_path),
                    "status": "error",
                    "error": str(e)
                }
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(analyze_one, img): img for img in images}
            
            for i, future in enumerate(as_completed(futures), 1):
                result = future.result()
                results.append(result)
                status = "✓" if result["status"] == "success" else "✗"
                print(f"[{i}/{len(images)}] {status} {Path(result['file']).name}")
        
        return results
    
    def generate_report(
        self,
        results: List[dict],
        format: str = "markdown",
        output_path: Optional[str] = None
    ) -> str:
        """
        生成分析报告
        
        Args:
            results: 分析结果列表
            format: 输出格式 (markdown/json)
            output_path: 输出文件路径
            
        Returns:
            报告内容
        """
        if format == "json":
            report = json.dumps({
                "generated_at": datetime.now().isoformat(),
                "total": len(results),
                "success": sum(1 for r in results if r["status"] == "success"),
                "failed": sum(1 for r in results if r["status"] == "error"),
                "results": results
            }, ensure_ascii=False, indent=2)
        else:
            # Markdown 格式
            lines = [
                "# 图片批量分析报告",
                "",
                f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                f"**总计**: {len(results)} 张图片",
                f"**成功**: {sum(1 for r in results if r['status'] == 'success')}",
                f"**失败**: {sum(1 for r in results if r['status'] == 'error')}",
                "",
                "---",
                ""
            ]
            
            for i, result in enumerate(results, 1):
                filename = Path(result["file"]).name
                lines.append(f"## {i}. {filename}")
                lines.append("")
                
                if result["status"] == "success":
                    lines.append(result["result"])
                else:
                    lines.append(f"**错误**: {result['error']}")
                
                lines.append("")
                lines.append("---")
                lines.append("")
            
            report = "\n".join(lines)
        
        if output_path:
            Path(output_path).write_text(report, encoding='utf-8')
            print(f"\n报告已保存到: {output_path}")
        
        return report


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="批量图片分析器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 分析目录中所有图片
  python batch_analyzer.py --dir ./images
  
  # 递归分析子目录
  python batch_analyzer.py --dir ./images --recursive
  
  # 指定问题
  python batch_analyzer.py --dir ./images --question "这张图片的主要颜色是什么？"
  
  # 输出 JSON 格式报告
  python batch_analyzer.py --dir ./images --format json --output report.json
        """
    )
    
    # 输入
    parser.add_argument("--dir", "-d", required=True, help="图片目录路径")
    parser.add_argument("--recursive", "-r", action="store_true", help="递归搜索子目录")
    
    # 分析选项
    parser.add_argument("--question", "-q", 
                       default="请简洁描述这张图片的内容",
                       help="要问的问题")
    parser.add_argument("--workers", "-w", type=int, default=3, help="并发数 (默认: 3)")
    
    # 输出选项
    parser.add_argument("--format", "-f", choices=["markdown", "json"], 
                       default="markdown", help="输出格式")
    parser.add_argument("--output", "-o", help="输出文件路径")
    
    # API 配置
    parser.add_argument("--api-key", help="API Key")
    parser.add_argument("--model", help="模型 endpoint ID")
    
    args = parser.parse_args()
    
    try:
        # 初始化
        analyzer = BatchAnalyzer(api_key=args.api_key, model=args.model)
        
        # 查找图片
        print(f"正在搜索图片...")
        images = analyzer.find_images(args.dir, recursive=args.recursive)
        
        if not images:
            print("未找到支持的图片文件")
            sys.exit(0)
        
        print(f"找到 {len(images)} 张图片，开始分析...\n")
        
        # 批量分析
        results = analyzer.analyze_batch(
            images,
            question=args.question,
            max_workers=args.workers
        )
        
        # 生成报告
        report = analyzer.generate_report(
            results,
            format=args.format,
            output_path=args.output
        )
        
        if not args.output:
            print("\n" + "=" * 50)
            print(report)
            
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
