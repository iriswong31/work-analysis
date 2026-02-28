import { useState } from "react";
import { X, Calculator, TrendingDown, Wallet, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Opportunity } from "@/types";
import { calculatePositions, formatCurrency, formatNumber } from "@/utils/calculator";

interface PositionCalculatorProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export function PositionCalculator({ opportunity, onClose }: PositionCalculatorProps) {
  const [totalAmount, setTotalAmount] = useState<string>("100000");
  const [customPrice, setCustomPrice] = useState<string>(opportunity.recommendPrice.toString());

  const amount = parseFloat(totalAmount) || 0;
  const price = parseFloat(customPrice) || opportunity.recommendPrice;
  const result = calculatePositions(amount, price, opportunity.dropPercentage);

  const tierColors = [
    { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-500" },
    { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-500" },
    { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-500" },
  ];

  const getCurrencySymbol = () => {
    switch (opportunity.market) {
      case "港股": return "HK$";
      case "美股": return "$";
      default: return "¥";
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-white to-sky-50 border-sky-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-slate-800">{opportunity.stockName}</span>
              <span className="text-slate-400 font-normal ml-2 text-sm">建仓计算器</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* 输入区 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                投资总金额
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="pl-10 h-12 text-lg font-bold border-sky-200 focus:border-sky-400"
                  placeholder="100000"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                首档买入价
              </label>
              <div className="relative">
                <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="pl-10 h-12 text-lg font-bold border-sky-200 focus:border-sky-400"
                  placeholder={opportunity.recommendPrice.toString()}
                />
              </div>
            </div>
          </div>

          {/* 档位下跌比例提示 */}
          <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-sm text-amber-700">
              每档下跌 <span className="font-bold text-amber-900">{opportunity.dropPercentage}%</span> 触发下一档建仓
            </span>
          </div>

          {/* 三档计算结果 */}
          <div className="space-y-3">
            {result.tiers.map((tier, index) => (
              <div
                key={tier.tier}
                className={`p-4 rounded-xl border-2 ${tierColors[index].bg} ${tierColors[index].border} transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full ${tierColors[index].badge} text-white text-xs font-bold flex items-center justify-center`}>
                      {tier.tier}
                    </span>
                    <span className={`font-semibold ${tierColors[index].text}`}>
                      第{tier.tier}档 ({tier.ratio * 100}%)
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${tierColors[index].text}`}>
                    {getCurrencySymbol()}{tier.triggerPrice}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">买入金额：</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(tier.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">买入股数：</span>
                    <span className="font-semibold text-slate-700">{formatNumber(tier.shares)} 股</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 汇总信息 */}
          <div className="p-4 bg-gradient-to-r from-sky-100 to-blue-100 rounded-xl border border-sky-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 mb-1">总投资</p>
                <p className="text-lg font-bold text-sky-700">{formatCurrency(amount)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">总股数</p>
                <p className="text-lg font-bold text-sky-700">
                  {formatNumber(result.tiers.reduce((sum, t) => sum + t.shares, 0))} 股
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">平均成本</p>
                <p className="text-lg font-bold text-sky-700">
                  {getCurrencySymbol()}
                  {(amount / result.tiers.reduce((sum, t) => sum + t.shares, 0) || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* 关闭按钮 */}
          <Button
            onClick={onClose}
            className="w-full h-12 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            完成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
