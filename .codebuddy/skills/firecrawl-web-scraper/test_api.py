#!/usr/bin/env python3
import requests
import json

def test_firecrawl_api():
    api_key = 'fc-2439b2b6ae0449dba6cb7f1066436122'
    url = 'https://api.firecrawl.dev/v0/scrape'
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'url': 'https://example.com',
        'formats': ['markdown']
    }
    
    print('🧪 直接测试 Firecrawl API...')
    print(f'🔑 API Key: {api_key[:20]}...')
    print(f'📍 测试URL: https://example.com')
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f'📊 响应状态: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            print('✅ API 调用成功！')
            print(f'📄 数据结构: {list(data.keys())}')
            if 'data' in data and 'markdown' in data['data']:
                content = data['data']['markdown']
                print(f'📝 内容长度: {len(content)} 字符')
                print(f'📖 内容预览: {content[:300]}...')
            else:
                print('📋 完整响应:', json.dumps(data, indent=2)[:500])
        else:
            print(f'❌ API 调用失败: {response.status_code}')
            print(f'📋 错误信息: {response.text}')
            
    except Exception as e:
        print(f'❌ 请求异常: {str(e)}')

if __name__ == "__main__":
    test_firecrawl_api()