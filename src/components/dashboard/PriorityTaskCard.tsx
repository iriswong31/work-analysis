import { ShortTermTask } from '@/types/memory';
import { PriorityScore } from '@/types/engine';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Target, 
  Zap,
  Briefcase,
  Heart,
  ChevronRight
} from 'lucide-react';

interface PriorityTaskCardProps {
  task: ShortTermTask;
  score: PriorityScore;
  rank: number;
  onStart?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onClick?: (taskId: string) => void;
}

export function PriorityTaskCard({
  task,
  score,
  rank,
  onStart,
  onComplete,
  onClick,
}: PriorityTaskCardProps) {
  const isWork = task.engine === 'work';
  const accentColor = isWork ? 'iris-primary' : 'iris-accent';
  
  const actionLabels: Record<string, { text: string; color: string }> = {
    do_now: { text: '立即执行', color: 'text-iris-success' },
    schedule: { text: '计划执行', color: 'text-iris-info' },
    delegate: { text: '考虑委托', color: 'text-iris-warning' },
    defer: { text: '可延后', color: 'text-zinc-400' },
  };

  const action = actionLabels[score.recommendedAction] || actionLabels.schedule;

  return (
    <Card 
      className={`
        bg-gradient-to-br from-iris-darker to-iris-dark 
        border-${accentColor}/20 hover:border-${accentColor}/40
        transition-all duration-300 cursor-pointer
        hover:shadow-lg hover:shadow-${accentColor}/10
        group
      `}
      onClick={() => onClick?.(task.id)}
    >
      <div className="p-4">
        {/* 头部：排名和引擎标识 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${rank === 1 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 
                rank === 2 ? 'bg-gradient-to-r from-zinc-400 to-zinc-500 text-white' :
                rank === 3 ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white' :
                'bg-iris-dark text-zinc-400 border border-zinc-700'}
            `}>
              {rank}
            </div>
            <div className={`
              px-2 py-0.5 rounded-full text-xs flex items-center gap-1
              ${isWork ? 'bg-iris-primary/20 text-iris-primary' : 'bg-iris-accent/20 text-iris-accent'}
            `}>
              {isWork ? <Briefcase className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
              {isWork ? 'Work' : 'Life'}
            </div>
          </div>
          <span className={`text-xs ${action.color}`}>{action.text}</span>
        </div>

        {/* 任务标题 */}
        <h3 className="text-white font-medium mb-2 group-hover:text-iris-primary transition-colors">
          {task.title}
        </h3>

        {/* 优先级评分可视化 */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-3 h-3 text-iris-success" />
            </div>
            <Progress value={score.breakdown.compoundValue} className="h-1 mb-1" />
            <span className="text-xs text-zinc-500">复利值</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="w-3 h-3 text-iris-warning" />
            </div>
            <Progress value={score.breakdown.urgency} className="h-1 mb-1" />
            <span className="text-xs text-zinc-500">紧急度</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-3 h-3 text-iris-info" />
            </div>
            <Progress value={score.breakdown.goalAlignment} className="h-1 mb-1" />
            <span className="text-xs text-zinc-500">目标对齐</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-3 h-3 text-iris-accent" />
            </div>
            <Progress value={score.breakdown.resourceMatch} className="h-1 mb-1" />
            <span className="text-xs text-zinc-500">资源匹配</span>
          </div>
        </div>

        {/* 决策理由 */}
        <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
          {score.reasoning}
        </p>

        {/* 底部：时间和操作 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>预计 {task.estimatedHours}h</span>
            <span className="text-zinc-600">|</span>
            <span className="font-mono text-iris-primary">{score.totalScore.toFixed(1)}</span>
          </div>

          <div className="flex items-center gap-2">
            {task.status === 'pending' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs hover:bg-iris-primary/20 hover:text-iris-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onStart?.(task.id);
                }}
              >
                <Play className="w-3 h-3 mr-1" />
                开始
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs hover:bg-iris-success/20 hover:text-iris-success"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete?.(task.id);
                }}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                完成
              </Button>
            )}
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PriorityTaskCard;
