import { useState } from "react";
import { Plus, Lightbulb, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Principle } from "@/types";

interface AddPrincipleModalProps {
  onClose: () => void;
  onAdd: (principle: Principle) => void;
}

const CATEGORIES = [
  "投资心态",
  "选股标准",
  "仓位管理",
  "买入策略",
  "卖出策略",
  "风险控制",
  "价值投资",
  "行业研究",
];

export function AddPrincipleModal({ onClose, onAdd }: AddPrincipleModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "投资心态",
    source: "",
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.content) {
      return;
    }

    const newPrinciple: Principle = {
      id: `prin-${Date.now()}`,
      title: formData.title,
      content: formData.content,
      category: formData.category,
      source: formData.source || undefined,
      createDate: new Date().toISOString().split("T")[0],
    };

    onAdd(newPrinciple);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-white to-pink-50 border-pink-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-800">新增投资理念</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* 标题 */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">理念标题 *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="如：不要试图预测市场"
              className="border-pink-200"
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block flex items-center gap-2">
              <Tag className="w-4 h-4" />
              分类
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={formData.category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`text-xs ${
                    formData.category === cat
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                      : "border-pink-200 text-pink-600 hover:bg-pink-50"
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">理念内容 *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="详细描述这条投资理念的内容、适用场景、注意事项等..."
              className="w-full h-32 px-3 py-2 text-sm border border-pink-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* 来源 */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">来源（可选）</label>
            <Input
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="如：《聪明的投资者》/ 巴菲特"
              className="border-pink-200"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-pink-200 text-slate-600"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加理念
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
