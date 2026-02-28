import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Bell, Sparkles, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'goal-generator-2026';

export default function Home() {
  const navigate = useNavigate();
  const [hasGoal, setHasGoal] = useState(false);
  const [vision, setVision] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.vision?.trim()) {
          setHasGoal(true);
          setVision(data.vision.trim());
        }
      }
    } catch { /* ignore */ }
  }, []);

  const features = [
    {
      key: 'goal',
      icon: Target,
      title: '2026 目标卡',
      desc: hasGoal ? '已制定目标，点击查看或修改' : '用「反愿景 → 愿景」方法制定年度目标',
      color: '#4A6FA5',
      bg: 'linear-gradient(135deg, #4A6FA5 0%, #6B8FC4 100%)',
      path: '/my2026',
      badge: hasGoal ? '已制定' : undefined,
    },
    {
      key: 'reminder',
      icon: Bell,
      title: '复利闹钟',
      desc: '管理提醒、灵感池、复利追踪、专注模式',
      color: '#6D4C33',
      bg: 'linear-gradient(135deg, #6D4C33 0%, #8B6F55 100%)',
      path: '/reminder',
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #F5F0EB 0%, #EDE5DC 50%, #E8DFD5 100%)',
      }}
    >
      {/* Header */}
      <motion.div
        className="pt-14 pb-6 px-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-5 h-5" style={{ color: '#6D4C33' }} />
          <span className="text-sm font-medium tracking-wider" style={{ color: '#8B6F55' }}>
            IRIS · 数字工具箱
          </span>
          <Sparkles className="w-5 h-5" style={{ color: '#6D4C33' }} />
        </div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: '#3D2B1F' }}
        >
          我的 2026
        </h1>
        {vision && (
          <motion.p
            className="mt-3 text-sm italic max-w-[280px] mx-auto leading-relaxed"
            style={{ color: '#6D4C33' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            "{vision}"
          </motion.p>
        )}
      </motion.div>

      {/* Feature Cards */}
      <div className="flex-1 px-5 pb-10 space-y-4">
        {features.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 * i + 0.2 }}
            onClick={() => navigate(f.path)}
            className="relative rounded-2xl p-5 cursor-pointer active:scale-[0.98] transition-transform"
            style={{
              background: f.bg,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {f.badge && (
              <span
                className="absolute top-4 right-4 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  color: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {f.badge}
              </span>
            )}
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white mb-1">{f.title}</h2>
                <p className="text-sm text-white/75 leading-relaxed">{f.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/50 mt-1 flex-shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-[11px]" style={{ color: '#A89585' }}>
          用心生活，用工具提效
        </p>
      </div>
    </div>
  );
}
