// 目标时间轴页面
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineView, GoalFilter, ProgressOverview, FeedbackPanel } from '@/components/goal-timeline';
import { goalService } from '@/services/goalService';
import type { Output, TimelineFilter } from '@/types/goal-timeline';

export default function GoalTimeline() {
  const [filter, setFilter] = useState<TimelineFilter>({});
  const [selectedOutput, setSelectedOutput] = useState<Output | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFeedbackClick = useCallback((output: Output) => {
    setSelectedOutput(output);
  }, []);

  const handleFeedbackSubmit = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleGoalClick = useCallback((goalId: string) => {
    setFilter({ goalId });
  }, []);

  const currentFocus = goalService.getCurrentFocus();
  const lastUpdated = goalService.getLastUpdated();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部导航 */}
      <header className="sticky top-0 z-30 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/deliverables">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">目标时间轴</h1>
                <p className="text-xs text-slate-400">追踪数字分身的产出历程</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
              <Clock className="h-3 w-3" />
              更新于 {new Date(lastUpdated).toLocaleDateString('zh-CN')}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* 当前聚焦 */}
        <div className="mb-6 rounded-xl border border-slate-700/50 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">当前聚焦</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentFocus.map((focus, index) => (
              <span
                key={index}
                className="rounded-full bg-slate-800/50 px-3 py-1 text-sm text-slate-300"
              >
                {focus}
              </span>
            ))}
          </div>
        </div>

        {/* 进度概览 */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">进度概览</h2>
          <ProgressOverview onGoalClick={handleGoalClick} />
        </section>

        {/* 时间轴区域 */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">产出时间轴</h2>
            <GoalFilter filter={filter} onFilterChange={setFilter} />
          </div>

          <TimelineView
            key={refreshKey}
            filter={filter}
            onFeedbackClick={handleFeedbackClick}
          />
        </section>
      </main>

      {/* 反馈面板 */}
      {selectedOutput && (
        <FeedbackPanel
          output={selectedOutput}
          onClose={() => setSelectedOutput(null)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
}
