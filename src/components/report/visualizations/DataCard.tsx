import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface DataCardProps {
  value: string | number;
  label: string;
  unit?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
  delay?: number;
}

const colorMap = {
  blue: {
    bg: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  purple: {
    bg: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  green: {
    bg: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  orange: {
    bg: 'from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20',
  },
  pink: {
    bg: 'from-pink-500/20 to-pink-600/10',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    glow: 'shadow-pink-500/20',
  },
};

export const DataCard: React.FC<DataCardProps> = ({
  value,
  label,
  unit,
  icon: Icon,
  color = 'blue',
  delay = 0,
}) => {
  const [displayValue, setDisplayValue] = useState<string | number>('0');
  const colors = colorMap[color];

  useEffect(() => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) : value;
    
    if (isNaN(numValue)) {
      setDisplayValue(value);
      return;
    }

    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(numValue * easeProgress);
      
      if (typeof value === 'string' && value.includes('+')) {
        setDisplayValue(`${currentValue}+`);
      } else if (typeof value === 'string' && value.includes('亿')) {
        setDisplayValue(`${(numValue * easeProgress).toFixed(1)}亿`);
      } else {
        setDisplayValue(currentValue);
      }

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: delay * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative p-6 rounded-2xl border backdrop-blur-xl
        bg-gradient-to-br ${colors.bg} ${colors.border}
        shadow-xl ${colors.glow}
        hover:scale-105 transition-transform duration-300
      `}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.bg} blur-xl opacity-50`} />
      
      <div className="relative z-10">
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center mb-4`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
        )}
        
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl md:text-5xl font-bold ${colors.text}`}>
            {displayValue}
          </span>
          {unit && (
            <span className="text-lg text-slate-400">{unit}</span>
          )}
        </div>
        
        <p className="mt-2 text-slate-300 text-sm md:text-base">{label}</p>
      </div>
    </motion.div>
  );
};

export default DataCard;
