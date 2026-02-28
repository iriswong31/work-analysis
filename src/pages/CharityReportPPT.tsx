import React from 'react';
import { FullPageContainer } from '@/components/report/FullPageContainer';
import {
  ExecutiveSummary,
  PolicyBackground,
  TencentLayout,
  TrainingProgram,
  RelatedProjects,
  OpportunityAnalysis,
  Recommendations,
} from '@/components/report/sections';

const sectionNames = [
  '执行摘要',
  '政策背景',
  '腾讯布局',
  '深根者培训',
  '相关项目',
  '机会分析',
  '建议方案',
];

export const CharityReportPPT: React.FC = () => {
  return (
    <FullPageContainer sectionNames={sectionNames}>
      <ExecutiveSummary />
      <PolicyBackground />
      <TencentLayout />
      <TrainingProgram />
      <RelatedProjects />
      <OpportunityAnalysis />
      <Recommendations />
    </FullPageContainer>
  );
};

export default CharityReportPPT;
