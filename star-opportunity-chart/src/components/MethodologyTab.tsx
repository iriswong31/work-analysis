import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MethodologyData,
  StockRecommendation,
  CustomStockAnalysis,
  MetricWithSource,
} from "@/types";
import { MetricValue } from "./MetricTooltip";
import { CustomStockAnalyzer } from "./CustomStockAnalyzer";
import {
  Target,
  TrendingUp,
  PieChart,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  BarChart3,
  Shield,
  Coins,
  Search,
} from "lucide-react";

interface MethodologyTabProps {
  data: MethodologyData;
  onRefreshRecommendations: () => void;
  onCustomAnalyze: (stockCode: string, stockName: string, additionalInfo: string, imageFiles?: File[]) => void;
  isLoading: boolean;
  isAnalyzing: boolean;
}

// 获取指标显示值
function getMetricDisplayValue(value: number | MetricWithSource | undefined): string {
  if (value === undefined) return "-";
  if (typeof value === "number") return String(value);
  return String(value.value);
}

export function MethodologyTab({
  data,
  onRefreshRecommendations,
  onCustomAnalyze,
  isLoading,
  isAnalyzing,
}: MethodologyTabProps) {
  const { methodology, currentInsights, recommendations, customAnalysis } = data;
  const [activeSection, setActiveSection] = useState<"framework" | "insights" | "recommendations" | "analyze">("framework");

  const dimensionIcons: Record<string, React.ReactNode> = {
    valuation: <BarChart3 className="w-5 h-5" />,
    dividend: <Coins className="w-5 h-5" />,
    moat: <Shield className="w-5 h-5" />,
  };

  const dimensionColors: Record<string, string> = {
    valuation: "from-blue-500 to-cyan-400",
    dividend: "from-green-500 to-emerald-400",
    moat: "from-purple-500 to-pink-400",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 顶部导航 - 移动端优化为2x2网格 */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 p-1">
        <Button
          variant={activeSection === "framework" ? "default" : "outline"}
          onClick={() => setActiveSection("framework")}
          className={`${activeSection === "framework" ? "bg-gradient-to-r from-primary to-primary-light" : ""} text-xs sm:text-sm`}
          size="sm"
        >
          <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          选股框架
        </Button>
        <Button
          variant={activeSection === "insights" ? "default" : "outline"}
          onClick={() => setActiveSection("insights")}
          className={`${activeSection === "insights" ? "bg-gradient-to-r from-secondary to-pink-400" : ""} text-xs sm:text-sm`}
          size="sm"
        >
          <PieChart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          持仓洞察
        </Button>
        <Button
          variant={activeSection === "recommendations" ? "default" : "outline"}
          onClick={() => setActiveSection("recommendations")}
          className={`${activeSection === "recommendations" ? "bg-gradient-to-r from-amber-500 to-orange-400" : ""} text-xs sm:text-sm`}
          size="sm"
        >
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          AI推荐
        </Button>
        <Button
          variant={activeSection === "analyze" ? "default" : "outline"}
          onClick={() => setActiveSection("analyze")}
          className={`${activeSection === "analyze" ? "bg-gradient-to-r from-violet-500 to-purple-500" : ""} text-xs sm:text-sm`}
          size="sm"
        >
          <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          股票分析
        </Button>
      </div>

      {/* 选股框架 */}
      {activeSection === "framework" && (
        <div className="space-y-4 sm:space-y-6">
          {/* 方法论标题 */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-sky-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="w-6 h-6 text-primary" />
                {methodology.title}
              </CardTitle>
              <p className="text-muted-foreground">{methodology.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">基于 {methodology.extractedFrom}</Badge>
                <Badge variant="outline">更新于 {methodology.lastUpdated}</Badge>
              </div>
            </CardHeader>
          </Card>

          {/* 三大维度 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {methodology.dimensions.map((dim) => (
              <Card key={dim.id} className="border-0 shadow-md overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${dimensionColors[dim.id]}`} />
                <CardHeader className="pb-2 p-3 sm:p-6">
                  <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                    <span className="flex items-center gap-2">
                      {dimensionIcons[dim.id]}
                      {dim.name}
                    </span>
                    <Badge className={`bg-gradient-to-r ${dimensionColors[dim.id]} text-white text-xs`}>
                      权重 {dim.weight}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0">
                  {dim.metrics.map((metric) => (
                    <div key={metric.name} className="p-2 sm:p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm sm:text-base">{metric.name}</span>
                        <Badge variant="outline" className="text-xs">{metric.weight}%</Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{metric.description}</p>
                      <p className="text-xs sm:text-sm text-primary font-medium mt-1">{metric.threshold}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 筛选标准 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">筛选标准</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    必须满足
                  </h4>
                  <ul className="space-y-2">
                    {methodology.screeningCriteria.must.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3 text-blue-600">
                    <TrendingUp className="w-5 h-5" />
                    优先考虑
                  </h4>
                  <ul className="space-y-2">
                    {methodology.screeningCriteria.prefer.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 mt-0.5">○</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3 text-red-600">
                    <XCircle className="w-5 h-5" />
                    回避风险
                  </h4>
                  <ul className="space-y-2">
                    {methodology.screeningCriteria.avoid.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500 mt-0.5">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 仓位策略 */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                仓位策略
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">星级仓位指南</h4>
                  <div className="space-y-2">
                    {Object.entries(methodology.positionStrategy.starRatingGuide).map(([star, desc]) => (
                      <div key={star} className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="font-medium text-amber-600">{star}</span>
                        <span className="text-sm text-muted-foreground">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg">
                    <h4 className="font-medium mb-2">建仓方法</h4>
                    <p className="text-sm text-muted-foreground">{methodology.positionStrategy.buildingMethod}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <h4 className="font-medium mb-2">止盈信号</h4>
                    <p className="text-sm text-muted-foreground">{methodology.positionStrategy.exitSignal}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 持仓洞察 */}
      {activeSection === "insights" && (
        <div className="space-y-6">
          {/* 统计概览 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {currentInsights.portfolioStats.activeStocks}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">持仓标的</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
              <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {currentInsights.portfolioStats.avgPE}x
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">平均PE</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-amber-600">
                  {currentInsights.portfolioStats.avgDividendYield}%
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">平均股息率</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {Object.keys(currentInsights.portfolioStats.marketDistribution).length}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">覆盖市场</p>
              </CardContent>
            </Card>
          </div>

          {/* 市场分布 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">市场分布</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4 sm:flex-wrap">
                {Object.entries(currentInsights.portfolioStats.marketDistribution).map(([market, count]) => (
                  <div
                    key={market}
                    className="flex-1 min-w-0 sm:min-w-[120px] p-2 sm:p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl text-center"
                  >
                    <div className="text-xl sm:text-2xl font-bold">{count}</div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{market}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 行业分布 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">行业分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentInsights.sectorDistribution.map((sector) => (
                  <div key={sector.sector} className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium">{sector.sector}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
                        style={{ width: `${sector.percentage}%` }}
                      />
                    </div>
                    <span className="w-16 text-sm text-right">{sector.count}只 ({sector.percentage}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 关键规律 */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-500" />
                发现的关键规律
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {currentInsights.keyPatterns.map((pattern, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </span>
                    <p className="text-sm">{pattern}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI推荐 */}
      {activeSection === "recommendations" && (
        <div className="space-y-4 sm:space-y-6">
          {/* 刷新按钮 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">基于方法论的AI选股推荐</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                根据上述选股框架，筛选出符合条件的潜力标的
              </p>
            </div>
            <Button
              onClick={onRefreshRecommendations}
              disabled={isLoading}
              className="bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 w-full sm:w-auto"
              size="sm"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  AI分析中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新推荐
                </>
              )}
            </Button>
          </div>

          {/* 推荐列表 */}
          {recommendations.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 sm:py-12 text-center">
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-amber-400 mb-4" />
                <h4 className="text-base sm:text-lg font-medium mb-2">点击"刷新推荐"获取AI选股建议</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  AI将基于上述方法论，从市场中筛选出10只潜力股票
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {recommendations.map((stock, index) => (
                <Card key={stock.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2 p-3 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </span>
                          {stock.stockName}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {stock.stockCode} · {stock.market} · {stock.sector}
                        </p>
                      </div>
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-400 text-white text-xs">
                        {stock.score}分
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0">
                    <div className="grid grid-cols-4 gap-1 sm:gap-2">
                      <MetricValue label="现价" value={stock.currentPrice} />
                      <MetricValue label="PE" value={stock.pe} unit="x" />
                      <MetricValue label="股息率" value={stock.dividendYield} unit="%" />
                      <MetricValue label="ROE" value={stock.roe || 0} unit="%" />
                    </div>
                    <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-green-700">{stock.reason}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-amber-700">⚠️ {stock.riskNote}</p>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      数据日期: {stock.priceDate}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 自定义分析 */}
      {activeSection === "analyze" && (
        <CustomStockAnalyzer
          onAnalyze={onCustomAnalyze}
          analysis={customAnalysis || null}
          isLoading={isAnalyzing}
        />
      )}
    </div>
  );
}
