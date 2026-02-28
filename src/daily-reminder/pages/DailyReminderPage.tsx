import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Settings,
  CalendarDays,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { useReminderStore } from '../stores/reminderStore';
import { useScheduler } from '../hooks/useScheduler';
import TimelineView from '../components/TimelineView';
import StatsPanel from '../components/StatsPanel';
import ReminderForm from '../components/ReminderForm';
import FocusMode from '../components/FocusMode';
import SettingsPanel from '../components/SettingsPanel';
import MonthlyRing from '../components/MonthlyRing';
import MonthlyShareCard from '../components/MonthlyShareCard';
import QuoteBar from '../components/QuoteBar';
import AlertPopup from '../components/AlertPopup';
import IdeaPool from '../components/IdeaPool';
import { Reminder } from '@/types/reminder';
import '../styles/reminder.css';

export default function DailyReminderPage() {
  const { initialize, isInitialized, reminders, todayLogs, getTodayStats, focusSession } =
    useReminderStore();

  const { activeAlert, dismissAlert } = useScheduler();

  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'ideas' | 'stats'>('today');
  const downloadAreaRef = useRef<HTMLDivElement>(null);

  const handleDownloadReport = useCallback(async () => {
    const el = downloadAreaRef.current;
    if (!el) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        ignoreElements: (element) => element.hasAttribute('data-html2canvas-ignore'),
      });

      const padding = 60;
      const finalW = canvas.width + padding * 2;
      const finalH = canvas.height + padding * 2;
      const mergedCanvas = document.createElement('canvas');
      mergedCanvas.width = finalW;
      mergedCanvas.height = finalH;
      const ctx = mergedCanvas.getContext('2d')!;

      // 先画背景图
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = '/reminder/bg.png';
      await new Promise<void>((resolve, reject) => {
        bgImg.onload = () => resolve();
        bgImg.onerror = () => reject();
      });
      // cover 方式铺满
      const imgRatio = bgImg.width / bgImg.height;
      const canvasRatio = finalW / finalH;
      let sx = 0, sy = 0, sw = bgImg.width, sh = bgImg.height;
      if (imgRatio > canvasRatio) {
        sw = bgImg.height * canvasRatio;
        sx = (bgImg.width - sw) / 2;
      } else {
        sh = bgImg.width / canvasRatio;
        sy = (bgImg.height - sh) / 2;
      }
      ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, finalW, finalH);

      // 叠加半透明遮罩让内容可读
      ctx.fillStyle = 'rgba(255, 243, 230, 0.55)';
      ctx.fillRect(0, 0, finalW, finalH);

      // 画截图内容
      ctx.drawImage(canvas, padding, padding);

      const now = new Date();
      const link = document.createElement('a');
      link.download = `复利盘点-${now.getFullYear()}年${now.getMonth() + 1}月.png`;
      link.href = mergedCanvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('下载失败，请稍后重试');
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const todayStats = isInitialized ? getTodayStats() : null;
  const hasReminders = reminders.length > 0;

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  function handleEdit(reminder: Reminder) {
    setEditingReminder(reminder);
    setShowForm(true);
  }

  function handleFocus(reminder: Reminder) {
    const { startFocus } = useReminderStore.getState();
    const duration = reminder.endTime
      ? (() => {
          const [sh, sm] = reminder.time.split(':').map(Number);
          const [eh, em] = reminder.endTime!.split(':').map(Number);
          return (eh * 60 + em) - (sh * 60 + sm);
        })()
      : 25;
    startFocus(reminder.title, duration, reminder.id);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingReminder(null);
  }

  if (!isInitialized) {
    return (
      <div className="reminder-page flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ color: 'var(--cb-color-primary-medium)' }}
        >
          加载中...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="reminder-page">
      {/* 页面内提醒弹窗 */}
      <AlertPopup alert={activeAlert} onDismiss={dismissAlert} />

      {/* 专注模式 */}
      {focusSession && <FocusMode />}

      <div className="max-w-lg mx-auto px-5 pb-28 relative">
        {/* 头部 */}
        <header className="pt-8 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[22px] font-bold"
                style={{ color: 'var(--cb-color-primary-dark)' }}
              >
                {dateStr}
              </motion.h1>
              {todayStats && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--cb-color-primary-medium)' }}>
                  今日 {todayStats.completed}/{todayStats.total} 已完成
                </p>
              )}
            </div>
            <button
              className="cb-settings-btn"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>

          <QuoteBar />
        </header>

        {/* 内容区 */}
        <div className="mt-2">
          {/* Tab 导航 */}
          <div className="cb-bottom-nav mb-5">
            <button
              className={`cb-nav-btn ${activeTab === 'today' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('today')}
            >
              <CalendarDays className="w-4 h-4" />
              今日
            </button>
            <button
              className={`cb-nav-btn ${activeTab === 'ideas' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('ideas')}
            >
              <Lightbulb className="w-4 h-4" />
              灵感
            </button>
            <button
              className={`cb-nav-btn ${activeTab === 'stats' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChart3 className="w-4 h-4" />
              统计
            </button>
          </div>

          {/* 今日视图 */}
          {activeTab === 'today' && (
            <>
              {!hasReminders ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="text-6xl mb-6">🌱</div>
                  <h2
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--cb-color-primary-dark)' }}
                  >
                    开始你的复利之旅
                  </h2>
                  <p
                    className="text-sm mb-8 max-w-xs mx-auto"
                    style={{ color: 'var(--cb-color-primary-medium)' }}
                  >
                    每天做一点对未来有复利的事情。
                    <br />
                    点击右下角 + 创建你的第一个每日习惯。
                  </p>
                </motion.div>
              ) : (
                <TimelineView
                  reminders={reminders}
                  logs={todayLogs}
                  onEdit={handleEdit}
                  onFocus={handleFocus}
                />
              )}
            </>
          )}

          {/* 灵感池视图 */}
          {activeTab === 'ideas' && <IdeaPool />}

          {/* 统计视图 */}
          {activeTab === 'stats' && (
            <>
              {/* 下载区域：只包含月度环 + 概览卡片 + 复利统计 */}
              <div ref={downloadAreaRef}>
                <MonthlyRing onShare={() => setShowShare(true)} onDownload={handleDownloadReport} />
                <div className="mt-5">
                  <StatsPanel section="download" />
                </div>
              </div>
              {/* 以下内容不纳入下载 */}
              <div className="mt-5">
                <StatsPanel section="extra" />
              </div>
            </>
          )}
        </div>

      </div>

      {/* 添加按钮 - 底部居中常驻（灵感tab时隐藏，灵感池有自己的入口） */}
      {activeTab !== 'ideas' && (
        <div style={{ position: 'fixed', bottom: '28px', left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.92 }}
            className="cb-fab"
            style={{ pointerEvents: 'auto' }}
            onClick={() => setShowForm(true)}
            title="添加提醒"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      )}

      {/* 弹窗 */}
      <ReminderForm
        open={showForm}
        onClose={handleCloseForm}
        editingReminder={editingReminder}
      />
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
      <MonthlyShareCard open={showShare} onClose={() => setShowShare(false)} />
    </div>
  );
}
