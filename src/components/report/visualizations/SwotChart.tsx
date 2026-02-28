import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface SwotChartProps {
  data: SwotData;
}

const quadrants = [
  {
    key: 'strengths' as const,
    title: '优势 Strengths',
    icon: TrendingUp,
    bgColor: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  {
    key: 'weaknesses' as const,
    title: '劣势 Weaknesses',
    icon: TrendingDown,
    bgColor: 'from-orange-500/20 to-orange-600/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    iconBg: 'bg-orange-500/20',
  },
  {
    key: 'opportunities' as const,
    title: '机会 Opportunities',
    icon: Target,
    bgColor: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
  },
  {
    key: 'threats' as const,
    title: '威胁 Threats',
    icon: AlertTriangle,
    bgColor: 'from-red-500/20 to-red-600/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    iconBg: 'bg-red-500/20',
  },
];

export const SwotChart: React.FC<SwotChartProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {quadrants.map((quadrant, index) => {
        const Icon = quadrant.icon;
        const items = data[quadrant.key];
        
        return (
          <motion.div
            key={quadrant.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`
              p-5 rounded-2xl border backdrop-blur-xl
              bg-gradient-to-br ${quadrant.bgColor} ${quadrant.borderColor}
            `}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${quadrant.iconBg}`}>
                <Icon className={`w-5 h-5 ${quadrant.textColor}`} />
              </div>
              <h3 className={`font-bold ${quadrant.textColor}`}>{quadrant.title}</h3>
            </div>
            
            <ul className="space-y-2">
              {items.map((item, itemIndex) => (
                <motion.li
                  key={itemIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + itemIndex * 0.05 }}
                  className="flex items-start gap-2 text-sm text-slate-300"
                >
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${quadrant.textColor} bg-current flex-shrink-0`} />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SwotChart;
