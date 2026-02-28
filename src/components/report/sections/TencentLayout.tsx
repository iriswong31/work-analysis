import React from 'react';
import { motion } from 'framer-motion';
import { DataCard } from '../visualizations/DataCard';
import { CompareTable } from '../visualizations/CompareTable';
import { Building, Heart, Users, Globe, Smartphone, Database } from 'lucide-react';

export const TencentLayout: React.FC = () => {
  const stats = [
    { value: '337亿+', label: '善款总额', icon: Heart, color: 'blue' as const },
    { value: '13亿+', label: '捐赠人次', icon: Users, color: 'purple' as const },
    { value: '4万+', label: '入驻机构', icon: Building, color: 'green' as const },
    { value: '47万+', label: '村民说事线上化', icon: Smartphone, color: 'orange' as const },
  ];

  const platforms = {
    columns: [
      { key: 'platform', title: '平台/项目', width: '25%' },
      { key: 'type', title: '类型', width: '20%' },
      { key: 'feature', title: '核心功能', width: '55%' },
    ],
    data: [
      { platform: '腾讯公益', type: '募捐平台', feature: '中国最大互联网公开募捐平台' },
      { platform: '数字关爱平台', type: '服务工具', feature: '为社区提供数字化服务能力' },
      { platform: '深根者计划', type: '人才培养', feature: '社区慈善人才培养旗舰项目' },
      { platform: '为村共富乡村', type: '乡村振兴', feature: '覆盖17省309县' },
    ],
  };

  const businessUnits = [
    { name: 'SSV', desc: '可持续社会价值事业部', color: 'bg-blue-500' },
    { name: '腾讯公益', desc: '公益慈善基金会', color: 'bg-purple-500' },
    { name: '为村实验室', desc: '乡村振兴', color: 'bg-green-500' },
    { name: 'CDC', desc: '用户研究与体验设计', color: 'bg-orange-500' },
  ];

  return (
    <section className="h-full w-full flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 mb-3">
          <Globe className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-medium">腾讯布局</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-white">
          腾讯公益慈善生态版图
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-5xl mx-auto w-full">
        {stats.map((stat, index) => (
          <DataCard
            key={index}
            value={stat.value}
            label={stat.label}
            icon={stat.icon}
            color={stat.color}
            delay={index}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            核心业务单元
          </h3>
          {businessUnits.map((unit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-4"
            >
              <div className={`w-3 h-12 rounded-full ${unit.color}`} />
              <div>
                <div className="font-bold text-white">{unit.name}</div>
                <div className="text-sm text-slate-400">{unit.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-white mb-3">核心平台与项目</h3>
          <CompareTable 
            columns={platforms.columns} 
            data={platforms.data}
            highlightColumn="platform"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default TencentLayout;
