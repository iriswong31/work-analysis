import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Feedback } from '@/types/memory';
import { Star, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

interface FeedbackHistoryProps {
  feedbacks: Feedback[];
  maxItems?: number;
}

export function FeedbackHistory({ feedbacks, maxItems = 7 }: FeedbackHistoryProps) {
  const recentFeedbacks = feedbacks.slice(0, maxItems);
  
  // 计算趋势
  const getTrend = () => {
    if (feedbacks.length < 3) return 'stable';
    const recent = feedbacks.slice(0, 3).reduce((sum, f) => sum + f.rating, 0) / 3;
    const older = feedbacks.slice(3, 6).reduce((sum, f) => sum + f.rating, 0) / Math.min(3, feedbacks.slice(3, 6).length);
    if (older === 0) return 'stable';
    if (recent > older + 0.3) return 'up';
    if (recent < older - 0.3) return 'down';
    return 'stable';
  };

  const trend = getTrend();
  const avgRating = feedbacks.length > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0';

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-iris-success';
    if (rating >= 3) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <Card className="glass border-zinc-800">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">反馈历史</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">{avgRating}</span>
            <span className="text-zinc-500 text-sm">/5</span>
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-iris-success" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-zinc-500" />}
          </div>
        </div>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="p-4 space-y-3">
          {recentFeedbacks.length > 0 ? (
            recentFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="p-3 rounded-lg bg-iris-dark/50 border border-zinc-800/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= feedback.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    ))}
                    <span className={`ml-2 text-sm font-medium ${getRatingColor(feedback.rating)}`}>
                      {feedback.rating}/5
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-500 text-xs">
                    <Calendar className="w-3 h-3" />
                    {formatDate(feedback.createdAt)}
                  </div>
                </div>

                {feedback.comment && (
                  <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                    {feedback.comment}
                  </p>
                )}

                {feedback.adjustments.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {feedback.adjustments.slice(0, 3).map((adj, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-xs bg-iris-primary/10 text-iris-primary"
                      >
                        {adj}
                      </span>
                    ))}
                    {feedback.adjustments.length > 3 && (
                      <span className="text-xs text-zinc-500">
                        +{feedback.adjustments.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Star className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">暂无反馈记录</p>
              <p className="text-zinc-600 text-xs mt-1">提交反馈后将在这里显示</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

export default FeedbackHistory;
