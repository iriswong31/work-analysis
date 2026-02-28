/**
 * 交付物卡片组件
 */
import { Card } from '@/components/ui/card';
import { DeliverableListItem, CATEGORY_CONFIG } from '@/types/deliverable';
import { 
  FileSearch, 
  Palette, 
  Code, 
  Package, 
  FileText,
  Calendar,
  Tag,
  ArrowRight
} from 'lucide-react';

interface DeliverableCardProps {
  deliverable: DeliverableListItem;
  onClick?: (id: string) => void;
}

// 图标映射
const iconMap: Record<string, React.ElementType> = {
  FileSearch,
  Palette,
  Code,
  Package,
  FileText
};

export function DeliverableCard({ deliverable, onClick }: DeliverableCardProps) {
  const categoryInfo = CATEGORY_CONFIG[deliverable.category];
  const IconComponent = iconMap[categoryInfo.icon] || FileText;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card 
      className="glass rounded-xl overflow-hidden cursor-pointer group 
                 hover:border-iris-primary/50 transition-all duration-300
                 hover:shadow-lg hover:shadow-iris-primary/10"
      onClick={() => onClick?.(deliverable.id)}
    >
      {/* 封面图 */}
      {deliverable.coverImage ? (
        <div className="h-40 overflow-hidden">
          <img 
            src={deliverable.coverImage} 
            alt={deliverable.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-iris-primary/20 to-iris-secondary/20 
                        flex items-center justify-center">
          <IconComponent className="w-16 h-16 text-iris-primary/50" />
        </div>
      )}

      {/* 内容区 */}
      <div className="p-5">
        {/* 分类标签 */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                           text-xs font-medium bg-${categoryInfo.color}/20 text-${categoryInfo.color}`}>
            <IconComponent className="w-3.5 h-3.5" />
            {categoryInfo.label}
          </span>
          <span className="text-xs text-zinc-500">
            {deliverable.sectionCount} 个章节
          </span>
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 
                       group-hover:text-iris-primary transition-colors">
          {deliverable.title}
        </h3>

        {/* 描述 */}
        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
          {deliverable.description}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {deliverable.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded 
                         bg-zinc-800 text-zinc-400 text-xs"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {deliverable.tags.length > 3 && (
            <span className="text-xs text-zinc-500">
              +{deliverable.tags.length - 3}
            </span>
          )}
        </div>

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(deliverable.updatedAt)}
          </div>
          <div className="flex items-center gap-1 text-iris-primary text-sm font-medium
                          group-hover:gap-2 transition-all">
            查看详情
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default DeliverableCard;
