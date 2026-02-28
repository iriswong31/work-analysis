import { InsuranceProduct, InsuranceType } from '@/types/insurance';

export interface ScrapingResult {
  success: boolean;
  products?: InsuranceProduct[];
  error?: string;
}

export class InsuranceProductScraper {
  private static readonly FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';
  private static readonly FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v0/scrape';

  // 主流保险平台URL
  private static readonly INSURANCE_PLATFORMS = {
    huize: 'https://www.huize.com',
    xiaoyusan: 'https://www.xiaoyusan.com',
    shenlanbaoxian: 'https://www.shenlanbaoxian.com',
    duobao: 'https://www.duobaoxian.com',
  };

  /**
   * 调用Firecrawl API抓取网页内容
   */
  private static async callFirecrawlAPI(url: string): Promise<any> {
    if (!this.FIRECRAWL_API_KEY) {
      console.warn('Firecrawl API key not configured, using mock data');
      return this.getMockData(url);
    }

    const response = await fetch(this.FIRECRAWL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'div', 'span', 'a'],
        excludeTags: ['script', 'style', 'nav', 'footer', 'header']
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 获取模拟数据（当API未配置时使用）
   */
  private static getMockData(url: string): any {
    const mockProducts = {
      criticalIllness: [
        {
          id: 'ci-001',
          name: '康惠保旗舰版2.0',
          company: '百年人寿',
          type: 'criticalIllness' as InsuranceType,
          minCoverage: 100000,
          maxCoverage: 1000000,
          priceRange: '2000-8000元/年',
          features: ['110种重疾', '25种中症', '50种轻症', '可选癌症二次赔付'],
          rating: 4.8,
          url: 'https://www.huize.com/product/ci-001'
        },
        {
          id: 'ci-002',
          name: '达尔文6号',
          company: '信泰人寿',
          type: 'criticalIllness' as InsuranceType,
          minCoverage: 100000,
          maxCoverage: 800000,
          priceRange: '1800-7500元/年',
          features: ['110种重疾', '28种中症', '45种轻症', '高发轻症额外赔'],
          rating: 4.7,
          url: 'https://www.xiaoyusan.com/product/ci-002'
        },
        {
          id: 'ci-003',
          name: '超级玛丽6号',
          company: '君龙人寿',
          type: 'criticalIllness' as InsuranceType,
          minCoverage: 100000,
          maxCoverage: 600000,
          priceRange: '1500-6000元/年',
          features: ['108种重疾', '25种中症', '50种轻症', '60岁前额外赔付'],
          rating: 4.6,
          url: 'https://www.shenlanbaoxian.com/product/ci-003'
        }
      ],
      medical: [
        {
          id: 'med-001',
          name: '好医保长期医疗',
          company: '人保健康',
          type: 'medical' as InsuranceType,
          minCoverage: 2000000,
          maxCoverage: 4000000,
          priceRange: '200-800元/年',
          features: ['400万保额', '20年保证续保', '住院垫付', '绿色通道'],
          rating: 4.9,
          url: 'https://www.huize.com/product/med-001'
        },
        {
          id: 'med-002',
          name: '平安e生保',
          company: '平安健康',
          type: 'medical' as InsuranceType,
          minCoverage: 2000000,
          maxCoverage: 6000000,
          priceRange: '180-900元/年',
          features: ['600万保额', '保证续保', '质子重离子', '特药保障'],
          rating: 4.7,
          url: 'https://www.xiaoyusan.com/product/med-002'
        },
        {
          id: 'med-003',
          name: '尊享e生2022',
          company: '众安保险',
          type: 'medical' as InsuranceType,
          minCoverage: 3000000,
          maxCoverage: 6000000,
          priceRange: '300-1200元/年',
          features: ['600万保额', '121种特药', '海外医疗', '家庭共享'],
          rating: 4.8,
          url: 'https://www.shenlanbaoxian.com/product/med-003'
        }
      ],
      accident: [
        {
          id: 'acc-001',
          name: '小蜜蜂2号',
          company: '上海人寿',
          type: 'accident' as InsuranceType,
          minCoverage: 100000,
          maxCoverage: 500000,
          priceRange: '100-300元/年',
          features: ['意外身故/伤残', '意外医疗', '住院津贴', '猝死保障'],
          rating: 4.8,
          url: 'https://www.huize.com/product/acc-001'
        },
        {
          id: 'acc-002',
          name: '大护甲3号',
          company: '人保财险',
          type: 'accident' as InsuranceType,
          minCoverage: 100000,
          maxCoverage: 1000000,
          priceRange: '150-500元/年',
          features: ['100万意外身故', '意外医疗', '交通意外', '住院津贴'],
          rating: 4.7,
          url: 'https://www.xiaoyusan.com/product/acc-002'
        },
        {
          id: 'acc-003',
          name: '亚太超人意外险',
          company: '亚太财险',
          type: 'accident' as InsuranceType,
          minCoverage: 100000,
          maxCoverage: 300000,
          priceRange: '80-250元/年',
          features: ['意外身故/伤残', '意外医疗', '救护车费用', '意外住院津贴'],
          rating: 4.6,
          url: 'https://www.shenlanbaoxian.com/product/acc-003'
        }
      ],
      lifeInsurance: [
        {
          id: 'life-001',
          name: '大麦2022',
          company: '华贵人寿',
          type: 'lifeInsurance' as InsuranceType,
          minCoverage: 500000,
          maxCoverage: 3000000,
          priceRange: '500-2000元/年',
          features: ['定期寿险', '免体检额度高', '健康告知宽松', '保费低廉'],
          rating: 4.9,
          url: 'https://www.huize.com/product/life-001'
        },
        {
          id: 'life-002',
          name: '定海柱2号',
          company: '同方全球',
          type: 'lifeInsurance' as InsuranceType,
          minCoverage: 500000,
          maxCoverage: 2500000,
          priceRange: '600-2500元/年',
          features: ['定期寿险', '身故/全残保障', '免责条款少', '性价比高'],
          rating: 4.7,
          url: 'https://www.xiaoyusan.com/product/life-002'
        },
        {
          id: 'life-003',
          name: '擎天柱6号',
          company: '同方全球',
          type: 'lifeInsurance' as InsuranceType,
          minCoverage: 500000,
          maxCoverage: 2000000,
          priceRange: '400-1800元/年',
          features: ['定期寿险', '保费递减', '健康告知简单', '投保便捷'],
          rating: 4.6,
          url: 'https://www.shenlanbaoxian.com/product/life-003'
        }
      ]
    };

    return {
      success: true,
      data: {
        markdown: `# 保险产品推荐\n\n${JSON.stringify(mockProducts, null, 2)}`
      }
    };
  }

  /**
   * 解析抓取的内容并提取产品信息
   */
  private static parseProductsFromContent(content: string, type: InsuranceType): InsuranceProduct[] {
    // 尝试从内容中提取JSON数据
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return data[type] || [];
    }

    // 如果没有找到JSON，返回空数组
    return [];
  }

  /**
   * 根据险种抓取推荐产品
   */
  static async scrapeProductsByType(type: InsuranceType): Promise<ScrapingResult> {
    const searchUrls = [
      `${this.INSURANCE_PLATFORMS.huize}/search?type=${type}`,
      `${this.INSURANCE_PLATFORMS.xiaoyusan}/products/${type}`,
      `${this.INSURANCE_PLATFORMS.shenlanbaoxian}/${type}`,
    ];

    const allProducts: InsuranceProduct[] = [];

    for (const url of searchUrls) {
      const result = await this.callFirecrawlAPI(url);
      
      if (result.success && result.data?.markdown) {
        const products = this.parseProductsFromContent(result.data.markdown, type);
        allProducts.push(...products);
      }
    }

    // 去重并排序
    const uniqueProducts = allProducts.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    );

    // 按评分排序
    uniqueProducts.sort((a, b) => b.rating - a.rating);

    return {
      success: true,
      products: uniqueProducts.slice(0, 10) // 返回前10个产品
    };
  }

  /**
   * 获取所有险种的推荐产品
   */
  static async scrapeAllProducts(): Promise<Record<InsuranceType, InsuranceProduct[]>> {
    const results: Record<InsuranceType, InsuranceProduct[]> = {
      criticalIllness: [],
      medical: [],
      accident: [],
      lifeInsurance: [],
    };

    const types: InsuranceType[] = ['criticalIllness', 'medical', 'accident', 'lifeInsurance'];

    for (const type of types) {
      const result = await this.scrapeProductsByType(type);
      if (result.success && result.products) {
        results[type] = result.products;
      }
    }

    return results;
  }

  /**
   * 根据用户需求筛选产品
   */
  static filterProductsByNeeds(
    products: InsuranceProduct[],
    maxBudget?: number,
    minCoverage?: number,
    preferredCompanies?: string[]
  ): InsuranceProduct[] {
    return products.filter(product => {
      // 预算筛选（这里简化处理，实际应该解析价格范围）
      if (maxBudget) {
        const priceMatch = product.priceRange.match(/(\d+)-(\d+)/);
        if (priceMatch) {
          const minPrice = parseInt(priceMatch[1]);
          if (minPrice > maxBudget) return false;
        }
      }

      // 保额筛选
      if (minCoverage && product.maxCoverage < minCoverage) {
        return false;
      }

      // 保险公司筛选
      if (preferredCompanies && preferredCompanies.length > 0) {
        if (!preferredCompanies.includes(product.company)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 获取产品详细信息
   */
  static async getProductDetails(productId: string): Promise<InsuranceProduct | null> {
    // 这里应该根据产品ID抓取详细信息
    // 简化实现，返回基础信息
    const allProducts = await this.scrapeAllProducts();
    
    for (const products of Object.values(allProducts)) {
      const product = products.find(p => p.id === productId);
      if (product) return product;
    }

    return null;
  }
}