import React from 'react';
import { motion } from 'framer-motion';
import { FlowChart } from '../visualizations/FlowChart';
import { CompareTable } from '../visualizations/CompareTable';
import { HighlightBox } from '../visualizations/HighlightBox';
import { GraduationCap, BookOpen, Users, Rocket, MapPin, Calendar } from 'lucide-react';

export const TrainingProgram: React.FC = () => {
  const trainingSteps = [
    { title: '理论筑基', description: '3天集中授课，慈善法培训', icon: BookOpen },
    { title: '实践强基', description: '跨区域参访，实地考察', icon: MapPin },
    { title: '成效扩基', description: '微项目落地，种子基金', icon: Rocket },
  ];

  const cityProgress = {
    columns: [
      { key: 'city', title: '城市', width: '20%' },
      { key: 'time', title: '时间', width: '25%' },
      { key: 'partner', title: '合作方', width: '35%' },
      { key: 'scale', title: '规模', width: '20%' },
    ],
    data: [
      { city: '北京', time: '2024年9月4日', partner: '启动仪式', scale: '-' },
      { city: '重庆', time: '2024年11月26日', partner: '清华大学公益慈善研究院', scale: '50名' },
      { city: '长沙', time: '2024年12月23日', partner: '长沙市民政局', scale: '赋能基地' },
      { city: '杭州', time: '2025年11月2日', partner: '杭州赋能实践基地', scale: '首期班' },
    ],
  };

  const targetRoles = [
    '县（区）民政主管领导',
    '街道社区干部',
    '社工',
    '居民志愿者达人',
    '社区社会组织主理人',
    '青年创业者',
    '社区小店经营者',
  ];

  return (
    <section className="h-full w-full flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 mb-3">
          <GraduationCap className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-orange-400 font-medium">深根者培训</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-white">
          深根者计划 — 社区慈善人才培养
        </h2>
        <p className="text-slate-400 mt-2">首期350名学员，覆盖8个城市和地区</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 text-center">三阶段培养体系</h3>
        <FlowChart steps={trainingSteps} orientation="horizontal" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            培养对象
          </h3>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex flex-wrap gap-2">
              {targetRoles.map((role, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-sm text-purple-300"
                >
                  {role}
                </motion.span>
              ))}
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-4"
          >
            <HighlightBox type="success" title="核心理念">
              立足社区、动员社区、服务社区、提升社区
            </HighlightBox>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            各地开班进展
          </h3>
          <CompareTable 
            columns={cityProgress.columns} 
            data={cityProgress.data}
            highlightColumn="city"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default TrainingProgram;
