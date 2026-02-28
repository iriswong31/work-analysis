export interface Opportunity {
  id: string;
  stockName: string;
  stockCode: string;
  market: "A股" | "港股" | "美股";
  starRating: number; // 1-6星
  recommendPrice: number;
  targetPrice: number;
  currentPrice?: number; // 收盘价（真实数据）
  priceDate?: string; // 价格日期
  pe?: number;
  pb?: number;
  dividendYield?: number;
  dropPercentage: number; // 档位下跌比例，如15表示15%
  recommendDate: string;
  isExited: boolean; // 已下车标记
  exitDate?: string;
  notes: string;
  source?: string;
}

export interface Principle {
  id: string;
  title: string;
  content: string;
  category: string;
  source?: string;
  createDate: string;
}

export interface PositionTier {
  tier: number;
  triggerPrice: number;
  ratio: number;
  amount: number;
  shares: number;
}

export interface PositionResult {
  totalAmount: number;
  initialPrice: number;
  dropPercentage: number;
  tiers: PositionTier[];
}

// 方法论相关类型
export interface Metric {
  name: string;
  description: string;
  threshold: string;
  weight: number;
}

export interface Dimension {
  id: string;
  name: string;
  weight: number;
  metrics: Metric[];
}

export interface ScreeningCriteria {
  must: string[];
  prefer: string[];
  avoid: string[];
}

export interface MarketPreference {
  [key: string]: {
    focus: string[];
    peRange: string;
  };
}

export interface StarRatingGuide {
  [key: string]: string;
}

export interface PositionStrategy {
  starRatingGuide: StarRatingGuide;
  buildingMethod: string;
  exitSignal: string;
}

export interface Methodology {
  title: string;
  description: string;
  extractedFrom: string;
  lastUpdated: string;
  dimensions: Dimension[];
  screeningCriteria: ScreeningCriteria;
  marketPreference: MarketPreference;
  positionStrategy: PositionStrategy;
}

export interface SectorDistribution {
  sector: string;
  count: number;
  percentage: number;
}

export interface PortfolioStats {
  totalStocks: number;
  activeStocks: number;
  exitedStocks: number;
  avgPE: number;
  avgDividendYield: number;
  marketDistribution: { [key: string]: number };
}

export interface CurrentInsights {
  portfolioStats: PortfolioStats;
  sectorDistribution: SectorDistribution[];
  keyPatterns: string[];
}

// 指标历史数据（近3年趋势）
export interface MetricHistory {
  year: string;
  value: number;
}

// 带数据源的指标
export interface MetricWithSource {
  value: number;
  source: string; // 数据来源描述
  sourceUrl: string; // 可点击的链接
  reportDate: string; // 财报日期，如"2024Q3"
  history: MetricHistory[]; // 近3年趋势
}

export interface StockRecommendation {
  id: string;
  stockName: string;
  stockCode: string;
  market: "A股" | "港股" | "美股";
  sector: string;
  currentPrice: number;
  pe: number | MetricWithSource;
  pb?: number | MetricWithSource;
  dividendYield: number | MetricWithSource;
  roe?: number | MetricWithSource;
  grossMargin?: number | MetricWithSource;
  reason: string;
  riskNote: string;
  score: number;
  priceDate: string;
  // 评分明细
  scoreBreakdown?: {
    valuation: number;
    dividend: number;
    moat: number;
  };
}

// 自定义股票分析请求
export interface CustomStockAnalysisRequest {
  stockCode: string;
  stockName?: string;
  additionalInfo?: string; // 用户输入的额外信息
  imageUrl?: string; // 用户上传的图片URL
}

// 自定义股票分析结果
export interface CustomStockAnalysis {
  stock: StockRecommendation;
  analysisDetail: string; // 详细分析文字
  matchedCriteria: string[]; // 符合的筛选标准
  missedCriteria: string[]; // 不符合的筛选标准
  suggestion: "强烈推荐" | "可以关注" | "谨慎观望" | "不建议";
}

export interface MethodologyData {
  methodology: Methodology;
  currentInsights: CurrentInsights;
  recommendations: StockRecommendation[];
  customAnalysis?: CustomStockAnalysis; // 自定义分析结果
}
