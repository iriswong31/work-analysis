import { useState } from "react";
import { Star, TrendingUp, TrendingDown, Calculator, Search, LogOut, Clock, DollarSign, RefreshCw, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Opportunity } from "@/types";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onCalculatorClick: (opportunity: Opportunity) => void;
  onAnalysisClick: (opportunity: Opportunity) => void;
  onToggleExit: (id: string) => void;
}

export function OpportunityCard({
  opportunity,
  onCalculatorClick,
  onAnalysisClick,
  onToggleExit,
}: OpportunityCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currencySymbol = opportunity.market === "A股" ? "¥" : opportunity.market === "港股" ? "HK$" : "$";
  
  // 使用数据文件中的真实价格
  const currentPrice = opportunity.currentPrice;
  const priceDate = opportunity.priceDate;
  
  // 计算价格相关指标
  const priceChange = currentPrice ? currentPrice - opportunity.recommendPrice : 0;
  const priceChangePercent = currentPrice ? ((priceChange / opportunity.recommendPrice) * 100).toFixed(2) : "0";
  const isUp = priceChange >= 0;
  
  // 计算距离目标价的空间
  const distanceToTarget = currentPrice ? ((opportunity.targetPrice / currentPrice - 1) * 100).toFixed(1) : null;
  
  // 计算当前适合买入哪一档
  const getPositionTip = () => {
    if (!currentPrice) return null;
    
    const tier1 = opportunity.recommendPrice;
    const tier2 = tier1 * (1 - opportunity.dropPercentage / 100);
    const tier3 = tier2 * (1 - opportunity.dropPercentage / 100);
    
    if (currentPrice <= tier3) {
      return { text: "适合第三档加仓", color: "text-emerald-600", bg: "bg-emerald-50", emoji: "🎯" };
    } else if (currentPrice <= tier2) {
      return { text: "适合第二档加仓", color: "text-emerald-600", bg: "bg-emerald-50", emoji: "✅" };
    } else if (currentPrice <= tier1) {
      return { text: "适合第一档建仓", color: "text-sky-600", bg: "bg-sky-50", emoji: "👍" };
    } else if (currentPrice < opportunity.targetPrice) {
      const abovePercent = ((currentPrice / tier1 - 1) * 100).toFixed(1);
      return { text: `高于建仓价 ${abovePercent}%`, color: "text-amber-600", bg: "bg-amber-50", emoji: "⏳" };
    } else {
      return { text: "已达目标价，注意止盈", color: "text-rose-600", bg: "bg-rose-50", emoji: "🎉" };
    }
  };

  const positionTip = getPositionTip();
  
  // 模拟刷新（提示用户在对话中请求更新）
  const handleRefreshPrice = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      alert("请在对话中让AI帮您更新最新收盘价");
    }, 500);
  };
  
  const renderStars = () => {
    return Array.from({ length: 6 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < opportunity.starRating
            ? "text-amber-400 fill-amber-400"
            : "text-gray-200 fill-gray-200"
        }`}
      />
    ));
  };

  const marketColors: Record<string, string> = {
    "A股": "bg-red-100 text-red-700 border-red-200",
    "港股": "bg-orange-100 text-orange-700 border-orange-200",
    "美股": "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        opportunity.isExited
          ? "bg-gray-50 border-gray-200 opacity-70"
          : "bg-white border-sky-100 hover:border-sky-300"
      }`}
    >
      {/* 已下车标记 */}
      {opportunity.isExited && (
        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
          <div className="absolute top-3 -right-6 rotate-45 bg-gray-400 text-white text-xs px-8 py-1 shadow">
            已下车
          </div>
        </div>
      )}

      {/* 卡片内容 */}
      <div className="p-5">
        {/* 顶部：名称、代码、市场 */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {opportunity.stockName}
              <Badge variant="outline" className={`text-xs ${marketColors[opportunity.market]}`}>
                {opportunity.market}
              </Badge>
            </h3>
            <p className="text-sm text-slate-500">{opportunity.stockCode}</p>
          </div>
          <div className="flex items-center gap-0.5">{renderStars()}</div>
        </div>

        {/* 当前价格区域 - 显示真实收盘价 */}
        {!opportunity.isExited && (
          <div className={`mb-4 p-3 rounded-xl border ${
            currentPrice 
              ? (isUp ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100" 
                      : "bg-gradient-to-r from-red-50 to-rose-50 border-red-100")
              : "bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200"
          }`}>
            {currentPrice ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${isUp ? "text-emerald-500" : "text-red-500"}`} />
                    <span className="text-xs text-slate-500">收盘价</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${isUp ? "text-emerald-600" : "text-red-600"}`}>
                      {currencySymbol}{currentPrice}
                    </span>
                    <span className={`text-sm font-medium flex items-center ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                      {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {isUp ? "+" : ""}{priceChangePercent}%
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefreshPrice}
                      disabled={isRefreshing}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                      title="在对话中请求更新价格"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
                
                {/* 位置提示 */}
                {positionTip && (
                  <div className={`flex items-center justify-between text-xs p-2 rounded-lg ${positionTip.bg}`}>
                    <span className={`font-medium ${positionTip.color}`}>
                      {positionTip.emoji} {positionTip.text}
                    </span>
                    {distanceToTarget && Number(distanceToTarget) > 0 && (
                      <span className="text-sky-600">
                        📈 距目标价 {distanceToTarget}%
                      </span>
                    )}
                  </div>
                )}
                
                {priceDate && (
                  <p className="text-xs text-slate-400 mt-2">数据日期: {priceDate}</p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">暂无价格数据</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshPrice}
                  disabled={isRefreshing}
                  className="h-7 px-3 text-xs border-sky-200 text-sky-600 hover:bg-sky-50"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "获取中..." : "请求更新"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 建仓价与目标价 */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg">
          <div>
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              建仓价
            </p>
            <p className="text-lg font-bold text-sky-700">
              {currencySymbol}{opportunity.recommendPrice}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              目标价
            </p>
            <p className="text-lg font-bold text-emerald-600">
              {currencySymbol}{opportunity.targetPrice}
            </p>
          </div>
        </div>

        {/* 股息率（如有） */}
        {opportunity.dividendYield && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
              股息率 {opportunity.dividendYield}%
            </Badge>
          </div>
        )}

        {/* 推荐日期与下跌比例 */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {opportunity.recommendDate}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            每档下跌 {opportunity.dropPercentage}%
          </span>
        </div>

        {/* 备注 */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{opportunity.notes}</p>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onCalculatorClick(opportunity)}
            className="flex-1 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Calculator className="w-4 h-4 mr-1" />
            建仓计算
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAnalysisClick(opportunity)}
            className="flex-1 border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300"
          >
            <Search className="w-4 h-4 mr-1" />
            最新分析
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleExit(opportunity.id)}
            className={`px-3 ${
              opportunity.isExited
                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
