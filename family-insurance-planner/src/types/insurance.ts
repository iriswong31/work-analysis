export interface FamilyMember {
  id: string;
  name: string;
  relation: 'self' | 'spouse' | 'child' | 'parent';
  age: number;
  gender: 'male' | 'female';
  annualIncome: number;
  healthStatus: 'excellent' | 'good' | 'fair';
  hasExistingInsurance: boolean;
}

export interface FamilyData {
  members: FamilyMember[];
  totalAnnualIncome: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface InsuranceBudget {
  annualPremiumBudget: number;      // 年度保费预算
  totalCoverageNeeded: number;       // 总保额需求
  breakdown: {
    criticalIllness: number;         // 重疾险保额
    medical: number;                 // 医疗险保额
    accident: number;                // 意外险保额
    lifeInsurance: number;           // 寿险保额
  };
}

export type InsuranceType = 'criticalIllness' | 'medical' | 'accident' | 'lifeInsurance';

export interface PolicyInfo {
  insurer: string;           // 保险公司
  productName: string;       // 产品名称
  insuranceType: InsuranceType;
  coverage: number;          // 保额
  premium: number;           // 保费
  effectiveDate: string;
  expiryDate: string;
}

export interface CoverageGap {
  type: InsuranceType;
  currentCoverage: number;
  recommendedCoverage: number;
  gap: number;
}

export interface DiagnosisReport {
  existingPolicies: PolicyInfo[];
  coverageGaps: CoverageGap[];
  recommendations: string[];
  score: number;             // 保障得分 0-100
}

export interface InsuranceProduct {
  id: string;
  name: string;
  company: string;
  type: InsuranceType;
  minCoverage: number;
  maxCoverage: number;
  priceRange: string;
  features: string[];
  rating: number;
  url?: string;
}