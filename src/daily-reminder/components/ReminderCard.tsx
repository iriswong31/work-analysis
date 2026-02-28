import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, X } from 'lucide-react';
import { Reminder, ReminderStatus } from '@/types/reminder';
import { useReminderStore } from '../stores/reminderStore';
import { cn } from '@/lib/utils';

interface ReminderCardProps {
  reminder: Reminder;
  status?: ReminderStatus;
  onEdit: (reminder: Reminder) => void;
  onFocus?: (reminder: Reminder) => void;
  isPast?: boolean;
  isNext?: boolean;
}

export default function ReminderCard({
  reminder,
  status,
  onEdit,
  isPast,
  isNext,
}: ReminderCardProps) {
  const { markReminder, deleteReminder } = useReminderStore();
  const isDone = status === 'done';
  const isSkipped = status === 'skipped';
  const canAct = !isSkipped && reminder.enabled;

  // 左滑删除状态
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const DELETE_THRESHOLD = -80;

  // 长按查看全文
  const [showFullText, setShowFullText] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const longPressTriggered = useRef(false);
  const touchHandledRef = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalRef.current = null;
    longPressTriggered.current = false;
    setSwiping(true);

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowFullText(true);
    }, 500);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    // 有移动就取消长按
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }

    if (isHorizontalRef.current === null) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontalRef.current) return;

    const clamped = Math.min(0, Math.max(-120, dx));
    setOffsetX(clamped);
  }

  function handleTouchEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setSwiping(false);
    isHorizontalRef.current = null;
    if (offsetX < DELETE_THRESHOLD) {
      setDeleted(true);
      setTimeout(() => deleteReminder(reminder.id), 300);
    } else {
      setOffsetX(0);
    }
  }

  // 计算时长描述
  const durationText = (() => {
    if (!reminder.endTime || !reminder.time) return null;
    const [sh, sm] = reminder.time.split(':').map(Number);
    const [eh, em] = reminder.endTime.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}小时${m}分钟`;
    if (h > 0) return `${h}小时`;
    return `${m}分钟`;
  })();

  return (
    <>
    <AnimatePresence>
      {!deleted && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="flex items-start gap-3 relative overflow-hidden"
        >
          {/* 左滑露出的删除背景 — 仅滑动时显示 */}
          {offsetX < 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-[100px] flex items-center justify-center rounded-r-[24px]"
              style={{ background: '#E74C3C' }}
            >
              <Trash2 className="w-5 h-5 text-white" />
            </div>
          )}

          {/* 可滑动内容 */}
          <div
            className="flex items-start gap-3 w-full relative z-10 bg-transparent overflow-hidden"
            style={{
              transform: `translateX(${offsetX}px)`,
              transition: swiping ? 'none' : 'transform 0.3s ease',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* 左侧时间 */}
            <div
              className={cn(
                'flex-shrink-0 w-[52px] text-right pt-3',
                isNext && 'font-bold',
              )}
            >
              <span
                className={cn(
                  'text-sm tabular-nums font-semibold',
                  isDone || isSkipped ? 'opacity-40' : '',
                )}
                style={{
                  color: isNext ? '#C0522E' : '#5A3A22',
                  textShadow: '0 1px 3px rgba(255,250,240,0.8)',
                }}
              >
                {reminder.time || '不限'}
              </span>
            </div>

            {/* 右侧卡片 */}
            <div
              onClick={() => { if (offsetX === 0 && !longPressTriggered.current) onEdit(reminder); }}
              className={cn(
                'flex-1 min-w-0 cb-task-card flex items-center gap-3 cursor-pointer !py-3 !px-4',
                isDone && 'is-done',
                isNext && 'is-next',
                isSkipped && 'opacity-50',
                !reminder.enabled && 'opacity-40',
              )}
            >
              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    'font-semibold text-[15px] truncate',
                    isDone && 'line-through opacity-60',
                  )}
                  style={{ color: 'var(--cb-color-primary-dark)' }}
                >
                  {reminder.title}
                </h3>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--cb-color-primary-medium)' }}>
                  {reminder.time}
                  {reminder.endTime && ` - ${reminder.endTime}`}
                  {durationText && ` (${durationText})`}
                </p>
              </div>

              {/* 右侧完成圆 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // 移动端由 onTouchEnd 处理，跳过 onClick 防止双重 toggle
                  if (touchHandledRef.current) {
                    touchHandledRef.current = false;
                    return;
                  }
                  if (canAct) {
                    markReminder(reminder.id, isDone ? 'pending' : 'done');
                  }
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (longPressTimer.current) clearTimeout(longPressTimer.current);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  touchHandledRef.current = true;
                  if (canAct) {
                    markReminder(reminder.id, isDone ? 'pending' : 'done');
                  }
                }}
                disabled={!canAct}
                className={cn(
                  'flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all',
                  isDone
                    ? 'bg-[#A8C298] border-[#A8C298]'
                    : 'border-gray-300/50 bg-white/50 active:border-[#A8C298] active:bg-[#A8C298]/10',
                  canAct && 'cursor-pointer',
                )}
              >
                {isDone && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* 长按查看全文弹窗 */}
      <AnimatePresence>
        {showFullText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-6"
            onClick={() => setShowFullText(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#6D4C33]/10 text-[#6D4C33]">
                  {reminder.time}{reminder.endTime ? ` - ${reminder.endTime}` : ''}
                </span>
                <button onClick={() => setShowFullText(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-[15px] font-medium leading-relaxed" style={{ color: 'var(--cb-color-primary-dark)' }}>
                {reminder.title}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
