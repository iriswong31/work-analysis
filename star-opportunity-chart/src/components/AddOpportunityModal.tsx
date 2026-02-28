import { useState } from "react";
import { X, Plus, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Opportunity } from "@/types";

interface AddOpportunityModalProps {
  onClose: () => void;
  onAdd: (opportunity: Opportunity) => void;
}

export function AddOpportunityModal({ onClose, onAdd }: AddOpportunityModalProps) {
  const [formData, setFormData] = useState({
    stockName: "",
    stockCode: "",
    market: "A股" as "A股" | "港股" | "美股",
    starRating: 4,
    recommendPrice: "",
    targetPrice: "",
    pe: "",
    dividendYield: "",
    dropPercentage: "10",
    notes: "",
  });

  const handleSubmit = () => {
    if (!formData.stockName || !formData.stockCode || !formData.recommendPrice || !formData.targetPrice) {
      return;
    }

    const newOpportunity: Opportunity = {
      id: `opp-${Date.now()}`,
      stockName: formData.stockName,
      stockCode: formData.stockCode,
      market: formData.market,
      starRating: formData.starRating,
      recommendPrice: parseFloat(formData.recommendPrice),
      targetPrice: parseFloat(formData.targetPrice),
      pe: formData.pe ? parseFloat(formData.pe) : undefined,
      dividendYield: formData.dividendYield ? parseFloat(formData.dividendYield) : undefined,
      dropPercentage: parseInt(formData.dropPercentage) || 10,
      recommendDate: new Date().toISOString().split("T")[0],
      isExited: false,
      notes: formData.notes,
    };

    onAdd(newOpportunity);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-white to-sky-50 border-sky-200 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-800">新增投资机会</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">股票名称 *</label>
              <Input
                value={formData.stockName}
                onChange={(e) => setFormData({ ...formData, stockName: e.target.value })}
                placeholder="如：贵州茅台"
                className="border-sky-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">股票代码 *</label>
              <Input
                value={formData.stockCode}
                onChange={(e) => setFormData({ ...formData, stockCode: e.target.value })}
                placeholder="如：600519"
                className="border-sky-200"
              />
            </div>
          </div>

          {/* 市场和星级 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">市场</label>
              <div className="flex gap-2">
                {(["A股", "港股", "美股"] as const).map((market) => (
                  <Button
                    key={market}
                    type="button"
                    variant={formData.market === market ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, market })}
                    className={formData.market === market ? "bg-sky-500" : "border-sky-200"}
                  >
                    {market}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">星级评分</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, starRating: rating })}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        rating <= formData.starRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200 fill-gray-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 价格信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">建仓价 *</label>
              <Input
                type="number"
                value={formData.recommendPrice}
                onChange={(e) => setFormData({ ...formData, recommendPrice: e.target.value })}
                placeholder="首档买入价格"
                className="border-sky-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">目标价 *</label>
              <Input
                type="number"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                placeholder="预期卖出价格"
                className="border-sky-200"
              />
            </div>
          </div>

          {/* 估值指标 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">PE</label>
              <Input
                type="number"
                value={formData.pe}
                onChange={(e) => setFormData({ ...formData, pe: e.target.value })}
                placeholder="市盈率"
                className="border-sky-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">股息率 %</label>
              <Input
                type="number"
                value={formData.dividendYield}
                onChange={(e) => setFormData({ ...formData, dividendYield: e.target.value })}
                placeholder="年度股息率"
                className="border-sky-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">档位下跌 %</label>
              <Input
                type="number"
                value={formData.dropPercentage}
                onChange={(e) => setFormData({ ...formData, dropPercentage: e.target.value })}
                placeholder="每档下跌比例"
                className="border-sky-200"
              />
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">投资逻辑</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="简述投资理由、关键指标、风险提示等..."
              className="w-full h-24 px-3 py-2 text-sm border border-sky-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-sky-200 text-slate-600"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加机会
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
