// 反馈面板组件
import { useState, useEffect } from 'react';
import { X, Star, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { timelineFeedbackService } from '@/services/timelineFeedbackService';
import type { Output, Feedback, FeedbackRating } from '@/types/goal-timeline';
import { OUTPUT_TYPE_CONFIG } from '@/types/goal-timeline';
import { cn } from '@/lib/utils';

interface FeedbackPanelProps {
  output: Output | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function FeedbackPanel({ output, onClose, onSubmit }: FeedbackPanelProps) {
  const [rating, setRating] = useState<FeedbackRating>(5);
  const [comment, setComment] = useState('');
  const [meetsExpectation, setMeetsExpectation] = useState(true);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (output) {
      loadExistingFeedback();
    }
  }, [output]);

  const loadExistingFeedback = async () => {
    if (!output) return;
    const feedback = await timelineFeedbackService.getFeedbackByOutputId(output.id);
    if (feedback) {
      setExistingFeedback(feedback);
      setRating(feedback.rating);
      setComment(feedback.comment);
      setMeetsExpectation(feedback.meetsExpectation);
    } else {
      setExistingFeedback(null);
      setRating(5);
      setComment('');
      setMeetsExpectation(true);
    }
  };

  const handleSubmit = async () => {
    if (!output) return;
    setLoading(true);

    await timelineFeedbackService.createFeedback({
      outputId: output.id,
      rating,
      comment,
      meetsExpectation,
    });

    setLoading(false);
    onSubmit();
    onClose();
  };

  if (!output) return null;

  const typeConfig = OUTPUT_TYPE_CONFIG[output.type];

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 面板 */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-700 bg-slate-900 shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <h2 className="text-lg font-semibold text-white">
            {existingFeedback ? '编辑反馈' : '添加反馈'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 产出信息 */}
        <div className="border-b border-slate-700 bg-slate-800/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: typeConfig.color + '20', color: typeConfig.color }}
            >
              {typeConfig.label}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(output.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
          <h3 className="mb-1 text-base font-medium text-white">{output.title}</h3>
          <p className="line-clamp-2 text-sm text-slate-400">{output.description}</p>
        </div>

        {/* 反馈表单 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 评分 */}
          <div className="mb-6">
            <Label className="mb-3 block text-sm font-medium text-slate-300">
              评分
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hoveredStar ?? rating);
                return (
                  <button
                    key={star}
                    onClick={() => setRating(star as FeedbackRating)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(null)}
                    className="group p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        isActive
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600 group-hover:text-slate-500'
                      )}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-lg font-medium text-white">{rating}/5</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {rating === 5 && '非常满意，超出预期！'}
              {rating === 4 && '满意，达到预期'}
              {rating === 3 && '一般，基本符合'}
              {rating === 2 && '不太满意，有待改进'}
              {rating === 1 && '不满意，需要重做'}
            </p>
          </div>

          {/* 符合预期 */}
          <div className="mb-6">
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
              <div className="flex items-center gap-3">
                {meetsExpectation ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <div>
                  <Label className="text-sm font-medium text-white">
                    符合目标预期
                  </Label>
                  <p className="text-xs text-slate-500">
                    这个产出是否符合目标的预期方向
                  </p>
                </div>
              </div>
              <Switch
                checked={meetsExpectation}
                onCheckedChange={setMeetsExpectation}
              />
            </div>
          </div>

          {/* 评论 */}
          <div className="mb-6">
            <Label className="mb-2 block text-sm font-medium text-slate-300">
              评论（可选）
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="写下你对这个产出的想法、建议或改进意见..."
              className="min-h-[120px] resize-none border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {existingFeedback ? '更新反馈' : '提交反馈'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default FeedbackPanel;
