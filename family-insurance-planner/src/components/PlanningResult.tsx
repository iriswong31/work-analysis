import { useState } from 'react'
import { ArrowLeft, Download, Share2, Info, TrendingUp, Shield, Heart, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FamilyData, InsuranceBudget } from '@/types/insurance'
import { InsuranceCalculator } from '@/services/calculator'
import { InsuranceAllocator } from '@/services/allocator'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface PlanningResultProps {
  familyData: FamilyData
  onBack: () => void
  onNext: (step: 'policy-diagnosis' | 'product-recommendation') => void
}

const insuranceTypeNames = {
  criticalIllness: '重疾险',
  medical: '医疗险',
  accident: '意外险',
  lifeInsurance: '寿险',
}

const insuranceTypeIcons = {
  criticalIllness: Shield,
  medical: Heart,
  accident: Zap,
  lifeInsurance: Users,
}

const insuranceTypeColors = {
  criticalIllness: '#0891B2',
  medical: '#10B981',
  accident: '#F59E0B',
  lifeInsurance: '#6366F1',
}

export default function PlanningResult({ familyData, onBack, onNext }: PlanningResultProps) {
  const [selectedTab, setSelectedTab] = useState('overview')
  
  // 计算保险预算
  const budget = InsuranceCalculator.calculateComprehensive(familyData)
  const adjustedBudget = InsuranceCalculator.adjustForFamilyStructure(budget, familyData)
  
  // 生成配置方案
  const allocations = InsuranceAllocator.generateAllocationPlan(familyData, adjustedBudget)
  const configAdvice = InsuranceAllocator.getConfigurationAdvice(familyData, allocations)

  // 准备图表数据
  const pieData = Object.entries(adjustedBudget.breakdown).map(([key, value]) => ({
    name: insuranceTypeNames[key as keyof typeof insuranceTypeNames],
    value: Math.round(value / 10000), // 转换为万元
    color: insuranceTypeColors[key as keyof typeof insuranceTypeColors],
  }))

  const barData = Object.entries(adjustedBudget.breakdown).map(([key, value]) => ({
    name: insuranceTypeNames[key as keyof typeof insuranceTypeNames],
    amount: Math.round(value / 10000),
    color: insuranceTypeColors[key as keyof typeof insuranceTypeColors],
  }))

  const formatMoney = (amount: number) => {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`
    }
    return `${amount.toLocaleString()}元`
  }

  const downloadReport = () => {
    // TODO: 实现图片下载功能
    console.log('下载报告')
  }

  const shareReport = () => {
    // TODO: 实现分享功能
    console.log('分享报告')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-primary-100 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-secondary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={shareReport}
              className="text-primary-600 border-primary-200"
            >
              <Share2 className="w-4 h-4 mr-1" />
              分享
            </Button>
            <Button
              size="sm"
              onClick={downloadReport}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Download className="w-4 h-4 mr-1" />
              下载
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* 总览卡片 */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">您的家庭保险规划</h2>
                  <p className="text-primary-100 text-sm">基于科学算法为您量身定制</p>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-2xl font-bold">
                      {formatMoney(adjustedBudget.totalCoverageNeeded)}
                    </div>
                    <div className="text-primary-100 text-sm">建议总保额</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-lg font-semibold">
                        {formatMoney(adjustedBudget.annualPremiumBudget)}
                      </div>
                      <div className="text-primary-100 text-xs">年度保费预算</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-lg font-semibold">
                        {familyData.members.length}人
                      </div>
                      <div className="text-primary-100 text-xs">保障人数</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 详细分析 */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">保额分配</TabsTrigger>
              <TabsTrigger value="details">详细说明</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* 饼图 */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">保额分配比例</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`${value}万元`, '保额']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 险种列表 */}
              <div className="space-y-3">
                {Object.entries(adjustedBudget.breakdown).map(([key, value]) => {
                  const typeName = insuranceTypeNames[key as keyof typeof insuranceTypeNames]
                  const IconComponent = insuranceTypeIcons[key as keyof typeof insuranceTypeIcons]
                  const color = insuranceTypeColors[key as keyof typeof insuranceTypeColors]
                  const percentage = (value / adjustedBudget.totalCoverageNeeded) * 100

                  return (
                    <Card key={key} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <IconComponent className="w-5 h-5" style={{ color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-secondary-900">{typeName}</span>
                              <span className="text-sm font-semibold text-secondary-700">
                                {formatMoney(value)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Progress value={percentage} className="flex-1 h-2" />
                              <span className="text-xs text-secondary-500 w-10">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Info className="w-4 h-4 mr-2 text-primary-600" />
                    计算依据
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-primary-50 rounded-lg p-3">
                    <h4 className="font-medium text-secondary-900 mb-2">双十原则</h4>
                    <p className="text-sm text-secondary-600 leading-relaxed">
                      年保费支出不超过家庭年收入的10%，保险金额不低于家庭年收入的10倍。
                      这是国际通用的保险配置原则，既保证充足保障又不影响生活质量。
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="font-medium text-secondary-900 mb-2">生命价值法</h4>
                    <p className="text-sm text-secondary-600 leading-relaxed">
                      基于个人未来收入的现值计算保险需求，考虑年龄、收入增长率、工作年限等因素，
                      确保家庭经济支柱发生意外时，家庭生活水平不受影响。
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-medium text-secondary-900 mb-2">家庭结构调整</h4>
                    <p className="text-sm text-secondary-600 leading-relaxed">
                      根据您的家庭结构进行个性化调整：有子女的家庭增加寿险和意外险比重，
                      有老人的家庭增加医疗险配置，确保保障更贴合实际需求。
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                    配置建议
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2"></div>
                      <p className="text-sm text-secondary-700">
                        <span className="font-medium">重疾险优先：</span>
                        作为收入损失补偿，建议优先配置，保额应覆盖3-5年的收入损失
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm text-secondary-700">
                        <span className="font-medium">医疗险补充：</span>
                        覆盖医疗费用支出，建议选择百万医疗险，保障范围广、保费相对较低
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2"></div>
                      <p className="text-sm text-secondary-700">
                        <span className="font-medium">意外险必备：</span>
                        保费低保障高，建议全家配置，特别关注高风险职业和出行频繁人群
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                      <p className="text-sm text-secondary-700">
                        <span className="font-medium">寿险保障：</span>
                        主要针对家庭经济支柱，保障家庭责任，建议定期寿险性价比更高
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary-100 p-4">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => onNext('policy-diagnosis')}
            className="h-12 border-primary-200 text-primary-700 hover:bg-primary-50"
          >
            保单诊断
          </Button>
          <Button
            className="h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
            onClick={() => onNext('product-recommendation')}
          >
            查看推荐产品
          </Button>
        </div>
      </div>
    </div>
  )
}