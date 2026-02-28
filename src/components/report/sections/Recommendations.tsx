import React from 'react';
import { motion } from 'framer-motion';
import { FlowChart } from '../visualizations/FlowChart';
import { CompareTable } from '../visualizations/CompareTable';
import { HighlightBox } from '../visualizations/HighlightBox';
import { Target, CheckCircle, AlertCircle, Calendar, Search, MessageSquare, Rocket } from 'lucide-react';

export const Recommendations: React.FC = () => {
  const actionPhases = [
    { title: '了解阶段', description: '完成调研报告，准备汇报材料', icon: Search },
    { title: '沟通阶段', description: '与负责人沟通，确认参与方向', icon: MessageSquare },
    { title: '参与阶段', description: '参与具体工作，建立项目价值', icon: Rocket },
  ];

  const actionPlan = {
    columns: [
      { key: 'phase', title: '阶段', width: '15%' },
      { key: 'time', title: '时间', width: '25%' },
      { key: 'task', title: '任务', width: '35%' },
      { key: 'output', title: '产出', width: '25%' },
    ],
    data: [
      { phase: '了解', time: '1月9日-1月15日', task: '完成社区慈善调研报告', output: '本报告' },
      { phase: '了解', time: '1月9日-1月15日', task: '准备汇报材料', output: 'PPT或文档' },
      { phase: '沟通', time: '1月15日-1月20日', task: '与负责人沟通', output: '明确期望' },
      { phase: '沟通', time: '1月15日-1月20日', task: '了解项目团队', output: '建立联系' },
      { phase: '参与', time: '1月20日起', task: '参与具体工作', output: '具体贡献' },
    ],
  };

  const keyQuestions = [
    '深根者计划目前的运营团队是谁？',
    '共富学堂的具体功能和发展计划是什么？',
    '团队在社区慈善方向的短期目标是什么？',
    '有哪些可以参与的具体工作？',
  ];

  const risks = [
    '不要过度投入 - 在分工明确前，保持探索性投入',
    '保持灵活性 - 方向可能变化，不要押注单一方向',
    '建立多元联系 - 了解多个项目，不只是深根者计划',
  ];

  return (
    <section className="h-full w-full flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-3">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">建议方案</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-white">
          行动建议与下一步计划
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 text-center">分阶段行动计划</h3>
        <FlowChart steps={actionPhases} orientation="horizontal" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            详细时间表
          </h3>
          <CompareTable 
            columns={actionPlan.columns} 
            data={actionPlan.data}
            highlightColumn="phase"
          />
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              沟通问题清单
            </h3>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <ul className="space-y-2">
                {keyQuestions.map((q, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="mt-1 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span>{q}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <HighlightBox type="warning" icon={AlertCircle} title="风险提示">
              <ul className="space-y-1">
                {risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </HighlightBox>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Recommendations;
