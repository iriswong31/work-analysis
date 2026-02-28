// 时间轴主视图组件
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimelineNode } from './TimelineNode';
import { goalService } from '@/services/goalService';
import { outputService } from '@/services/outputService';
import { timelineFeedbackService } from '@/services/timelineFeedbackService';
import type { Output, Feedback, LongTermGoal, TimelineFilter } from '@/types/goal-timeline';

interface TimelineViewProps {
  filter?: TimelineFilter;
  onFeedbackClick: (output: Output) => void;
}

interface TimelineItem {
  output: Output;
  goal: LongTermGoal;
  feedback?: Feedback;
}

export function TimelineView({ filter, onFeedbackClick }: TimelineViewProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimelineData();
  }, [filter]);

  const loadTimelineData = async () => {
    setLoading(true);

    // 获取所有产出（按时间倒序）
    let outputs = await outputService.getOutputsSortedByDate();

    // 应用筛选
    if (filter?.goalId) {
      outputs = outputs.filter((o) => o.goalId === filter.goalId);
    }

    if (filter?.category) {
      const categoryGoals = goalService.getGoalsByCategory(filter.category);
      const categoryGoalIds = categoryGoals.map((g) => goalService.getGoalId(g));
      outputs = outputs.filter((o) => categoryGoalIds.includes(o.goalId));
    }

    if (filter?.dateRange) {
      const startDate = new Date(filter.dateRange.start);
      const endDate = new Date(filter.dateRange.end);
      outputs = outputs.filter((o) => {
        const createdAt = new Date(o.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });
    }

    // 获取所有反馈
    const allFeedback = await timelineFeedbackService.getAllFeedback();
    const feedbackMap = new Map<string, Feedback>();
    allFeedback.forEach((f) => feedbackMap.set(f.outputId, f));

    // 组装时间轴数据
    const timelineItems: TimelineItem[] = outputs.map((output) => {
      const goal = goalService.getGoalById(output.goalId) || goalService.getLongTermGoals()[0];
      const feedback = feedbackMap.get(output.id);
      return { output, goal, feedback };
    });

    setItems(timelineItems);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-400">
        <div className="mb-4 text-6xl">📭</div>
        <p className="text-lg">暂无产出记录</p>
        <p className="text-sm text-slate-500">数字分身正在努力工作中...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="pr-4">
        {items.map((item, index) => (
          <TimelineNode
            key={item.output.id}
            output={item.output}
            goal={item.goal}
            feedback={item.feedback}
            onFeedbackClick={onFeedbackClick}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

export default TimelineView;
