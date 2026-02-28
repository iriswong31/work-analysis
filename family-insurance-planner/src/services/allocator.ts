import { FamilyData, InsuranceBudget, InsuranceType } from '@/types/insurance';

export interface InsuranceAllocation {
  type: InsuranceType;
  name: string;
  priority: number; // 1-4, 1为最高优先级
  recommendedAmount: number;
  description: string;
  reasons: string[];
  ageRange: string;
  features: string[];
}

export class InsuranceAllocator {
  /**
   * 生成四大险种配置方案
   */
  static generateAllocationPlan(familyData: FamilyData, budget: InsuranceBudget): InsuranceAllocation[] {
    const allocations: InsuranceAllocation[] = [
      {
        type: 'criticalIllness',
        name: '重疾险',
        priority: 1,
        recommendedAmount: budget.breakdown.criticalIllness,
        description: '重大疾病保险，确保患病期间的收入补偿和治疗费用',
        reasons: this.getCriticalIllnessReasons(familyData),
        ageRange: '0-55岁',
        features: ['确诊即赔', '收入损失补偿', '涵盖高发重疾', '可多次赔付']
      },
      {
        type: 'medical',
        name: '医疗险',
        priority: 2,
        recommendedAmount: budget.breakdown.medical,
        description: '医疗费用报销，覆盖住院、门诊等医疗支出',
        reasons: this.getMedicalReasons(familyData),
        ageRange: '0-65岁',
        features: ['百万保额', '不限社保', '住院垫付', '绿色通道']
      },
      {
        type: 'accident',
        name: '意外险',
        priority: 3,
        recommendedAmount: budget.breakdown.accident,
        description: '意外伤害保障，保费低保障高，全家必备',
        reasons: this.getAccidentReasons(familyData),
        ageRange: '0-75岁',
        features: ['意外身故', '意外伤残', '意外医疗', '交通意外']
      },
      {
        type: 'lifeInsurance',
        name: '寿险',
        priority: 4,
        recommendedAmount: budget.breakdown.lifeInsurance,
        description: '生命保障，主要针对家庭经济支柱，保障家庭责任',
        reasons: this.getLifeInsuranceReasons(familyData),
        ageRange: '18-60岁',
        features: ['身故保障', '全残保障', '保费低廉', '免体检额度高']
      }
    ];

    // 根据家庭情况调整优先级
    return this.adjustPriorities(allocations, familyData);
  }

  /**
   * 重疾险配置理由
   */
  private static getCriticalIllnessReasons(familyData: FamilyData): string[] {
    const reasons = ['重疾治疗费用高昂，需要充足的资金保障'];
    
    const workingMembers = familyData.members.filter(m => 
      (m.relation === 'self' || m.relation === 'spouse') && m.annualIncome > 0
    );
    
    if (workingMembers.length > 0) {
      reasons.push('患病期间无法工作，需要收入损失补偿');
    }
    
    const youngMembers = familyData.members.filter(m => m.age < 40);
    if (youngMembers.length > 0) {
      reasons.push('年轻时保费较低，是配置重疾险的最佳时期');
    }
    
    const hasChildren = familyData.members.some(m => m.relation === 'child');
    if (hasChildren) {
      reasons.push('家庭责任重大，需要充足保障维持家庭生活');
    }
    
    return reasons;
  }

  /**
   * 医疗险配置理由
   */
  private static getMedicalReasons(familyData: FamilyData): string[] {
    const reasons = ['医疗费用逐年上涨，社保报销有限'];
    
    const elderlyMembers = familyData.members.filter(m => m.age > 50);
    if (elderlyMembers.length > 0) {
      reasons.push('年龄增长，患病风险增加，医疗支出压力大');
    }
    
    const hasHealthIssues = familyData.members.some(m => m.healthStatus === 'fair');
    if (hasHealthIssues) {
      reasons.push('家庭成员健康状况一般，需要更全面的医疗保障');
    }
    
    reasons.push('百万医疗险保费低保额高，性价比极高');
    
    return reasons;
  }

  /**
   * 意外险配置理由
   */
  private static getAccidentReasons(familyData: FamilyData): string[] {
    const reasons = ['意外风险无处不在，保费低廉但保障全面'];
    
    const workingMembers = familyData.members.filter(m => 
      m.annualIncome > 0 && m.age >= 18 && m.age <= 60
    );
    
    if (workingMembers.length > 0) {
      reasons.push('工作通勤和职业活动存在意外风险');
    }
    
    const hasChildren = familyData.members.some(m => m.relation === 'child');
    if (hasChildren) {
      reasons.push('儿童活泼好动，意外伤害发生率较高');
    }
    
    const hasElderly = familyData.members.some(m => m.age > 60);
    if (hasElderly) {
      reasons.push('老年人行动不便，跌倒等意外风险增加');
    }
    
    return reasons;
  }

  /**
   * 寿险配置理由
   */
  private static getLifeInsuranceReasons(familyData: FamilyData): string[] {
    const reasons = [];
    
    const primaryEarner = familyData.members
      .filter(m => m.relation === 'self' || m.relation === 'spouse')
      .sort((a, b) => b.annualIncome - a.annualIncome)[0];
    
    if (primaryEarner && primaryEarner.annualIncome > 0) {
      reasons.push('家庭经济支柱需要充足的身故保障');
    }
    
    const hasChildren = familyData.members.some(m => m.relation === 'child');
    if (hasChildren) {
      reasons.push('保障子女教育和成长费用');
    }
    
    if (familyData.totalLiabilities > 0) {
      reasons.push('覆盖房贷等家庭债务，避免家庭负担');
    }
    
    const hasElderly = familyData.members.some(m => m.relation === 'parent');
    if (hasElderly) {
      reasons.push('保障父母养老责任');
    }
    
    if (reasons.length === 0) {
      reasons.push('定期寿险保费低廉，为家庭提供基础保障');
    }
    
    return reasons;
  }

  /**
   * 根据家庭情况调整优先级
   */
  private static adjustPriorities(allocations: InsuranceAllocation[], familyData: FamilyData): InsuranceAllocation[] {
    const adjusted = [...allocations];
    
    // 有老人的家庭，医疗险优先级提升
    const hasElderly = familyData.members.some(m => m.age > 60);
    if (hasElderly) {
      const medicalIndex = adjusted.findIndex(a => a.type === 'medical');
      if (medicalIndex !== -1) {
        adjusted[medicalIndex].priority = Math.max(1, adjusted[medicalIndex].priority - 1);
      }
    }
    
    // 有小孩的家庭，意外险和寿险优先级提升
    const hasChildren = familyData.members.some(m => m.relation === 'child');
    if (hasChildren) {
      const accidentIndex = adjusted.findIndex(a => a.type === 'accident');
      const lifeIndex = adjusted.findIndex(a => a.type === 'lifeInsurance');
      
      if (accidentIndex !== -1) {
        adjusted[accidentIndex].priority = Math.max(1, adjusted[accidentIndex].priority - 1);
      }
      if (lifeIndex !== -1) {
        adjusted[lifeIndex].priority = Math.max(1, adjusted[lifeIndex].priority - 1);
      }
    }
    
    // 高收入家庭，重疾险优先级最高
    const highIncome = familyData.totalAnnualIncome > 500000; // 50万以上
    if (highIncome) {
      const criticalIndex = adjusted.findIndex(a => a.type === 'criticalIllness');
      if (criticalIndex !== -1) {
        adjusted[criticalIndex].priority = 1;
      }
    }
    
    // 重新排序
    return adjusted.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 获取配置建议文案
   */
  static getConfigurationAdvice(familyData: FamilyData, allocations: InsuranceAllocation[]): string[] {
    const advice = [];
    
    // 基础建议
    advice.push('建议按优先级顺序配置，先保障后理财');
    advice.push('选择产品时重点关注保障范围和理赔条件');
    
    // 个性化建议
    const totalIncome = familyData.totalAnnualIncome;
    if (totalIncome < 100000) {
      advice.push('收入有限，建议优先配置消费型保险，保费压力小');
    } else if (totalIncome > 500000) {
      advice.push('收入较高，可考虑储蓄型产品，兼顾保障和储蓄');
    }
    
    const hasChildren = familyData.members.some(m => m.relation === 'child');
    if (hasChildren) {
      advice.push('有子女的家庭，建议夫妻双方都配置充足保障');
    }
    
    const hasElderly = familyData.members.some(m => m.age > 60);
    if (hasElderly) {
      advice.push('老年人配置保险受限较多，建议尽早规划');
    }
    
    advice.push('定期评估保险需求，随着人生阶段变化及时调整');
    
    return advice;
  }
}