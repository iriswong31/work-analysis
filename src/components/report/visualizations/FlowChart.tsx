import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface FlowStep {
  title: string;
  description: string;
  icon?: LucideIcon;
}

interface FlowChartProps {
  steps: FlowStep[];
  orientation?: 'horizontal' | 'vertical';
}

export const FlowChart: React.FC<FlowChartProps> = ({ steps, orientation = 'horizontal' }) => {
  if (orientation === 'vertical') {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                    {Icon ? (
                      <Icon className="w-6 h-6 text-blue-400" />
                    ) : (
                      <span className="text-lg font-bold text-blue-400">{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-transparent" />
                  )}
                </div>
                
                <div className="flex-1 pb-8">
                  <h4 className="font-semibold text-white">{step.title}</h4>
                  <p className="mt-1 text-sm text-slate-400">{step.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <React.Fragment key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center w-32 md:w-40"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mb-3">
                {Icon ? (
                  <Icon className="w-7 h-7 text-blue-400" />
                ) : (
                  <span className="text-xl font-bold text-blue-400">{index + 1}</span>
                )}
              </div>
              <h4 className="font-semibold text-white text-sm">{step.title}</h4>
              <p className="mt-1 text-xs text-slate-400 line-clamp-2">{step.description}</p>
            </motion.div>
            
            {index < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                className="hidden md:block"
              >
                <ArrowRight className="w-6 h-6 text-slate-500" />
              </motion.div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FlowChart;
