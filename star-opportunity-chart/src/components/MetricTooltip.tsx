import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MetricWithSource, MetricHistory } from "@/types";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricTooltipProps {
  label: string;
  value: number | MetricWithSource;
  unit?: string;
  children: React.ReactNode;
}

// 判断是否为带数据源的指标
function isMetricWithSource(value: number | MetricWithSource): value is MetricWithSource {
  return typeof value === "object" && value !== null && "source" in value;
}

// 获取趋势图标
function getTrendIcon(history: MetricHistory[]) {
  if (history.length < 2) return <Minus className="w-3 h-3 text-gray-400" />;
  const latest = history[history.length - 1].value;
  const previous = history[history.length - 2].value;
  if (latest > previous) return <TrendingUp className="w-3 h-3 text-green-500" />;
  if (latest < previous) return <TrendingDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
}

// 获取趋势颜色
function getTrendColor(current: number, previous: number): string {
  if (current > previous) return "text-green-600";
  if (current < previous) return "text-red-600";
  return "text-gray-600";
}

export function MetricTooltip({ label, value, unit = "", children }: MetricTooltipProps) {
  // 如果是简单数值，直接返回children
  if (!isMetricWithSource(value)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent className="bg-slate-800 text-white p-3 max-w-xs">
            <p className="text-sm">{label}: {value}{unit}</p>
            <p className="text-xs text-slate-400 mt-1">暂无详细数据源</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const { source, sourceUrl, reportDate, history } = value;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent 
          className="bg-white border shadow-xl p-0 max-w-sm"
          side="top"
        >
          <div className="p-4 space-y-3">
            {/* 标题 */}
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-semibold text-slate-800">{label}</span>
              <span className="text-lg font-bold text-primary">
                {value.value}{unit}
              </span>
            </div>

            {/* 数据来源 */}
            <div className="space-y-1">
              <p className="text-xs text-slate-500">数据来源</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">{source}</span>
                <span className="text-xs text-slate-400">{reportDate}</span>
              </div>
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:underline"
                >
                  查看原始数据
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* 近3年趋势 */}
            {history && history.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">近3年趋势</p>
                  {getTrendIcon(history)}
                </div>
                <div className="flex gap-2">
                  {history.map((item, index) => {
                    const prevValue = index > 0 ? history[index - 1].value : item.value;
                    return (
                      <div
                        key={item.year}
                        className="flex-1 p-2 bg-slate-50 rounded text-center"
                      >
                        <div className={`text-sm font-semibold ${getTrendColor(item.value, prevValue)}`}>
                          {item.value}{unit}
                        </div>
                        <div className="text-xs text-slate-400">{item.year}</div>
                      </div>
                    );
                  })}
                </div>
                {/* 趋势线可视化 */}
                <div className="h-12 flex items-end gap-1">
                  {history.map((item, index) => {
                    const maxValue = Math.max(...history.map(h => h.value));
                    const minValue = Math.min(...history.map(h => h.value));
                    const range = maxValue - minValue || 1;
                    const height = ((item.value - minValue) / range) * 100;
                    const prevValue = index > 0 ? history[index - 1].value : item.value;
                    
                    return (
                      <div
                        key={item.year}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className={`w-full rounded-t transition-all ${
                            item.value >= prevValue ? "bg-green-400" : "bg-red-400"
                          }`}
                          style={{ height: `${Math.max(height, 10)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// 简化版：仅显示数值，带可点击的详情
export function MetricValue({
  label,
  value,
  unit = "",
}: {
  label: string;
  value: number | MetricWithSource;
  unit?: string;
}) {
  const displayValue = isMetricWithSource(value) ? value.value : value;
  const hasSource = isMetricWithSource(value);

  return (
    <MetricTooltip label={label} value={value} unit={unit}>
      <div className={`p-2 bg-slate-50 rounded cursor-pointer transition-colors ${hasSource ? "hover:bg-slate-100" : ""}`}>
        <div className="text-sm font-semibold flex items-center justify-center gap-1">
          {displayValue}{unit}
          {hasSource && (
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" title="有数据源" />
          )}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </MetricTooltip>
  );
}
