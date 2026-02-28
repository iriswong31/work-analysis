/**
 * 交付物筛选组件
 */
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DeliverableCategory, CATEGORY_CONFIG } from '@/types/deliverable';
import { 
  Search, 
  Filter,
  FileSearch, 
  Palette, 
  Code, 
  Package, 
  FileText,
  LayoutGrid
} from 'lucide-react';

interface DeliverableFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
}

// 图标映射
const iconMap: Record<string, React.ElementType> = {
  FileSearch,
  Palette,
  Code,
  Package,
  FileText
};

export function DeliverableFilter({
  selectedCategory,
  onCategoryChange,
  searchKeyword,
  onSearchChange
}: DeliverableFilterProps) {
  const categories = [
    { value: 'all', label: '全部', icon: LayoutGrid },
    ...Object.values(CATEGORY_CONFIG).map(cat => ({
      value: cat.value,
      label: cat.label,
      icon: iconMap[cat.icon] || FileText
    }))
  ];

  return (
    <div className="glass rounded-xl p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="搜索交付物..."
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-700 text-white 
                       placeholder:text-zinc-500 focus:border-iris-primary"
          />
        </div>

        {/* 分类筛选 */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-zinc-500 hidden lg:block" />
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isActive = selectedCategory === cat.value;
            return (
              <Button
                key={cat.value}
                variant="ghost"
                size="sm"
                onClick={() => onCategoryChange(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                           transition-all duration-200
                           ${isActive 
                             ? 'bg-iris-primary/20 text-iris-primary border border-iris-primary/30' 
                             : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                           }`}
              >
                <IconComponent className="w-4 h-4" />
                {cat.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DeliverableFilter;
