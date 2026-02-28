/**
 * 每日产出时间轴组件
 * 按日期分组展示产出记录，默认展开当天
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Code,
  Palette,
  FileEdit,
  BarChart,
  BookOpen,
  Package,
  ExternalLink,
  Briefcase,
  Heart,
  MessageSquare,
  Star
} from 'lucide-react';
import { dashboardDataService } from '@/services/dashboardDataService';
import { outputFeedbackService } from '@/services/outputFeedbackService';
import { OutputFeedbackModal } from './OutputFeedbackModal';
import type { DailyOutputGroup, OutputRecord, OutputCategory } from '@/types/dashboard';

// 图标映射
const categoryIcons: Record<OutputCategory, React.ReactNode> = {
  report: <FileText className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  design: <Palette className="w-4 h-4" />,
  document: <FileEdit className="w-4 h-4" />,
  analysis: <BarChart className="w-4 h-4" />,
  article: <BookOpen className="w-4 h-4" />,
  other: <Package className="w-4 h-4" />,
};

// 类别颜色映射
const categoryColors: Record<OutputCategory, string> = {
  report: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  code: 'bg-green-500/20 text-green-400 border-green-500/30',
  design: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  document: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  analysis: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  article: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

// 类别标签
const categoryLabels: Record<OutputCategory, string> = {
  report: '调研报告',
  code: '代码实现',
  design: '设计方案',
  document: '文档',
  analysis: '分析',
  article: '文章',
  other: '其他',
};

interface TimelineItemProps {
  output: OutputRecord;
  onClick: (output: OutputRecord) => void;
  onFeedback: (output: OutputRecord) => void;
  hasFeedback: boolean;
}

function TimelineItem({ output, onClick, onFeedback, hasFeedback }: TimelineItemProps) {
  const time = new Date(output.createdAt).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleFeedbackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFeedback(output);
  };

  return (
    <div 
      className="flex gap-4 p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors group"
      onClick={() => onClick(output)}
    >
      {/* 时间 */}
      <div className="w-12 text-xs text-zinc-500 pt-1 flex-shrink-0">
        {time}
      </div>

      {/* 类型图标 */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[output.category]}`}>
        {categoryIcons[output.category]}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium text-white truncate">{output.title}</h4>
          {output.type === 'work' ? (
            <Briefcase className="w-3 h-3 text-iris-primary flex-shrink-0" />
          ) : (
            <Heart className="w-3 h-3 text-iris-accent flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-zinc-500 line-clamp-1">{output.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={`text-xs px-1.5 py-0 ${categoryColors[output.category]}`}>
            {categoryLabels[output.category]}
          </Badge>
        </div>
      </div>

      {/* 反馈按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleFeedbackClick}
        className={`h-8 w-8 p-0 flex-shrink-0 ${
          hasFeedback 
            ? 'text-yellow-400 hover:text-yellow-300' 
            : 'text-zinc-600 hover:text-zinc-400'
        }`}
        title={hasFeedback ? '已反馈' : '添加反馈'}
      >
        {hasFeedback ? (
          <Star className="w-4 h-4 fill-yellow-400" />
        ) : (
          <MessageSquare className="w-4 h-4" />
        )}
      </Button>

      {/* 链接图标 */}
      {output.link && (
        <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
      )}
    </div>
  );
}

interface DayGroupProps {
  group: DailyOutputGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onItemClick: (output: OutputRecord) => void;
  onFeedback: (output: OutputRecord) => void;
  feedbackIds: Set<string>;
}

function DayGroup({ group, isExpanded, onToggle, onItemClick, onFeedback, feedbackIds }: DayGroupProps) {
  return (
    <div className="relative">
      {/* 时间轴线 */}
      <div className="absolute left-[22px] top-10 bottom-0 w-px bg-zinc-800" />

      {/* 日期头部 */}
      <div 
        className="flex items-center gap-3 p-2 cursor-pointer hover:bg-zinc-800/30 rounded-lg transition-colors"
        onClick={onToggle}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
          group.isToday 
            ? 'bg-gradient-to-br from-iris-primary to-iris-secondary' 
            : 'bg-zinc-800'
        }`}>
          <Calendar className={`w-5 h-5 ${group.isToday ? 'text-white' : 'text-zinc-400'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${group.isToday ? 'text-iris-primary' : 'text-white'}`}>
              {group.displayDate}
            </span>
            {group.isToday && (
              <Badge className="bg-iris-primary/20 text-iris-primary text-xs">今天</Badge>
            )}
          </div>
          <span className="text-xs text-zinc-500">{group.records.length} 项产出</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-zinc-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-zinc-500" />
        )}
      </div>

      {/* 产出列表 */}
      {isExpanded && (
        <div className="ml-12 mt-2 space-y-1 pb-4">
          {group.records.map((output) => (
            <TimelineItem 
              key={output.id} 
              output={output} 
              onClick={onItemClick}
              onFeedback={onFeedback}
              hasFeedback={feedbackIds.has(output.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DailyTimeline() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<DailyOutputGroup[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [feedbackOutput, setFeedbackOutput] = useState<OutputRecord | null>(null);
  const [feedbackIds, setFeedbackIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
    loadFeedbackIds();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dashboardDataService.getDailyOutputGroups();
    setGroups(data);
    
    // 默认展开今天
    const todayGroup = data.find(g => g.isToday);
    if (todayGroup) {
      setExpandedDates(new Set([todayGroup.date]));
    } else if (data.length > 0) {
      // 如果没有今天的数据，展开最近一天
      setExpandedDates(new Set([data[0].date]));
    }
    
    setLoading(false);
  };

  const loadFeedbackIds = () => {
    const feedbacks = outputFeedbackService.getAllFeedbacks();
    setFeedbackIds(new Set(feedbacks.map(f => f.outputId)));
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleItemClick = (output: OutputRecord) => {
    if (output.link) {
      navigate(output.link);
    }
  };

  const handleFeedbackClick = (output: OutputRecord) => {
    setFeedbackOutput(output);
  };

  const handleFeedbackSubmit = async (outputId: string, rating: number, comment: string) => {
    const output = groups.flatMap(g => g.records).find(o => o.id === outputId);
    if (output) {
      await outputFeedbackService.addFeedback(outputId, output.title, rating, comment);
      loadFeedbackIds();
    }
  };

  const handleFeedbackClose = () => {
    setFeedbackOutput(null);
  };

  if (loading) {
    return (
      <Card className="glass border-zinc-800">
        <div className="p-6 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-iris-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card className="glass border-zinc-800">
        <div className="p-6 text-center">
          <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-500">暂无产出记录</p>
          <p className="text-xs text-zinc-600 mt-1">数字分身正在努力工作中...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass border-zinc-800">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-iris-primary" />
            <h3 className="text-white font-medium">每日产出时间轴</h3>
          </div>
          <span className="text-xs text-zinc-500">
            共 {groups.reduce((sum, g) => sum + g.records.length, 0)} 项产出
          </span>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-2">
            {groups.map((group) => (
              <DayGroup
                key={group.date}
                group={group}
                isExpanded={expandedDates.has(group.date)}
                onToggle={() => toggleDate(group.date)}
                onItemClick={handleItemClick}
                onFeedback={handleFeedbackClick}
                feedbackIds={feedbackIds}
              />
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* 反馈弹窗 */}
      {feedbackOutput && (
        <OutputFeedbackModal
          output={feedbackOutput}
          isOpen={!!feedbackOutput}
          onClose={handleFeedbackClose}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </>
  );
}

export default DailyTimeline;
