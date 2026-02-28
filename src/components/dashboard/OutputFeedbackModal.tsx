/**
 * 产出反馈弹窗组件
 * 用于收集用户对产出的评分和评论反馈
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, 
  Star, 
  MessageSquare,
  Send,
  Sparkles
} from 'lucide-react';
import type { OutputRecord } from '@/types/dashboard';

interface OutputFeedbackModalProps {
  output: OutputRecord;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (outputId: string, rating: number, comment: string) => Promise<void>;
}

export function OutputFeedbackModal({
  output,
  isOpen,
  onClose,
  onSubmit,
}: OutputFeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(output.id, rating, comment);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        // 重置状态
        setRating(0);
        setComment('');
        setSubmitted(false);
      }, 1500);
    } catch (error) {
      console.error('提交反馈失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setRating(0);
    setComment('');
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* 弹窗内容 */}
      <Card className="relative z-10 w-full max-w-md mx-4 glass border-zinc-700 overflow-hidden">
        {submitted ? (
          // 提交成功状态
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-iris-success/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-iris-success" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">感谢反馈！</h3>
            <p className="text-zinc-400 text-sm">
              你的反馈已保存到记忆系统，将用于优化后续任务执行
            </p>
          </div>
        ) : (
          <>
            {/* 头部 */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-iris-primary" />
                <h3 className="text-white font-medium">产出反馈</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-zinc-400 hover:text-white h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 产出信息 */}
            <div className="p-4 bg-zinc-800/30">
              <h4 className="text-white font-medium mb-1">{output.title}</h4>
              <p className="text-zinc-500 text-sm line-clamp-2">{output.description}</p>
            </div>

            {/* 评分 */}
            <div className="p-4 border-b border-zinc-800">
              <label className="text-sm text-zinc-400 mb-2 block">满意度评分</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-zinc-400">
                  {rating > 0 && ['', '需改进', '一般', '满意', '很好', '非常满意'][rating]}
                </span>
              </div>
            </div>

            {/* 评论 */}
            <div className="p-4">
              <label className="text-sm text-zinc-400 mb-2 block">
                反馈建议 <span className="text-zinc-600">(可选)</span>
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="有什么可以改进的地方？或者哪些方面做得很好？"
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[100px] resize-none"
              />
            </div>

            {/* 提交按钮 */}
            <div className="p-4 border-t border-zinc-800">
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="w-full bg-gradient-to-r from-iris-primary to-iris-secondary hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    提交反馈
                  </>
                )}
              </Button>
              <p className="text-xs text-zinc-500 text-center mt-2">
                反馈将保存到记忆系统，帮助数字分身持续优化
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default OutputFeedbackModal;
