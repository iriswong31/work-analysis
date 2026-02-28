import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';
import { ActiveAlert } from '../hooks/useScheduler';
import { useReminderStore } from '../stores/reminderStore';
import { categoryInfo } from '../constants/messages';

interface AlertPopupProps {
  alert: ActiveAlert | null;
  onDismiss: () => void;
}

export default function AlertPopup({ alert, onDismiss }: AlertPopupProps) {
  const { markReminder } = useReminderStore();

  // 30秒后自动关闭
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(onDismiss, 30000);
    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  const handleDone = () => {
    if (alert) {
      markReminder(alert.reminder.id, 'done');
    }
    onDismiss();
  };

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90vw] max-w-sm"
        >
          <div
            className="rounded-2xl shadow-xl border px-4 py-3.5 flex items-start gap-3"
            style={{
              background: 'rgba(255, 248, 238, 0.98)',
              borderColor: 'rgba(192, 82, 46, 0.2)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* 铃铛动画 */}
            <motion.div
              animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(192, 82, 46, 0.12)' }}
            >
              <Bell className="w-5 h-5" style={{ color: '#C0522E' }} />
            </motion.div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: '#5A3A22' }}>
                {alert.reminder.time} · {categoryInfo[alert.reminder.category]?.label || '提醒'}
              </p>
              <p className="text-[15px] font-bold mt-0.5 truncate" style={{ color: '#3D2415' }}>
                {alert.reminder.title}
              </p>
              {alert.reminder.customMessage && (
                <p className="text-[12px] mt-1 opacity-70" style={{ color: '#5A3A22' }}>
                  {alert.reminder.customMessage}
                </p>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={handleDone}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-colors"
                  style={{ background: '#A8C298' }}
                >
                  <Check className="w-3.5 h-3.5" />
                  完成
                </button>
                <button
                  onClick={onDismiss}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{ background: 'rgba(109,76,51,0.08)', color: '#5A3A22' }}
                >
                  稍后
                </button>
              </div>
            </div>

            {/* 关闭 */}
            <button onClick={onDismiss} className="flex-shrink-0 opacity-40 hover:opacity-70 transition-opacity">
              <X className="w-4 h-4" style={{ color: '#5A3A22' }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
