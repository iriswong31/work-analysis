import { useState } from "react";
import { Header } from "@/components/Header";
import { TabSwitch } from "@/components/TabSwitch";
import { OpportunityList } from "@/components/OpportunityList";
import { PrincipleList } from "@/components/PrincipleList";
import { MethodologyTab } from "@/components/MethodologyTab";
import { Opportunity, Principle, MethodologyData, StockRecommendation, CustomStockAnalysis, MetricWithSource } from "@/types";
import opportunitiesData from "@/data/opportunities.json";
import principlesData from "@/data/principles.json";
import methodologyData from "@/data/methodology.json";

function App() {
  const [activeTab, setActiveTab] = useState("opportunities");
  const [opportunities, setOpportunities] = useState<Opportunity[]>(
    opportunitiesData as Opportunity[]
  );
  const [principles] = useState<Principle[]>(
    principlesData as Principle[]
  );
  const [methodology, setMethodology] = useState<MethodologyData>(
    methodologyData as MethodologyData
  );
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleToggleExit = (id: string) => {
    setOpportunities(
      opportunities.map((opp) =>
        opp.id === id
          ? {
              ...opp,
              isExited: !opp.isExited,
              exitDate: !opp.isExited
                ? new Date().toISOString().split("T")[0]
                : undefined,
            }
          : opp
      )
    );
  };

  // 创建带数据源的指标
  const createMetricWithSource = (
    value: number,
    name: string,
    stockCode: string,
    market: string
  ): MetricWithSource => {
    const sourceMap: Record<string, { url: string; name: string }> = {
      "A股": { url: `https://xueqiu.com/S/SH${stockCode}`, name: "雪球" },
      "港股": { url: `https://xueqiu.com/S/${stockCode}`, name: "雪球" },
      "美股": { url: `https://xueqiu.com/S/${stockCode}`, name: "雪球" },
    };
    
    const source = sourceMap[market] || sourceMap["A股"];
    
    // 模拟近3年数据趋势
    const generateHistory = (current: number) => {
      const variance = current * 0.15;
      return [
        { year: "2023", value: +(current + (Math.random() - 0.5) * variance).toFixed(1) },
        { year: "2024", value: +(current + (Math.random() - 0.3) * variance).toFixed(1) },
        { year: "2025", value: +current.toFixed(1) },
      ];
    };

    return {
      value,
      source: `${source.name} - 2024年三季报`,
      sourceUrl: source.url,
      reportDate: "2024Q3",
      history: generateHistory(value),
    };
  };

  const handleRefreshRecommendations = () => {
    setIsLoadingRecommendations(true);
    // 模拟AI推荐（实际场景中会调用AI接口）
    setTimeout(() => {
      const mockRecommendations: StockRecommendation[] = [
        {
          id: "rec-1",
          stockName: "中国平安",
          stockCode: "601318",
          market: "A股",
          sector: "保险",
          currentPrice: 42.5,
          pe: createMetricWithSource(8, "PE", "601318", "A股"),
          pb: createMetricWithSource(0.9, "PB", "601318", "A股"),
          dividendYield: createMetricWithSource(5.2, "股息率", "601318", "A股"),
          roe: createMetricWithSource(12, "ROE", "601318", "A股"),
          grossMargin: createMetricWithSource(35, "毛利率", "601318", "A股"),
          reason: "保险龙头，PB不足1倍处于历史低位，股息率超5%，寿险改革见效",
          riskNote: "房地产敞口风险，利率下行压力",
          score: 85,
          priceDate: "2026-01-20",
          scoreBreakdown: { valuation: 35, dividend: 22, moat: 28 },
        },
        {
          id: "rec-2",
          stockName: "招商银行",
          stockCode: "600036",
          market: "A股",
          sector: "银行",
          currentPrice: 35.8,
          pe: createMetricWithSource(6, "PE", "600036", "A股"),
          pb: createMetricWithSource(0.85, "PB", "600036", "A股"),
          dividendYield: createMetricWithSource(4.8, "股息率", "600036", "A股"),
          roe: createMetricWithSource(16, "ROE", "600036", "A股"),
          reason: "零售银行龙头，ROE保持16%，分红率稳定，资产质量优异",
          riskNote: "息差收窄，消费贷风险",
          score: 82,
          priceDate: "2026-01-20",
          scoreBreakdown: { valuation: 36, dividend: 20, moat: 26 },
        },
        {
          id: "rec-3",
          stockName: "美的集团",
          stockCode: "000333",
          market: "A股",
          sector: "家电",
          currentPrice: 68.5,
          pe: createMetricWithSource(12, "PE", "000333", "A股"),
          dividendYield: createMetricWithSource(4.5, "股息率", "000333", "A股"),
          roe: createMetricWithSource(22, "ROE", "000333", "A股"),
          grossMargin: createMetricWithSource(28, "毛利率", "000333", "A股"),
          reason: "白电龙头，多元化布局成功，海外收入占比超40%，估值合理",
          riskNote: "地产链需求承压，海外汇率波动",
          score: 80,
          priceDate: "2026-01-20",
          scoreBreakdown: { valuation: 30, dividend: 20, moat: 30 },
        },
        {
          id: "rec-4",
          stockName: "伊利股份",
          stockCode: "600887",
          market: "A股",
          sector: "乳制品",
          currentPrice: 28.6,
          pe: createMetricWithSource(15, "PE", "600887", "A股"),
          dividendYield: createMetricWithSource(4.2, "股息率", "600887", "A股"),
          roe: createMetricWithSource(20, "ROE", "600887", "A股"),
          grossMargin: createMetricWithSource(32, "毛利率", "600887", "A股"),
          reason: "乳业双龙头之一，品牌护城河深，现金流充沛，分红稳定增长",
          riskNote: "原奶价格波动，竞争加剧",
          score: 78,
          priceDate: "2026-01-20",
          scoreBreakdown: { valuation: 28, dividend: 18, moat: 32 },
        },
        {
          id: "rec-5",
          stockName: "中国神华",
          stockCode: "601088",
          market: "A股",
          sector: "煤炭",
          currentPrice: 38.2,
          pe: createMetricWithSource(10, "PE", "601088", "A股"),
          dividendYield: createMetricWithSource(7.5, "股息率", "601088", "A股"),
          roe: createMetricWithSource(18, "ROE", "601088", "A股"),
          reason: "煤炭龙头，一体化运营，股息率超7%，现金奶牛型资产",
          riskNote: "能源转型长期压力，煤价波动",
          score: 76,
          priceDate: "2026-01-20",
          scoreBreakdown: { valuation: 32, dividend: 24, moat: 20 },
        },
        {
          id: "rec-6",
          stockName: "长江电力",
          stockCode: "600900",
          market: "A股",
          sector: "水电",
          currentPrice: 28.5,
          pe: createMetricWithSource(18, "PE", "600900", "A股"),
          dividendYield: createMetricWithSource(3.8, "股息率", "600900", "A股"),
          roe: createMetricWithSource(15, "ROE", "600900", "A股"),
          reason: "水电龙头，现金流稳定，股息逐年增长，类债券资产属性",
          riskNote: "来水不确定性，增长空间有限",
          score: 75,
          priceDate: "2026-01-20",
          scoreBreakdown: { valuation: 26, dividend: 17, moat: 32 },
        },
        {
          id: "rec-7",
          stockName: "恒生银行",
          stockCode: "00011",
          market: "港股",
          sector: "银行",
          currentPrice: 105.5,
          pe: createMetricWithSource(9, "PE", "00011", "港股"),
          dividendYield: createMetricWithSource(6.2, "股息率", "00011", "港股"),
          roe: createMetricWithSource(12, "ROE", "00011", "港股"),
          reason: "港资银行龙头，股息率超6%，资产质量优，受益于加息周期",
          riskNote: "香港经济放缓，地产相关风险",
          score: 74,
          priceDate: "2026-01-20",
          scoreBreakdown: { valuation: 30, dividend: 22, moat: 22 },
        },
        {
          id: "rec-8",
          stockName: "中国移动",
          stockCode: "00941",
          market: "港股",
          sector: "电信",
          currentPrice: 75.8,
          pe: createMetricWithSource(11, "PE", "00941", "港股"),
          dividendYield: createMetricWithSource(5.8, "股息率", "00941", "港股"),
          roe: createMetricWithSource(12, "ROE", "00941", "港股"),
          reason: "电信龙头，5G/算力双轮驱动，分红持续提升，现金流充沛",
          riskNote: "提速降费政策，竞争加剧",
          score: 73,
          priceDate: "2026-01-20",
          scoreBreakdown: { valuation: 28, dividend: 21, moat: 24 },
        },
        {
          id: "rec-9",
          stockName: "阿里巴巴",
          stockCode: "09988",
          market: "港股",
          sector: "互联网",
          currentPrice: 85.6,
          pe: createMetricWithSource(12, "PE", "09988", "港股"),
          pb: createMetricWithSource(1.5, "PB", "09988", "港股"),
          dividendYield: createMetricWithSource(2.5, "股息率", "09988", "港股"),
          roe: createMetricWithSource(10, "ROE", "09988", "港股"),
          reason: "电商龙头估值回落至历史低位，云业务和AI有增长潜力，开始分红",
          riskNote: "监管风险，竞争加剧，增速放缓",
          score: 72,
          priceDate: "2026-01-20",
          scoreBreakdown: { valuation: 32, dividend: 12, moat: 28 },
        },
        {
          id: "rec-10",
          stockName: "强生",
          stockCode: "JNJ",
          market: "美股",
          sector: "医药",
          currentPrice: 148.5,
          pe: createMetricWithSource(14, "PE", "JNJ", "美股"),
          dividendYield: createMetricWithSource(3.2, "股息率", "JNJ", "美股"),
          roe: createMetricWithSource(22, "ROE", "JNJ", "美股"),
          grossMargin: createMetricWithSource(68, "毛利率", "JNJ", "美股"),
          reason: "医药龙头，连续60年提高股息，产品线多元化，防御性强",
          riskNote: "诉讼风险，专利到期",
          score: 70,
          priceDate: "2026-01-20",
          scoreBreakdown: { valuation: 28, dividend: 15, moat: 27 },
        },
      ];
      
      setMethodology({
        ...methodology,
        recommendations: mockRecommendations,
      });
      setIsLoadingRecommendations(false);
    }, 2000);
  };

  const handleCustomAnalyze = (stockCode: string, stockName: string, additionalInfo: string, imageFiles?: File[]) => {
    setIsAnalyzing(true);
    // 模拟AI分析（实际场景中会调用AI接口）
    // imageFiles 包含用户上传的多张图片
    const hasImages = imageFiles && imageFiles.length > 0;
    setTimeout(() => {
      // 识别市场
      const detectMarket = (): "A股" | "港股" | "美股" => {
        if (!stockCode) return "A股";
        if (stockCode.startsWith("6") || stockCode.startsWith("0") || stockCode.startsWith("3")) return "A股";
        if (/^\d{5}$/.test(stockCode)) return "港股";
        return "美股";
      };
      const market = detectMarket();
      
      const mockAnalysis: CustomStockAnalysis = {
        stock: {
          id: `custom-${stockCode || stockName}`,
          stockName: stockName || stockCode || "未知股票",
          stockCode: stockCode || "待查询",
          market,
          sector: "待确认",
          currentPrice: 0,
          pe: createMetricWithSource(15, "PE", stockCode || "N/A", market),
          dividendYield: createMetricWithSource(3.5, "股息率", stockCode || "N/A", market),
          roe: createMetricWithSource(18, "ROE", stockCode || "N/A", market),
          grossMargin: createMetricWithSource(45, "毛利率", stockCode || "N/A", market),
          reason: `基于方法论分析：${stockName || stockCode} 整体符合价值投资框架`,
          riskNote: "请注意验证数据准确性，建议结合最新财报确认",
          score: 75,
          priceDate: new Date().toISOString().split("T")[0],
          scoreBreakdown: { valuation: 28, dividend: 18, moat: 29 },
        },
        analysisDetail: `
## ${stockName || stockCode} 投资价值分析

### 一、估值维度评估
根据方法论框架，该股票PE约15倍，处于合理区间。从历史估值看，当前估值位于中位数附近。

### 二、分红维度评估  
股息率约3.5%，符合"≥3%"的筛选标准。分红稳定性需进一步验证最近3年的派息记录。

### 三、护城河维度评估
需要进一步确认：
- 行业地位：是否为行业龙头或细分第一
- 毛利率水平：45%高于40%的标准
- ROE水平：18%高于15%的标准

### 四、综合评价
${additionalInfo ? `\n用户补充信息：${additionalInfo}\n` : ""}${hasImages ? `\n📷 已分析 ${imageFiles.length} 张用户上传图片\n` : ""}
综合三大维度，该股票获得75分，属于"可以关注"级别。建议进一步研究后再做投资决策。
        `.trim(),
        matchedCriteria: [
          "PE ≤ 20，估值合理",
          "股息率 ≥ 3%",
          "ROE ≥ 15%",
          "毛利率 ≥ 40%",
        ],
        missedCriteria: [
          "行业龙头地位待确认",
          "股价回撤幅度待确认",
        ],
        suggestion: "可以关注",
      };

      setMethodology({
        ...methodology,
        customAnalysis: mockAnalysis,
      });
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <TabSwitch activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="pt-28 sm:pt-36 pb-6 sm:pb-8 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === "opportunities" && (
            <OpportunityList
              opportunities={opportunities}
              onToggleExit={handleToggleExit}
            />
          )}
          {activeTab === "principles" && (
            <PrincipleList principles={principles} />
          )}
          {activeTab === "methodology" && (
            <MethodologyTab
              data={methodology}
              onRefreshRecommendations={handleRefreshRecommendations}
              onCustomAnalyze={handleCustomAnalyze}
              isLoading={isLoadingRecommendations}
              isAnalyzing={isAnalyzing}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
