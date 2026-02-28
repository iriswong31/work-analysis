import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EngineStatus, EngineConfig } from '@/types/engine';
import { TaskItem } from '@/types/dashboard';
import { dashboardDataService } from '@/services/dashboardDataService';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Briefcase, 
  Heart, 
  Zap, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react';

interface EngineStatusPanelProps {
  workEngine: EngineStatus;
  lifeEngine: EngineStatus;
  config: EngineConfig;
  onConfigChange: (config: Partial<EngineConfig>) => void;
  workTotalCompleted?: number;
  lifeTotalCompleted?: number;
}

// 任务列表项组件
function TaskListItem({ task }: { task: TaskItem }) {
  const priorityColors = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-zinc-400',
  };

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-zinc-800/30 transition-colors">
      {task.status === 'in_progress' ? (
        <Loader2 className="w-3.5 h-3.5 text-iris-primary animate-spin flex-shrink-0" />
      ) : task.status === 'completed' ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-iris-success flex-shrink-0" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
      )}
      <span className={`text-xs truncate flex-1 ${
        task.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-300'
      }`}>
        {task.title}
      </span>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        task.priority === 'high' ? 'bg-red-400' : 
        task.priority === 'medium' ? 'bg-yellow-400' : 'bg-zinc-500'
      }`} />
    </div>
  );
}

// 单引擎卡片组件
function EngineCard({
  type,
  engine,
  tasks,
  totalCompleted,
  onViewAll,
}: {
  type: 'work' | 'life';
  engine: EngineStatus;
  tasks: { inProgress: TaskItem[]; pending: TaskItem[]; completed: number };
  totalCompleted: number;
  onViewAll: () => void;
}) {
  const isWork = type === 'work';
  const allTasks = [...tasks.inProgress, ...tasks.pending];
  const totalTasks = allTasks.length + tasks.completed;
  const progress = totalTasks > 0 ? Math.round((tasks.completed / totalTasks) * 100) : 0;

  return (
    <div className={`rounded-lg p-4 border ${
      isWork 
        ? 'bg-gradient-to-br from-iris-primary/20 to-iris-secondary/10 border-iris-primary/30'
        : 'bg-gradient-to-br from-iris-accent/20 to-iris-secondary/10 border-iris-accent/30'
    }`}>
      {/* 头部 */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
          isWork ? 'bg-iris-primary/20' : 'bg-iris-accent/20'
        }`}>
          {isWork ? (
            <Briefcase className="w-3.5 h-3.5 text-iris-primary" />
          ) : (
            <Heart className="w-3.5 h-3.5 text-iris-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white">
            {isWork ? 'Work 引擎' : 'Life 引擎'}
          </h3>
          <p className="text-xs text-zinc-500 truncate">
            {isWork ? '善治美 · 公益数字化' : '动画 AI 制片 · 第二人生'}
          </p>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-zinc-400">今日进度</span>
          <span className={isWork ? 'text-iris-primary' : 'text-iris-accent'}>
            {tasks.completed}/{totalTasks} ({progress}%)
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* 任务列表 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-400">
            进行中 {tasks.inProgress.length} · 待处理 {tasks.pending.length}
          </span>
        </div>
        <ScrollArea className="h-[120px]">
          <div className="space-y-0.5">
            {tasks.inProgress.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
            {tasks.pending.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
            {allTasks.length === 0 && (
              <div className="text-xs text-zinc-500 text-center py-4">
                暂无任务
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 累计完成 */}
      <div 
        className="bg-iris-success/10 rounded p-2 cursor-pointer hover:bg-iris-success/20 transition-colors group"
        onClick={onViewAll}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-iris-success" />
            <span className="text-xs text-zinc-400">累计完成</span>
            <span className="text-sm font-semibold text-iris-success">{totalCompleted}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-iris-success transition-colors" />
        </div>
      </div>
    </div>
  );
}

export function EngineStatusPanel({
  workEngine,
  lifeEngine,
  config,
  onConfigChange,
  workTotalCompleted = 0,
  lifeTotalCompleted = 0,
}: EngineStatusPanelProps) {
  const navigate = useNavigate();
  const [taskDetails, setTaskDetails] = useState<{
    work: { inProgress: TaskItem[]; pending: TaskItem[]; completed: number };
    life: { inProgress: TaskItem[]; pending: TaskItem[]; completed: number };
  } | null>(null);

  useEffect(() => {
    loadTaskDetails();
  }, []);

  const loadTaskDetails = async () => {
    const details = await dashboardDataService.getEngineTaskDetails();
    setTaskDetails(details);
  };

  const handleRatioChange = (value: number[]) => {
    onConfigChange({ workRatio: value[0] / 100 });
  };

  const handleCompletedClick = (type: 'work' | 'life') => {
    navigate(`/outputs?type=${type}`);
  };

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-iris-primary" />
          双引擎状态
        </h2>
        <div className="text-xs text-zinc-400">
          Work {Math.round(config.workRatio * 100)}% / Life {Math.round(config.lifeRatio * 100)}%
        </div>
      </div>

      {/* 比例调节器 */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Work
          </span>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            Life <Heart className="w-3 h-3" />
          </span>
        </div>
        <Slider
          value={[config.workRatio * 100]}
          onValueChange={handleRatioChange}
          max={80}
          min={20}
          step={5}
          className="cursor-pointer"
        />
      </div>

      {/* 双引擎卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <EngineCard
          type="work"
          engine={workEngine}
          tasks={taskDetails?.work || { inProgress: [], pending: [], completed: 0 }}
          totalCompleted={workTotalCompleted}
          onViewAll={() => handleCompletedClick('work')}
        />
        <EngineCard
          type="life"
          engine={lifeEngine}
          tasks={taskDetails?.life || { inProgress: [], pending: [], completed: 0 }}
          totalCompleted={lifeTotalCompleted}
          onViewAll={() => handleCompletedClick('life')}
        />
      </div>

      {/* 状态指示器 */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-iris-success animate-pulse" />
          <span>系统运行中</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>上次更新: 刚刚</span>
        </div>
      </div>
    </div>
  );
}

export default EngineStatusPanel;
