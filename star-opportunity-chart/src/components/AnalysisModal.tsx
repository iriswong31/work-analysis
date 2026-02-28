import { useState, useEffect } from "react";
import { X, Search, ExternalLink, Loader2, FileText, TrendingUp, TrendingDown, AlertCircle, DollarSign, RefreshCw, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Opportunity } from "@/types";

interface AnalysisModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}

interface StockQuote {
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: string;
  pe: number | null;
  pb: number | null;
  marketCap: string;
  updateTime: string;
  source: string;
}

export function AnalysisModal({ opportunity, onClose }: AnalysisModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 通过Firecrawl获取实时股票数据
  const fetchRealStockData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 根据市场选择合适的数据源URL
      let targetUrl = "";
      if (opportunity.market === "美股") {
        targetUrl = `https://finance.yahoo.com/quote/${opportunity.stockCode}`;
      } else if (opportunity.market === "港股") {
        targetUrl = `https://quote.eastmoney.com/hk/${opportunity.stockCode.replace(".HK", "")}.html`;
      } else {
        // A股
        const prefix = opportunity.stockCode.startsWith("6") ? "sh" : "sz";
        targetUrl = `https://quote.eastmoney.com/${prefix}${opportunity.stockCode}.html`;
      }

      // 调用Firecrawl MCP获取实时数据
      // 注意：这里需要通过用户在对话中触发Firecrawl skill来获取数据
      // 由于MCP调用需要在Agent层面执行，这里设置提示信息
      
      // 暂时显示提示，引导用户使用Firecrawl获取数据
      setQuote(null);
      setError(`需要获取 ${opportunity.stockName} 的实时数据，请点击下方链接查看最新行情，或在对话中输入"获取${opportunity.stockName}最新行情"触发数据抓取。`);
      
    } catch (err) {
      setError("获取数据失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealStockData();
  }, [opportunity.stockCode]);

  // 生成搜索链接
  const getSearchLinks = () => {
    const stockName = encodeURIComponent(opportunity.stockName);
    
    if (opportunity.market === "美股") {
      return [
        {
          name: "雅虎财经",
          url: `https://finance.yahoo.com/quote/${opportunity.stockCode}`,
          icon: "📊",
          description: "实时行情、财报、分析"
        },
        {
          name: "雪球",
          url: `https://xueqiu.com/S/${opportunity.stockCode}`,
          icon: "❄️",
          description: "中文社区讨论、研报"
        },
        {
          name: "富途牛牛",
          url: `https://www.futunn.com/stock/${opportunity.stockCode}-US`,
          icon: "🐂",
          description: "港美股交易平台"
        },
        {
          name: "Seeking Alpha",
          url: `https://seekingalpha.com/symbol/${opportunity.stockCode}`,
          icon: "📰",
          description: "深度分析文章"
        },
      ];
    }

    if (opportunity.market === "港股") {
      return [
        {
          name: "东方财富",
          url: `https://quote.eastmoney.com/hk/${opportunity.stockCode.replace(".HK", "")}.html`,
          icon: "📊",
          description: "实时行情、资金流向"
        },
        {
          name: "雪球",
          url: `https://xueqiu.com/S/${opportunity.stockCode}`,
          icon: "❄️",
          description: "中文社区讨论"
        },
        {
          name: "富途牛牛",
          url: `https://www.futunn.com/stock/${opportunity.stockCode}`,
          icon: "🐂",
          description: "港股交易平台"
        },
        {
          name: "阿斯达克",
          url: `https://www.aastocks.com/tc/stocks/quote/quick-quote.aspx?symbol=${opportunity.stockCode.replace(".HK", "")}`,
          icon: "📈",
          description: "港股专业数据"
        },
      ];
    }

    // A股
    return [
      {
        name: "东方财富",
        url: `https://quote.eastmoney.com/${opportunity.stockCode.startsWith("6") ? "sh" : "sz"}${opportunity.stockCode}.html`,
        icon: "📊",
        description: "实时行情、资金流向"
      },
      {
        name: "雪球",
        url: `https://xueqiu.com/S/${opportunity.stockCode.startsWith("6") ? "SH" : "SZ"}${opportunity.stockCode}`,
        icon: "❄️",
        description: "中文社区讨论"
      },
      {
        name: "同花顺",
        url: `https://stockpage.10jqka.com.cn/${opportunity.stockCode}/`,
        icon: "📈",
        description: "技术分析、诊股"
      },
      {
        name: "百度股市通",
        url: `https://gushitong.baidu.com/stock/ab-${opportunity.stockCode}`,
        icon: "🔍",
        description: "AI智能分析"
      },
    ];
  };

  const links = getSearchLinks();
  const currencySymbol = opportunity.market === "A股" ? "¥" : opportunity.market === "港股" ? "HK$" : "$";

  // 计算预期收益空间
  const expectedUpside = ((opportunity.targetPrice - opportunity.recommendPrice) / opportunity.recommendPrice * 100).toFixed(1);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-pink-50 border-pink-200 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-slate-800">{opportunity.stockName}</span>
              <span className="text-slate-400 font-normal ml-2 text-sm">{opportunity.stockCode}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* 提示信息卡片 */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                实时行情查询
              </h3>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                <span className="ml-2 text-slate-400">正在获取数据...</span>
              </div>
            ) : error ? (
              <div className="py-4">
                <p className="text-slate-300 text-sm leading-relaxed mb-4">{error}</p>
                <p className="text-amber-400 text-xs">💡 提示：点击下方链接可直接查看最新行情</p>
              </div>
            ) : quote && (
              <>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-4xl font-bold">
                    {currencySymbol}{quote.currentPrice}
                  </span>
                  <span className={`text-lg font-medium flex items-center gap-1 ${
                    quote.change >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {quote.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {quote.change >= 0 ? "+" : ""}{quote.change} ({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent}%)
                  </span>
                </div>

                {/* 关键指标 */}
                <div className="grid grid-cols-4 gap-3 text-center text-sm mb-4">
                  {quote.pe && (
                    <div className="bg-slate-700/50 rounded-lg p-2">
                      <p className="text-slate-400 text-xs">PE</p>
                      <p className="font-medium">{quote.pe}</p>
                    </div>
                  )}
                  {quote.pb && (
                    <div className="bg-slate-700/50 rounded-lg p-2">
                      <p className="text-slate-400 text-xs">PB</p>
                      <p className="font-medium">{quote.pb}</p>
                    </div>
                  )}
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <p className="text-slate-400 text-xs">今日最高</p>
                    <p className="font-medium">{currencySymbol}{quote.high}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <p className="text-slate-400 text-xs">今日最低</p>
                    <p className="font-medium">{currencySymbol}{quote.low}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  数据来源: {quote.source} | 更新时间: {quote.updateTime}
                </p>
              </>
            )}
          </div>

          {/* 建仓信息 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl text-center">
              <p className="text-xs text-slate-500 mb-1">建仓价</p>
              <p className="text-xl font-bold text-sky-700">{currencySymbol}{opportunity.recommendPrice}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl text-center">
              <p className="text-xs text-slate-500 mb-1">目标价</p>
              <p className="text-xl font-bold text-emerald-700">{currencySymbol}{opportunity.targetPrice}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl text-center">
              <p className="text-xs text-slate-500 mb-1">预期空间</p>
              <p className="text-xl font-bold text-amber-700">+{expectedUpside}%</p>
            </div>
          </div>

          {/* 原始数据参考（PE等） */}
          {(opportunity.pe || opportunity.pb || opportunity.dividendYield) && (
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-2">建仓时数据参考</p>
              <div className="flex flex-wrap gap-2">
                {opportunity.pe && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    PE {opportunity.pe}
                  </Badge>
                )}
                {opportunity.pb && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                    PB {opportunity.pb}
                  </Badge>
                )}
                {opportunity.dividendYield && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    股息率 {opportunity.dividendYield}%
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 快捷链接 */}
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              点击查看实时行情
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {links.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all group"
                >
                  <span className="text-xl">{link.icon}</span>
                  <div className="flex-1">
                    <span className="font-medium text-slate-700 group-hover:text-pink-600 transition-colors block">
                      {link.name}
                    </span>
                    <span className="text-xs text-slate-400">{link.description}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-pink-500 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* 投资逻辑 */}
          <div className="p-4 bg-white rounded-xl border border-pink-100">
            <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              投资逻辑
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">{opportunity.notes}</p>
          </div>

          {/* 风险提示 */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              以上信息仅供参考，不构成投资建议。投资有风险，入市需谨慎。请以实际交易平台数据为准。
            </p>
          </div>

          {/* 关闭按钮 */}
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-11 border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
