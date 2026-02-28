// 时间轴节点卡片组件
import { useState } from 'react';
import { FileText, Code, Palette, FileEdit, BarChart, Package, Star, ChevronRight, MessageSquare, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Output, Feedback, LongTermGoal, OutputType } from '@/types/goal-timeline';
import { OUTPUT_TYPE_CONFIG, GOAL_CATEGORY_CONFIG } from '@/types/goal-timeline';
import { cn } from '@/lib/utils';

interface TimelineNodeProps {
  output: Output;
  goal: LongTermGoal;
  feedback?: Feedback;
  onFeedbackClick: (output: Output) => void;
  isLast?: boolean;
}

const iconMap: Record<OutputType, React.ElementType> = {
  report: FileText,
  code: Code,
  design: Palette,
  document: FileEdit,
  analysis: BarChart,
  other: Package,
};

export function TimelineNode({ output, goal, feedback, onFeedbackClick, isLast = false }: TimelineNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const typeConfig = OUTPUT_TYPE_CONFIG[output.type];
  const categoryConfig = GOAL_CATEGORY_CONFIG[goal.category];
  const Icon = iconMap[output.type];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative flex gap-4 pb-8">
      {/* 时间轴线 */}
      <div className="flex flex-col items-center">
        {/* 节点圆点 */}
        <div
          className={cn(
            'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
            isHovered
              ? 'border-transparent bg-gradient-to-br shadow-lg shadow-indigo-500/30'
              : 'border-slate-600 bg-slate-800'
          )}
          style={{
            backgroundImage: isHovered ? `linear-gradient(135deg, ${typeConfig.color}, ${categoryConfig.color})` : undefined,
          }}
        >
          <Icon className={cn('h-5 w-5', isHovered ? 'text-white' : 'text-slate-400')} />
        </div>
        {/* 连接线 */}
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-slate-600 to-slate-700" />
        )}
      </div>

      {/* 内容卡片 */}
      <Card
        className={cn(
          'flex-1 cursor-pointer border-slate-700/50 bg-slate-800/50 backdrop-blur-sm transition-all duration-300',
          isHovered && 'border-indigo-500/50 bg-slate-800/80 shadow-lg shadow-indigo-500/10'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          {/* 头部：时间和目标标签 */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">{formatDate(output.createdAt)}</span>
              <span className="text-xs text-slate-500">{formatTime(output.createdAt)}</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'border-0 text-xs',
                `bg-gradient-to-r ${categoryConfig.gradient} bg-clip-text text-transparent`
              )}
              style={{ borderColor: categoryConfig.color + '40' }}
            >
              {categoryConfig.label}
            </Badge>
          </div>

          {/* 标题 */}
          <h3 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-indigo-300">
            {output.title}
          </h3>

          {/* 描述 */}
          <p className="mb-3 line-clamp-2 text-sm text-slate-400">{output.description}</p>

          {/* 底部：类型标签、反馈、链接 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* 类型标签 */}
              <Badge
                variant="secondary"
                className="bg-slate-700/50 text-xs"
                style={{ color: typeConfig.color }}
              >
                {typeConfig.label}
              </Badge>

              {/* 关联目标 */}
              <span className="text-xs text-slate-500 line-clamp-1 max-w-[150px]">{goal.goal}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* 反馈状态 */}
              {feedback ? (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-3 w-3',
                        star <= feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      )}
                    />
                  ))}
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFeedbackClick(output);
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <MessageSquare className="h-3 w-3" />
                  反馈
                </button>
              )}

              {/* 查看链接 */}
              {output.link && (
                <a
                  href={output.link}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-indigo-400 transition-colors hover:bg-indigo-500/10 hover:text-indigo-300"
                >
                  查看
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              <ChevronRight
                className={cn(
                  'h-4 w-4 text-slate-500 transition-transform',
                  isHovered && 'translate-x-1 text-indigo-400'
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TimelineNode;
