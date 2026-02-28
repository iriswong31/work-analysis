import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Quote } from 'lucide-react';

interface HighlightBoxProps {
  children: React.ReactNode;
  type?: 'quote' | 'info' | 'warning' | 'success';
  icon?: LucideIcon;
  title?: string;
}

const typeStyles = {
  quote: {
    bg: 'from-slate-500/10 to-slate-600/5',
    border: 'border-slate-500/30',
    icon: Quote,
    iconColor: 'text-slate-400',
  },
  info: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/30',
    icon: null,
    iconColor: 'text-blue-400',
  },
  warning: {
    bg: 'from-orange-500/10 to-orange-600/5',
    border: 'border-orange-500/30',
    icon: null,
    iconColor: 'text-orange-400',
  },
  success: {
    bg: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/30',
    icon: null,
    iconColor: 'text-emerald-400',
  },
};

export const HighlightBox: React.FC<HighlightBoxProps> = ({
  children,
  type = 'info',
  icon,
  title,
}) => {
  const styles = typeStyles[type];
  const Icon = icon || styles.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        relative p-5 rounded-xl border backdrop-blur-sm
        bg-gradient-to-br ${styles.bg} ${styles.border}
      `}
    >
      {Icon && (
        <Icon className={`absolute top-4 right-4 w-6 h-6 ${styles.iconColor} opacity-50`} />
      )}
      
      {title && (
        <h4 className={`font-semibold mb-2 ${styles.iconColor}`}>{title}</h4>
      )}
      
      <div className="text-slate-300 text-sm md:text-base leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
};

export default HighlightBox;
