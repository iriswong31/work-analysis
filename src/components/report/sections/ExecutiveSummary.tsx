import React from 'react';
import { motion } from 'framer-motion';
import { DataCard } from '../visualizations/DataCard';
import { HighlightBox } from '../visualizations/HighlightBox';
import { Coins, Users, Building2, FileText, Sparkles, Target } from 'lucide-react';

export const ExecutiveSummary: React.FC = () => {
  const keyMetrics = [
    { value: '337亿+', label: '腾讯公益善款总额', icon: Coins, color: 'blue' as const },
    { value: '13亿+', label: '参与捐赠人次', icon: Users, color: 'purple' as const },
    { value: '500亿+', label: '中国互联网募捐规模', icon: Building2, color: 'green' as const },
    { value: '350', label: '深根者计划首期学员', icon: Target, color: 'orange' as const },
    { value: '8', label: '覆盖城市和地区', icon: Building2, color: 'pink' as const },
    { value: '2024.9', label: '新慈善法施行', icon: FileText, color: 'blue' as const },
  ];

  const highlights = [
    '社区慈善被纳入国家战略，是"第三次分配"的重要载体',
    '新《慈善法》明确鼓励设立社区慈善组织',
    '深根者计划是腾讯公益+中国社会保障学会联合发起的旗舰项目',
    '"五社联动"机制成为基层治理的核心框架',
  ];

  return (
    <section className="h-full w-full flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 md:mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-4">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-400 font-medium">社区慈善调研报告</span>
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
          执行摘要
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
          社区慈善是国家战略级布局，腾讯正在积极响应
        </p>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {keyMetrics.map((metric, index) => (
          <DataCard
            key={index}
            value={metric.value}
            label={metric.label}
            icon={metric.icon}
            color={metric.color}
            delay={index}
          />
        ))}
      </div>

      {/* Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="max-w-4xl mx-auto"
      >
        <HighlightBox type="info" title="核心发现">
          <ul className="space-y-2">
            {highlights.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </HighlightBox>
      </motion.div>
    </section>
  );
};

export default ExecutiveSummary;
