import React from 'react';
import { motion } from 'framer-motion';
import { CompareTable } from '../visualizations/CompareTable';
import { Layers, GitBranch, ArrowRight } from 'lucide-react';

export const RelatedProjects: React.FC = () => {
  const projectComparison = {
    columns: [
      { key: 'project', title: '项目', width: '20%' },
      { key: 'initiator', title: '发起方', width: '25%' },
      { key: 'target', title: '对象', width: '25%' },
      { key: 'feature', title: '特色', width: '30%' },
    ],
    data: [
      { project: '深根者计划', initiator: '中国社会保障学会+腾讯基金会', target: '社区慈善人才', feature: '三阶段培养，350人首期' },
      { project: '数字人才开放计划', initiator: '腾讯公益+西部人才基金会', target: '公益组织从业者', feature: '法律、财务、筹款技能' },
      { project: '数字强基资助计划', initiator: '腾讯公益', target: '基层公益机构', feature: '规范化管理、数字化能力' },
      { project: '乡村CEO培养', initiator: '腾讯SSV为村实验室', target: '乡村经营人才', feature: '职业经理人培养' },
    ],
  };

  const sceneComparison = {
    columns: [
      { key: 'project', title: '项目', width: '25%' },
      { key: 'scene', title: '场景', width: '20%' },
      { key: 'people', title: '人群', width: '25%' },
      { key: 'goal', title: '目标', width: '30%' },
    ],
    data: [
      { project: '深根者计划', scene: '城市社区', people: '社区干部、社工、商户等', goal: '社区慈善人才' },
      { project: '为村共富乡村', scene: '农村乡村', people: '乡村经营者、返乡青年', goal: '乡村振兴人才' },
      { project: '数字人才计划', scene: '公益行业', people: '公益组织从业者', goal: '专业能力提升' },
    ],
  };

  const relationNodes = [
    { name: '社区慈善方向', sub: '深根者计划（核心）', color: 'bg-blue-500' },
    { name: '公益组织方向', sub: '数字人才开放计划\n数字强基资助计划', color: 'bg-purple-500' },
    { name: '乡村振兴方向', sub: '乡村CEO培养', color: 'bg-green-500' },
  ];

  return (
    <section className="h-full w-full flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 mb-3">
          <Layers className="w-4 h-4 text-pink-400" />
          <span className="text-sm text-pink-400 font-medium">相关项目</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-white">
          腾讯公益人才培养项目矩阵
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full mb-6">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            项目关系图谱
          </h3>
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="text-center text-sm text-slate-400 mb-4">腾讯公益人才培养体系</div>
            <div className="space-y-3">
              {relationNodes.map((node, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-3 h-3 rounded-full ${node.color}`} />
                  <div className="flex-1 p-3 rounded-lg bg-slate-800/50">
                    <div className="font-medium text-white text-sm">{node.name}</div>
                    <div className="text-xs text-slate-400 mt-1 whitespace-pre-line">{node.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 space-y-4"
        >
          <h3 className="text-lg font-semibold text-white">项目对比</h3>
          <CompareTable 
            columns={projectComparison.columns} 
            data={projectComparison.data}
            highlightColumn="project"
          />
          
          <h3 className="text-lg font-semibold text-white mt-4">定位差异</h3>
          <CompareTable 
            columns={sceneComparison.columns} 
            data={sceneComparison.data}
            highlightColumn="scene"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex flex-wrap justify-center gap-4 text-sm"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
          <span className="text-blue-400">人才互通</span>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span className="text-slate-400">深根者学员可参与乡村项目</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30">
          <span className="text-purple-400">工具共享</span>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span className="text-slate-400">数字关爱平台等工具通用</span>
        </div>
      </motion.div>
    </section>
  );
};

export default RelatedProjects;
