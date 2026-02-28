import React from 'react';
import { motion } from 'framer-motion';

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  highlight?: boolean;
}

interface TimelineProps {
  events: TimelineEvent[];
  orientation?: 'vertical' | 'horizontal';
}

export const Timeline: React.FC<TimelineProps> = ({ events, orientation = 'vertical' }) => {
  if (orientation === 'horizontal') {
    return (
      <div className="relative w-full overflow-x-auto py-8">
        <div className="flex items-start gap-4 min-w-max px-4">
          {/* Timeline line */}
          <div className="absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-blue-500/50" />
          
          {events.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative flex flex-col items-center w-48"
            >
              {/* Node */}
              <div className={`
                w-6 h-6 rounded-full border-2 z-10
                ${event.highlight 
                  ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50' 
                  : 'bg-slate-800 border-slate-600'}
              `} />
              
              {/* Content */}
              <div className={`
                mt-4 p-4 rounded-xl text-center
                ${event.highlight 
                  ? 'bg-blue-500/10 border border-blue-500/30' 
                  : 'bg-slate-800/50'}
              `}>
                <span className={`
                  text-lg font-bold
                  ${event.highlight ? 'text-blue-400' : 'text-slate-300'}
                `}>
                  {event.year}
                </span>
                <h4 className="mt-2 font-semibold text-white text-sm">{event.title}</h4>
                <p className="mt-1 text-xs text-slate-400">{event.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-blue-500/50" />
      
      <div className="space-y-6">
        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative flex gap-6 pl-12"
          >
            {/* Node */}
            <div className={`
              absolute left-2 w-5 h-5 rounded-full border-2 z-10
              ${event.highlight 
                ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50' 
                : 'bg-slate-800 border-slate-600'}
            `} />
            
            {/* Content */}
            <div className={`
              flex-1 p-4 rounded-xl
              ${event.highlight 
                ? 'bg-blue-500/10 border border-blue-500/30' 
                : 'bg-slate-800/50'}
            `}>
              <div className="flex items-center gap-3">
                <span className={`
                  px-3 py-1 rounded-full text-sm font-bold
                  ${event.highlight 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-slate-700 text-slate-300'}
                `}>
                  {event.year}
                </span>
                <h4 className="font-semibold text-white">{event.title}</h4>
              </div>
              <p className="mt-2 text-sm text-slate-400">{event.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
