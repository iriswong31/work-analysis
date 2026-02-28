import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Star, Send, Sparkles, MessageSquare } from 'lucide-react';

interface FeedbackPanelProps {
  onSubmit: (rating: number, comment: string, adjustments: string[]) => void;
  isSubmitting?: boolean;
}

export function FeedbackPanel({ onSubmit, isSubmitting }: FeedbackPanelProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const quickTags = [
    { id: 'work_heavy', label: 'Work 任务太多', category: 'work' },
    { id: 'life_heavy', label: 'Life 任务太多', category: 'life' },
    { id: 'priority_wrong', label: '优先级不准', category: 'priority' },
    { id: 'time_short', label: '时间不够用', category: 'time' },
    { id: 'good_progress', label: '进展顺利', category: 'positive' },
    { id: 'need_focus', label: '需要更聚焦', category: 'focus' },
  ];

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, comment, selectedTags);
    // 重置表单
    setRating(0);
    setComment('');
    setSelectedTags([]);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Card className="glass border-iris-primary/20 overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-iris-primary" />
          <h3 className="text-white font-medium">今日反馈</h3>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          你的反馈将帮助数字分身更好地理解你的偏好
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* 评分 */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">今日满意度</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                className="p-1 transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(value)}
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    value <= (hoveredRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-600'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-zinc-400">
                {rating === 1 && '需要改进'}
                {rating === 2 && '还行'}
                {rating === 3 && '一般'}
                {rating === 4 && '不错'}
                {rating === 5 && '非常满意'}
              </span>
            )}
          </div>
        </div>

        {/* 快速标签 */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">快速反馈</label>
          <div className="flex flex-wrap gap-2">
            {quickTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`
                  px-3 py-1.5 rounded-full text-xs transition-all
                  ${selectedTags.includes(tag.id)
                    ? 'bg-iris-primary text-white'
                    : 'bg-iris-dark text-zinc-400 hover:bg-iris-darker hover:text-zinc-300'
                  }
                `}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* 详细反馈 */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">详细说明（可选）</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="告诉数字分身你的想法，比如：今天 Work 任务安排得太紧了，希望明天能多一些 Life 时间..."
            className="bg-iris-dark border-zinc-700 text-white placeholder:text-zinc-600 min-h-[80px] resize-none"
          />
        </div>

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full bg-gradient-to-r from-iris-primary to-iris-secondary hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              正在处理反馈...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              提交反馈
            </>
          )}
        </Button>

        {/* 提示 */}
        <p className="text-xs text-zinc-600 text-center">
          反馈将通过复利工程沉淀到记忆层，持续优化决策
        </p>
      </div>
    </Card>
  );
}

export default FeedbackPanel;
