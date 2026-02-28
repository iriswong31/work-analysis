import React from 'react';
import { motion } from 'framer-motion';
import { Timeline } from '../visualizations/Timeline';
import { CompareTable } from '../visualizations/CompareTable';
import { HighlightBox } from '../visualizations/HighlightBox';
import { Scale, FileText } from 'lucide-react';

export const PolicyBackground: React.FC = () => {
  const timelineEvents = [
    { year: '2016', title: '《慈善法》颁布', description: '认可社区内部群众性互助互济活动', highlight: false },
    { year: '2021', title: '"五社联动"框架', description: '加强基层治理体系和治理能力现代化建设', highlight: false },
    { year: '2024.9', title: '《慈善法》修订施行', description: '明确鼓励设立社区慈善组织', highlight: true },
    { year: '2024.7', title: '二十届三中全会', description: '"支持发展公益慈善事业"写入决定', highlight: true },
  ];

  const distributionTable = {
    columns: [
      { key: 'type', title: '分配类型', width: '25%' },
      { key: 'leader', title: '主导力量', width: '25%' },
      { key: 'feature', title: '特征', width: '50%' },
    ],
    data: [
      { type: '第一次分配', leader: '市场', feature: '按要素贡献分配' },
      { type: '第二次分配', leader: '政府', feature: '税收和社会保障' },
      { type: '第三次分配', leader: '社会', feature: '道德力量推动，自愿慈善捐赠' },
    ],
  };

  const fiveElements = [
    { name: '社区', role: '平台', desc: '党组织牵头，提供服务场所' },
    { name: '社会组织', role: '载体', desc: '专业能力承接项目' },
    { name: '社会工作者', role: '支撑', desc: '专业方法精准摸排需求' },
    { name: '社区志愿者', role: '辅助', desc: '落地执行服务' },
    { name: '社会慈善资源', role: '补充', desc: '提供资金保障' },
  ];

  return (
    <section className="h-full w-full flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 mb-3">
          <Scale className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-400 font-medium">政策背景</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-white">
          社区慈善是国家战略的重要组成部分
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
        {/* Left: Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            政策演进脉络
          </h3>
          <Timeline events={timelineEvents} orientation="vertical" />
        </motion.div>

        {/* Right: Tables and Info */}
        <div className="space-y-4">
          {/* Distribution Table */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-white mb-3">第三次分配定位</h3>
            <CompareTable 
              columns={distributionTable.columns} 
              data={distributionTable.data}
              highlightColumn="type"
            />
          </motion.div>

          {/* Five Elements */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-white mb-3">"五社联动"机制</h3>
            <div className="grid grid-cols-5 gap-2">
              {fiveElements.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-center"
                >
                  <div className="text-sm font-bold text-blue-400">{item.name}</div>
                  <div className="text-xs text-slate-400 mt-1">({item.role})</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <HighlightBox type="quote">
              "第三次分配通过道德力量的推动，鼓励更多的高收入人群和企业更多回报社会，以实现社会财富由高向低流动的动态平衡。"
            </HighlightBox>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PolicyBackground;
