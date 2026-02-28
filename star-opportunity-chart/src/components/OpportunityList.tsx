import { useState } from "react";
import { Opportunity } from "@/types";
import { OpportunityCard } from "./OpportunityCard";
import { PositionCalculator } from "./PositionCalculator";
import { AnalysisModal } from "./AnalysisModal";
import { Filter, ArrowUpDown, Eye, EyeOff, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OpportunityListProps {
  opportunities: Opportunity[];
  onToggleExit: (id: string) => void;
}

export function OpportunityList({ opportunities, onToggleExit }: OpportunityListProps) {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showExited, setShowExited] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "star" | "buyable">("date");

  const handleCalculatorClick = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setShowCalculator(true);
  };

  const handleAnalysisClick = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setShowAnalysis(true);
  };

  // 计算适合买入的程度（越低越好买）
  const getBuyScore = (opp: Opportunity) => {
    if (!opp.currentPrice) return 999; // 无价格的排最后
    const ratio = opp.currentPrice / opp.recommendPrice;
    return ratio; // 比例越低，越适合买入
  };

  // 过滤和排序
  const filteredOpportunities = opportunities
    .filter((opp) => showExited || !opp.isExited)
    .sort((a, b) => {
      if (sortBy === "buyable") {
        // 按适合买入程度排序（当前价/建仓价比例越低越靠前）
        return getBuyScore(a) - getBuyScore(b);
      }
      if (sortBy === "star") {
        if (b.starRating !== a.starRating) {
          return b.starRating - a.starRating;
        }
        return new Date(b.recommendDate).getTime() - new Date(a.recommendDate).getTime();
      }
      // 默认按日期排序
      const dateA = new Date(a.recommendDate).getTime();
      const dateB = new Date(b.recommendDate).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.starRating - a.starRating;
    });

  const activeCount = opportunities.filter((opp) => !opp.isExited).length;
  const exitedCount = opportunities.filter((opp) => opp.isExited).length;
  
  // 统计适合买入的数量
  const buyableCount = opportunities.filter((opp) => {
    if (opp.isExited || !opp.currentPrice) return false;
    return opp.currentPrice <= opp.recommendPrice;
  }).length;

  return (
    <div>
      {/* 筛选排序栏 */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-sky-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-sky-600" />
          <span className="text-sm text-slate-600">
            共 <span className="font-bold text-sky-600">{activeCount}</span> 个持仓机会
            {buyableCount > 0 && (
              <span className="text-emerald-600 ml-2">
                🎯 {buyableCount} 个适合建仓
              </span>
            )}
            {exitedCount > 0 && (
              <span className="text-slate-400 ml-2">
                ，{exitedCount} 个已下车
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy("buyable")}
            className={`text-xs ${
              sortBy === "buyable"
                ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <TrendingDown className="w-3 h-3 mr-1" />
            适合买入
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExited(!showExited)}
            className={`text-xs ${
              showExited
                ? "bg-gray-100 border-gray-300"
                : "border-sky-200 text-sky-600"
            }`}
          >
            {showExited ? (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                隐藏已下车
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 mr-1" />
                显示已下车
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === "date" ? "star" : "date")}
            className={`text-xs ${
              sortBy === "date" || sortBy === "star"
                ? "border-sky-200 text-sky-600"
                : "border-slate-200 text-slate-500"
            }`}
          >
            <ArrowUpDown className="w-3 h-3 mr-1" />
            {sortBy === "star" ? "按星级" : "按日期"}
          </Button>
        </div>
      </div>

      {/* 数据来源提示 */}
      <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-700">
        📊 收盘价数据来源于网络搜索，更新日期见各卡片标注。如需更新最新价格，请在对话中输入"更新股票价格"
      </div>

      {/* 机会卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOpportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            onCalculatorClick={handleCalculatorClick}
            onAnalysisClick={handleAnalysisClick}
            onToggleExit={onToggleExit}
          />
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg">暂无投资机会</p>
          <p className="text-sm mt-2">通过对话添加新的投资机会</p>
        </div>
      )}

      {/* 建仓计算器弹窗 */}
      {showCalculator && selectedOpp && (
        <PositionCalculator
          opportunity={selectedOpp}
          onClose={() => setShowCalculator(false)}
        />
      )}

      {/* 分析弹窗 */}
      {showAnalysis && selectedOpp && (
        <AnalysisModal
          opportunity={selectedOpp}
          onClose={() => setShowAnalysis(false)}
        />
      )}
    </div>
  );
}
