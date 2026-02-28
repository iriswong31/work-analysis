import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatItem {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  color?: 'blue' | 'purple' | 'green' | 'orange';
}

interface StatGroupProps {
  stats: StatItem[];
  layout?: 'row' | 'grid';
}

const colorMap = {
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  green: 'text-emerald-400',
  orange: 'text-orange-400',
};

export const StatGroup: React.FC<StatGroupProps> = ({ stats, layout = 'row' }) => {
  const containerClass = layout === 'grid' 
    ? 'grid grid-cols-2 md:grid-cols-4 gap-4' 
    : 'flex flex-wrap justify-center gap-8 md:gap-12';

  return (
    <div className={containerClass}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const textColor = colorMap[stat.color || 'blue'];
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center mb-2">
                <Icon className={`w-5 h-5 ${textColor}`} />
              </div>
            )}
            <span className={`text-3xl md:text-4xl font-bold ${textColor}`}>
              {stat.value}
            </span>
            <span className="mt-1 text-sm text-slate-400">{stat.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatGroup;
