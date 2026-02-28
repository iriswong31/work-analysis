import React from 'react';
import { motion } from 'framer-motion';
import { SwotChart } from '../visualizations/SwotChart';
import { Compass, Lightbulb } from 'lucide-react';

export const OpportunityAnalysis: React.FC = () => {
  const swotData = {
    strengths: [
      '腾讯公益是中国最大互联网募捐平台',
      '337亿+善款，13亿+捐赠人次',
      '强大的技术能力和数字化工具',
      '与政府、学术机构的深度合作关系',
    ],
    weaknesses: [
      '社区慈善人才储备不足',
      '线下服务能力有限',
      '社区场景数字化工具待完善',
      '跨部门协同机制待优化',
    ],
    opportunities: [
      '新《慈善法》明确鼓励社区慈善',
      '"五社联动"成为国家战略',
      '政策窗口期，各地积极响应',
      '数字化工具需求巨大',
    ],
    threats: [
      '其他互联网平台竞争',
      '政策执行的地区差异',
      '社区信任建立需要时间',
      '人才培养周期较长',
    ],
  };

  const entryPoints = [
    { title: '数字化工具', desc: '数字关爱平台、小程序等工具优化', color: 'blue' },
    { title: '培训内容', desc: '课程设计、数字化工具教学', color: 'purple' },
    { title: '项目运营', desc: '微项目支持、种子基金管理', color: 'green' },
    { title: '生态连接', desc: '连接政府、社区、公益组织', color: 'orange' },
  ];

  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
  };

  return (
    <section className="h-full w-full flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 mb-3">
          <Compass className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-400 font-medium">机会分析</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-white">
          SWOT 分析与切入点
        </h2>
      </motion.div>

      <div className="max-w-5xl mx-auto w-full mb-6">
        <SwotChart data={swotData} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="max-w-4xl mx-auto w-full"
      >
        <h3 className="text-lg font-semibold text-white mb-4 text-center flex items-center justify-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          可能的切入点
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {entryPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              className={`p-4 rounded-xl bg-gradient-to-br border ${colorMap[point.color as keyof typeof colorMap]}`}
            >
              <div className="font-semibold text-white text-sm">{point.title}</div>
              <div className="text-xs text-slate-400 mt-1">{point.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default OpportunityAnalysis;
