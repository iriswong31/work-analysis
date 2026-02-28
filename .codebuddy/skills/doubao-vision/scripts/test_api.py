#!/usr/bin/env python3
"""
API 测试脚本 - 验证豆包视觉 API 是否正常工作
"""

import os
import sys
import requests


def test_api():
    """测试 API 连接"""
    api_key = os.getenv("ARK_API_KEY")
    
    if not api_key:
        print("❌ 错误: 未设置 ARK_API_KEY 环境变量")
        print("\n请先设置 API Key:")
        print('  export ARK_API_KEY="your_api_key_here"')
        return False
    
    print(f"✓ API Key 已设置 (前8位: {api_key[:8]}...)")
    
    # 使用一张网络测试图片
    test_image_url = "https://www.python.org/static/img/python-logo.png"
    
    print(f"\n正在测试 API 连接...")
    print(f"测试图片: {test_image_url}")
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": os.getenv("DOUBAO_MODEL", "ep-20260121005507-nl4gw"),
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": test_image_url
                            }
                        },
                        {
                            "type": "text",
                            "text": "这是什么图片？请简单描述。"
                        }
                    ]
                }
            ]
        }
        
        response = requests.post(
            "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            print("\n✓ API 连接成功!")
            print(f"\n模型回复: {content}")
            print(f"\nToken 使用: {result.get('usage', {})}")
            return True
        else:
            print(f"\n❌ API 调用失败")
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("\n❌ 请求超时，请检查网络连接")
        return False
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("豆包视觉 API 测试")
    print("=" * 50)
    
    success = test_api()
    
    print("\n" + "=" * 50)
    if success:
        print("✓ 测试通过! API 配置正确，可以正常使用。")
    else:
        print("✗ 测试失败! 请检查配置后重试。")
    print("=" * 50)
    
    sys.exit(0 if success else 1)
