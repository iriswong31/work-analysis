// 进度概览组件
import { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { goalService } from '@/services/goalService';
import type { GoalProgress } from '@/types/goal-timeline';
import { GOAL_CATEGORY_CONFIG } from '@/types/goal-timeline';
import { cn } from '@/lib/utils';

interface ProgressOverviewProps {
  onGoalClick?: (goalId: string) => void;
}

export function ProgressOverview({ onGoalClick }: ProgressOverviewProps) {
  const [progressList, setProgressList] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await goalService.getAllGoalProgress();
    setProgressList(progress);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-700/50 bg-slate-800/30">
            <CardContent className="p-4">
              <div className="h-24 animate-pulse rounded bg-slate-700/50" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 计算总体统计
  const totalOutputs = progressList.reduce((sum, p) => sum + p.outputCount, 0);
  const totalMilestones = progressList.reduce((sum, p) => sum + p.totalMilestones, 0);
  const completedMilestones = progressList.reduce((sum, p) => sum + p.completedMilestones, 0);
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 总体统计 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-slate-700/50 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
              <Target className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{progressList.length}</p>
              <p className="text-xs text-slate-400">活跃目标</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalOutputs}</p>
              <p className="text-xs text-slate-400">产出总数</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <CheckCircle2 className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{completedMilestones}/{totalMilestones}</p>
              <p className="text-xs text-slate-400">里程碑完成</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
              <Clock className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{overallProgress}%</p>
              <p className="text-xs text-slate-400">总体进度</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 各目标进度 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {progressList.map((progress) => {
          const goalId = goalService.getGoalId(progress.goal);
          const config = GOAL_CATEGORY_CONFIG[progress.goal.category];
          
          return (
            <Card
              key={goalId}
              className={cn(
                'cursor-pointer border-slate-700/50 bg-slate-800/30 transition-all hover:border-slate-600 hover:bg-slate-800/50',
                onGoalClick && 'hover:shadow-lg'
              )}
              onClick={() => onGoalClick?.(goalId)}
            >
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                          `bg-gradient-to-r ${config.gradient} text-white`
                        )}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {progress.outputCount} 个产出
                      </span>
                    </div>
                    <h4 className="line-clamp-1 text-sm font-medium text-white">
                      {progress.goal.goal}
                    </h4>
                  </div>
                  <span className="text-lg font-bold text-white">
                    {progress.progressPercent}%
                  </span>
                </div>

                {/* 进度条 */}
                <div className="relative">
                  <Progress
                    value={progress.progressPercent}
                    className="h-2 bg-slate-700"
                  />
                  <div
                    className={cn(
                      'absolute inset-0 h-2 rounded-full bg-gradient-to-r opacity-80',
                      config.gradient
                    )}
                    style={{ width: `${progress.progressPercent}%` }}
                  />
                </div>

                {/* 里程碑信息 */}
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {progress.completedMilestones}/{progress.totalMilestones} 里程碑
                  </span>
                  <span>截止 {new Date(progress.goal.target_date).toLocaleDateString('zh-CN')}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressOverview;
