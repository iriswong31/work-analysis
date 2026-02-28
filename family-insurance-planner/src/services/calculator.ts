import { FamilyMember, FamilyData, InsuranceBudget } from '@/types/insurance';

export class InsuranceCalculator {
  /**
   * 双十原则：年保费=年收入10%，保额=年收入10倍
   */
  static calculateByDoubleTenRule(familyData: FamilyData): InsuranceBudget {
    const { totalAnnualIncome } = familyData;
    
    const annualPremiumBudget = totalAnnualIncome * 0.1;
    const totalCoverageNeeded = totalAnnualIncome * 10;
    
    // 按优先级分配保额
    const breakdown = {
      criticalIllness: totalCoverageNeeded * 0.4,  // 40% - 重疾险最重要
      medical: totalCoverageNeeded * 0.2,          // 20% - 医疗险
      accident: totalCoverageNeeded * 0.2,         // 20% - 意外险
      lifeInsurance: totalCoverageNeeded * 0.2,    // 20% - 寿险
    };
    
    return {
      annualPremiumBudget,
      totalCoverageNeeded,
      breakdown,
    };
  }

  /**
   * 生命价值法：基于未来收入现值计算
   */
  static calculateByLifeValueMethod(member: FamilyMember): number {
    const { age, annualIncome } = member;
    const retirementAge = 65;
    const workingYears = Math.max(0, retirementAge - age);
    const discountRate = 0.03; // 3% 折现率
    const incomeGrowthRate = 0.05; // 5% 收入增长率
    
    let presentValue = 0;
    for (let year = 1; year <= workingYears; year++) {
      const futureIncome = annualIncome * Math.pow(1 + incomeGrowthRate, year);
      const discountedValue = futureIncome / Math.pow(1 + discountRate, year);
      presentValue += discountedValue;
    }
    
    return Math.round(presentValue);
  }

  /**
   * 综合计算保险需求
   */
  static calculateComprehensive(familyData: FamilyData): InsuranceBudget {
    // 使用双十原则作为基础
    const doubleTenResult = this.calculateByDoubleTenRule(familyData);
    
    // 对主要收入来源使用生命价值法调整
    const primaryEarner = familyData.members
      .filter(m => m.relation === 'self' || m.relation === 'spouse')
      .sort((a, b) => b.annualIncome - a.annualIncome)[0];
    
    if (primaryEarner) {
      const lifeValue = this.calculateByLifeValueMethod(primaryEarner);
      // 如果生命价值法计算的保额更高，则适当调整
      if (lifeValue > doubleTenResult.totalCoverageNeeded) {
        const adjustmentFactor = Math.min(1.5, lifeValue / doubleTenResult.totalCoverageNeeded);
        doubleTenResult.totalCoverageNeeded *= adjustmentFactor;
        
        // 按比例调整各险种保额
        Object.keys(doubleTenResult.breakdown).forEach(key => {
          doubleTenResult.breakdown[key as keyof typeof doubleTenResult.breakdown] *= adjustmentFactor;
        });
      }
    }
    
    return doubleTenResult;
  }

  /**
   * 根据家庭情况调整保险配置
   */
  static adjustForFamilyStructure(budget: InsuranceBudget, familyData: FamilyData): InsuranceBudget {
    const { members } = familyData;
    const hasChildren = members.some(m => m.relation === 'child');
    const hasElderly = members.some(m => m.relation === 'parent' && m.age > 60);
    
    const adjusted = { ...budget };
    
    // 有孩子的家庭，增加寿险和意外险比重
    if (hasChildren) {
      const increase = budget.totalCoverageNeeded * 0.1;
      adjusted.breakdown.lifeInsurance += increase * 0.6;
      adjusted.breakdown.accident += increase * 0.4;
      adjusted.totalCoverageNeeded += increase;
    }
    
    // 有老人的家庭，增加医疗险比重
    if (hasElderly) {
      const increase = budget.totalCoverageNeeded * 0.15;
      adjusted.breakdown.medical += increase;
      adjusted.totalCoverageNeeded += increase;
    }
    
    return adjusted;
  }
}