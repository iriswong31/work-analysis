// 目标筛选器组件
import { useState } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { goalService } from '@/services/goalService';
import type { TimelineFilter, GoalCategory, LongTermGoal } from '@/types/goal-timeline';
import { GOAL_CATEGORY_CONFIG } from '@/types/goal-timeline';
import { cn } from '@/lib/utils';

interface GoalFilterProps {
  filter: TimelineFilter;
  onFilterChange: (filter: TimelineFilter) => void;
}

export function GoalFilter({ filter, onFilterChange }: GoalFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const goals = goalService.getLongTermGoals();

  const handleCategoryChange = (category: GoalCategory | undefined) => {
    onFilterChange({ ...filter, category, goalId: undefined });
    setIsOpen(false);
  };

  const handleGoalChange = (goal: LongTermGoal | undefined) => {
    if (goal) {
      onFilterChange({ ...filter, goalId: goalService.getGoalId(goal), category: goal.category });
    } else {
      onFilterChange({ ...filter, goalId: undefined });
    }
    setIsOpen(false);
  };

  const clearFilter = () => {
    onFilterChange({});
  };

  const hasFilter = filter.category || filter.goalId;
  const selectedGoal = filter.goalId ? goalService.getGoalById(filter.goalId) : undefined;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* 筛选按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white',
            hasFilter && 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
          )}
        >
          <Filter className="mr-2 h-4 w-4" />
          {selectedGoal ? selectedGoal.goal : filter.category ? GOAL_CATEGORY_CONFIG[filter.category].label : '筛选目标'}
          <ChevronDown className={cn('ml-2 h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </Button>

        {/* 清除筛选 */}
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* 菜单内容 */}
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-xl">
            {/* 分类筛选 */}
            <div className="mb-3">
              <p className="mb-2 text-xs font-medium uppercase text-slate-500">按分类</p>
              <div className="flex gap-2">
                {(Object.keys(GOAL_CATEGORY_CONFIG) as GoalCategory[]).map((category) => {
                  const config = GOAL_CATEGORY_CONFIG[category];
                  const isSelected = filter.category === category && !filter.goalId;
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(isSelected ? undefined : category)}
                      className={cn(
                        'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all',
                        isSelected
                          ? `bg-gradient-to-r ${config.gradient} text-white`
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      )}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 具体目标筛选 */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-slate-500">按目标</p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {goals.map((goal) => {
                  const goalId = goalService.getGoalId(goal);
                  const isSelected = filter.goalId === goalId;
                  const config = GOAL_CATEGORY_CONFIG[goal.category];
                  return (
                    <button
                      key={goalId}
                      onClick={() => handleGoalChange(isSelected ? undefined : goal)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-all',
                        isSelected
                          ? 'bg-indigo-500/20 text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      )}
                    >
                      <Badge
                        variant="outline"
                        className="h-2 w-2 rounded-full border-0 p-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="line-clamp-1 flex-1">{goal.goal}</span>
                      {isSelected && (
                        <span className="text-xs text-indigo-400">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GoalFilter;
