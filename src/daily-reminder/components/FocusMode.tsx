import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, Play, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReminderStore } from '../stores/reminderStore';
import { playCompleteSound } from '../utils/sounds';
import { generateEncouragement } from '../constants/messages';

export default function FocusMode() {
  const { focusSession, endFocus, getStreak } = useReminderStore();
  const [elapsed, setElapsed] = useState(0); // 秒
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const totalSeconds = (focusSession?.duration || 25) * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = elapsed / totalSeconds;

  // 获取连续天数
  useEffect(() => {
    getStreak().then(setStreak);
  }, [getStreak]);

  // 计时器
  useEffect(() => {
    if (!focusSession || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          clearInterval(intervalRef.current);
          setShowComplete(true);
          playCompleteSound();
          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [focusSession, isPaused, totalSeconds]);

  // 重置
  useEffect(() => {
    if (focusSession) {
      setElapsed(0);
      setIsPaused(false);
      setShowComplete(false);
    }
  }, [focusSession?.id]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  const handleComplete = async () => {
    await endFocus(false);
  };

  const handleQuit = async () => {
    await endFocus(true);
  };

  if (!focusSession) return null;

  // 呼吸动画的缩放值
  const breatheScale = isPaused ? 1 : undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        {/* 退出按钮 */}
        <button
          onClick={handleQuit}
          className="absolute top-6 right-6 text-white/30 hover:text-white/60 transition-colors"
          title="退出专注（会记录为中断）"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* 标题 */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/70 text-lg mb-8 font-light"
          >
            {focusSession.title}
          </motion.h2>

          {showComplete ? (
            /* 完成界面 */
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="space-y-6"
            >
              <div className="text-6xl">✨</div>
              <h3 className="text-white text-2xl font-medium">
                太棒了，你做到了！
              </h3>
              <p className="text-white/60 text-lg">
                {generateEncouragement(streak + 1)}
              </p>
              <p className="text-white/40">
                专注了 {focusSession.duration} 分钟
              </p>
              <Button
                onClick={handleComplete}
                className="mt-8 bg-white/20 hover:bg-white/30 text-white border-0 px-8 py-3 rounded-full"
              >
                <Check className="w-4 h-4 mr-2" />
                完成
              </Button>
            </motion.div>
          ) : (
            /* 倒计时界面 */
            <>
              {/* 呼吸圆环 */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                {/* 背景圆 */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="2"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#focusGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 45}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 45 * (1 - progress),
                    }}
                    transition={{ duration: 0.5, ease: 'linear' }}
                  />
                  <defs>
                    <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#f9a8d4" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* 呼吸动画背景 */}
                <motion.div
                  className="absolute inset-8 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
                  }}
                  animate={
                    !isPaused
                      ? { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }
                      : { scale: 1, opacity: 0.5 }
                  }
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* 时间显示 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-5xl font-light tabular-nums tracking-wider">
                    {formatTime(remaining)}
                  </span>
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                  className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                </Button>
              </div>

              {/* 鼓励文案 */}
              <motion.p
                className="text-white/40 mt-8 text-sm"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {isPaused
                  ? '暂停中…准备好了就继续'
                  : '专注于当下，你正在变得更好'}
              </motion.p>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
