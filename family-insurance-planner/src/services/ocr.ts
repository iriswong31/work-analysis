import { PolicyInfo, DiagnosisReport, CoverageGap, InsuranceType } from '@/types/insurance';

export interface OCRResult {
  success: boolean;
  text?: string;
  error?: string;
}

export interface PolicyOCRResult {
  success: boolean;
  policy?: PolicyInfo;
  error?: string;
}

export class PolicyOCRService {
  private static readonly API_KEY = process.env.ARK_API_KEY || '';
  private static readonly MODEL = 'ep-20260121005507-nl4gw';
  private static readonly API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

  /**
   * 将图片文件转换为base64
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 调用豆包视觉API进行OCR识别
   */
  private static async callDoubaoVision(imageBase64: string, prompt: string): Promise<OCRResult> {
    if (!this.API_KEY) {
      return { success: false, error: '请配置豆包API密钥' };
    }

    const payload = {
      model: this.MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    };

    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return { success: false, error: `API调用失败: ${response.statusText}` };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      return { success: false, error: '未能获取识别结果' };
    }

    return { success: true, text };
  }

  /**
   * 识别保单图片并提取关键信息
   */
  static async recognizePolicy(file: File): Promise<PolicyOCRResult> {
    const imageBase64 = await this.fileToBase64(file);
    
    const prompt = `
请仔细分析这张保单图片，提取以下关键信息并以JSON格式返回：

{
  "insurer": "保险公司名称",
  "productName": "保险产品名称",
  "insuranceType": "保险类型(criticalIllness/medical/accident/lifeInsurance)",
  "coverage": "保额(数字，单位元)",
  "premium": "保费(数字，单位元)",
  "effectiveDate": "生效日期(YYYY-MM-DD格式)",
  "expiryDate": "到期日期(YYYY-MM-DD格式)",
  "policyNumber": "保单号码",
  "insuredName": "被保险人姓名"
}

注意：
1. 如果是重疾险，insuranceType填写"criticalIllness"
2. 如果是医疗险，insuranceType填写"medical"  
3. 如果是意外险，insuranceType填写"accident"
4. 如果是寿险，insuranceType填写"lifeInsurance"
5. 保额和保费请提取数字部分，去掉单位
6. 日期格式统一为YYYY-MM-DD
7. 如果某些信息无法识别，请填写null

请只返回JSON格式的结果，不要包含其他说明文字。
`;

    const ocrResult = await this.callDoubaoVision(imageBase64, prompt);
    
    if (!ocrResult.success || !ocrResult.text) {
      return { success: false, error: ocrResult.error };
    }

    // 解析JSON结果
    let policyData;
    const jsonMatch = ocrResult.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      policyData = JSON.parse(jsonMatch[0]);
    } else {
      return { success: false, error: '无法解析保单信息' };
    }

    // 构建PolicyInfo对象
    const policy: PolicyInfo = {
      insurer: policyData.insurer || '未知保险公司',
      productName: policyData.productName || '未知产品',
      insuranceType: policyData.insuranceType || 'criticalIllness',
      coverage: parseFloat(policyData.coverage) || 0,
      premium: parseFloat(policyData.premium) || 0,
      effectiveDate: policyData.effectiveDate || '',
      expiryDate: policyData.expiryDate || '',
    };

    return { success: true, policy };
  }

  /**
   * 分析保单并生成诊断报告
   */
  static async generateDiagnosisReport(
    policies: PolicyInfo[], 
    recommendedBudget: { breakdown: Record<InsuranceType, number> }
  ): Promise<DiagnosisReport> {
    // 计算现有保障
    const existingCoverage = {
      criticalIllness: 0,
      medical: 0,
      accident: 0,
      lifeInsurance: 0,
    };

    policies.forEach(policy => {
      existingCoverage[policy.insuranceType] += policy.coverage;
    });

    // 计算保障缺口
    const coverageGaps: CoverageGap[] = [];
    Object.entries(recommendedBudget.breakdown).forEach(([type, recommended]) => {
      const current = existingCoverage[type as InsuranceType];
      const gap = Math.max(0, recommended - current);
      
      if (gap > 0) {
        coverageGaps.push({
          type: type as InsuranceType,
          currentCoverage: current,
          recommendedCoverage: recommended,
          gap,
        });
      }
    });

    // 生成建议
    const recommendations = this.generateRecommendations(coverageGaps, policies);

    // 计算保障得分
    const score = this.calculateProtectionScore(existingCoverage, recommendedBudget.breakdown);

    return {
      existingPolicies: policies,
      coverageGaps,
      recommendations,
      score,
    };
  }

  /**
   * 生成优化建议
   */
  private static generateRecommendations(gaps: CoverageGap[], policies: PolicyInfo[]): string[] {
    const recommendations = [];

    if (gaps.length === 0) {
      recommendations.push('恭喜！您的保险配置已经比较完善');
      recommendations.push('建议定期评估保险需求，随着收入和家庭情况变化及时调整');
      return recommendations;
    }

    // 按缺口大小排序
    const sortedGaps = gaps.sort((a, b) => b.gap - a.gap);

    sortedGaps.forEach(gap => {
      const typeName = {
        criticalIllness: '重疾险',
        medical: '医疗险',
        accident: '意外险',
        lifeInsurance: '寿险',
      }[gap.type];

      const gapAmount = (gap.gap / 10000).toFixed(1);
      recommendations.push(`${typeName}保障不足${gapAmount}万元，建议补充配置`);
    });

    // 检查保单是否即将到期
    const currentDate = new Date();
    const soonExpiring = policies.filter(policy => {
      if (!policy.expiryDate) return false;
      const expiryDate = new Date(policy.expiryDate);
      const monthsUntilExpiry = (expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsUntilExpiry <= 6 && monthsUntilExpiry > 0;
    });

    if (soonExpiring.length > 0) {
      recommendations.push(`有${soonExpiring.length}份保单即将到期，请及时续保或更换`);
    }

    // 检查是否有重复保障
    const typeCount = policies.reduce((acc, policy) => {
      acc[policy.insuranceType] = (acc[policy.insuranceType] || 0) + 1;
      return acc;
    }, {} as Record<InsuranceType, number>);

    Object.entries(typeCount).forEach(([type, count]) => {
      if (count > 2) {
        const typeName = {
          criticalIllness: '重疾险',
          medical: '医疗险',
          accident: '意外险',
          lifeInsurance: '寿险',
        }[type as InsuranceType];
        recommendations.push(`${typeName}配置较多(${count}份)，建议整合优化避免重复保障`);
      }
    });

    return recommendations;
  }

  /**
   * 计算保障得分
   */
  private static calculateProtectionScore(
    existing: Record<InsuranceType, number>,
    recommended: Record<InsuranceType, number>
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // 各险种权重
    const weights = {
      criticalIllness: 0.4,
      medical: 0.25,
      accident: 0.2,
      lifeInsurance: 0.15,
    };

    Object.entries(weights).forEach(([type, weight]) => {
      const existingAmount = existing[type as InsuranceType];
      const recommendedAmount = recommended[type as InsuranceType];
      
      if (recommendedAmount > 0) {
        const coverage = Math.min(1, existingAmount / recommendedAmount);
        totalScore += coverage * weight * 100;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }
}