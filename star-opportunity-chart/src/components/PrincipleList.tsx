import { useState } from "react";
import { Principle } from "@/types";
import { PrincipleCard } from "./PrincipleCard";
import { Filter, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PrincipleListProps {
  principles: Principle[];
}

export function PrincipleList({ principles }: PrincipleListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 获取所有分类
  const categories = Array.from(new Set(principles.map((p) => p.category)));

  // 过滤
  const filteredPrinciples = selectedCategory
    ? principles.filter((p) => p.category === selectedCategory)
    : principles;

  return (
    <div>
      {/* 分类筛选栏 */}
      <div className="mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-100 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-pink-500" />
            <span>分类筛选：</span>
          </div>
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={`text-xs ${
              selectedCategory === null
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                : "border-pink-200 text-pink-600 hover:bg-pink-50"
            }`}
          >
            全部
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                  : "border-pink-200 text-pink-600 hover:bg-pink-50"
              }`}
            >
              <Tag className="w-3 h-3 mr-1" />
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
        <span>
          共 <span className="font-bold text-pink-600">{filteredPrinciples.length}</span> 条投资理念
        </span>
      </div>

      {/* 理念卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPrinciples.map((principle) => (
          <PrincipleCard key={principle.id} principle={principle} />
        ))}
      </div>

      {filteredPrinciples.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg">暂无投资理念</p>
          <p className="text-sm mt-2">点击右上角按钮添加新理念</p>
        </div>
      )}
    </div>
  );
}
