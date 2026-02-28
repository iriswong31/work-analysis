import { useState } from 'react'
import { ArrowLeft, ArrowRight, Plus, X, User, Heart, Baby, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { FamilyMember, FamilyData } from '@/types/insurance'

interface FamilyFormWizardProps {
  onComplete: (step: 'planning-result', data: FamilyData) => void
}

const relationIcons = {
  self: User,
  spouse: Heart,
  child: Baby,
  parent: Users,
}

const relationLabels = {
  self: '本人',
  spouse: '配偶',
  child: '子女',
  parent: '父母',
}

export default function FamilyFormWizard({ onComplete }: FamilyFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [members, setMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: '',
      relation: 'self',
      age: 30,
      gender: 'male',
      annualIncome: 0,
      healthStatus: 'good',
      hasExistingInsurance: false,
    }
  ])
  const [familyFinance, setFamilyFinance] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const addMember = () => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: '',
      relation: 'spouse',
      age: 25,
      gender: 'female',
      annualIncome: 0,
      healthStatus: 'good',
      hasExistingInsurance: false,
    }
    setMembers([...members, newMember])
  }

  const removeMember = (id: string) => {
    if (members.length > 1) {
      setMembers(members.filter(m => m.id !== id))
    }
  }

  const updateMember = (id: string, field: keyof FamilyMember, value: any) => {
    setMembers(members.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // 完成表单，计算数据
      const totalAnnualIncome = members.reduce((sum, m) => sum + m.annualIncome, 0)
      const familyData: FamilyData = {
        members,
        totalAnnualIncome,
        totalAssets: familyFinance.totalAssets,
        totalLiabilities: familyFinance.totalLiabilities,
      }
      onComplete('planning-result', familyData)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return members.every(m => m.name.trim() !== '')
      case 2:
        return members.every(m => m.age > 0)
      case 3:
        return members.every(m => m.annualIncome >= 0)
      case 4:
        return true
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-secondary-900">家庭成员信息</h2>
              <p className="text-sm text-secondary-600">请添加需要保障的家庭成员</p>
            </div>
            
            <div className="space-y-3">
              {members.map((member, index) => {
                const IconComponent = relationIcons[member.relation]
                return (
                  <Card key={member.id} className="border border-primary-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <Select 
                              value={member.relation} 
                              onValueChange={(value) => updateMember(member.id, 'relation', value)}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="self">本人</SelectItem>
                                <SelectItem value="spouse">配偶</SelectItem>
                                <SelectItem value="child">子女</SelectItem>
                                <SelectItem value="parent">父母</SelectItem>
                              </SelectContent>
                            </Select>
                            {members.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMember(member.id)}
                                className="w-8 h-8 p-0 text-secondary-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <Input
                            placeholder="姓名"
                            value={member.name}
                            onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Button
              onClick={addMember}
              variant="outline"
              className="w-full h-12 border-dashed border-primary-300 text-primary-600 hover:bg-primary-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加家庭成员
            </Button>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-secondary-900">年龄和性别</h2>
              <p className="text-sm text-secondary-600">完善基本信息</p>
            </div>
            
            <div className="space-y-4">
              {members.map((member) => {
                const IconComponent = relationIcons[member.relation]
                return (
                  <Card key={member.id} className="border border-primary-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="font-medium text-secondary-900">
                            {member.name} ({relationLabels[member.relation]})
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-secondary-600">年龄</Label>
                              <Input
                                type="number"
                                value={member.age}
                                onChange={(e) => updateMember(member.id, 'age', parseInt(e.target.value) || 0)}
                                className="h-9 mt-1"
                                min="0"
                                max="100"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-secondary-600">性别</Label>
                              <Select 
                                value={member.gender} 
                                onValueChange={(value) => updateMember(member.id, 'gender', value)}
                              >
                                <SelectTrigger className="h-9 mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">男</SelectItem>
                                  <SelectItem value="female">女</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-secondary-900">收入情况</h2>
              <p className="text-sm text-secondary-600">年收入将影响保险预算计算</p>
            </div>
            
            <div className="space-y-4">
              {members.map((member) => {
                const IconComponent = relationIcons[member.relation]
                return (
                  <Card key={member.id} className="border border-primary-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="font-medium text-secondary-900">
                            {member.name} ({relationLabels[member.relation]})
                          </div>
                          <div>
                            <Label className="text-xs text-secondary-600">年收入（万元）</Label>
                            <Input
                              type="number"
                              value={member.annualIncome / 10000}
                              onChange={(e) => updateMember(member.id, 'annualIncome', (parseFloat(e.target.value) || 0) * 10000)}
                              className="h-9 mt-1"
                              min="0"
                              step="0.1"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-secondary-900">健康状况</h2>
              <p className="text-sm text-secondary-600">健康状况影响保险产品选择</p>
            </div>
            
            <div className="space-y-4">
              {members.map((member) => {
                const IconComponent = relationIcons[member.relation]
                return (
                  <Card key={member.id} className="border border-primary-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="font-medium text-secondary-900">
                            {member.name} ({relationLabels[member.relation]})
                          </div>
                          <div>
                            <Label className="text-xs text-secondary-600 mb-2 block">健康状况</Label>
                            <RadioGroup
                              value={member.healthStatus}
                              onValueChange={(value) => updateMember(member.id, 'healthStatus', value)}
                              className="flex space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="excellent" id={`excellent-${member.id}`} />
                                <Label htmlFor={`excellent-${member.id}`} className="text-xs">优秀</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="good" id={`good-${member.id}`} />
                                <Label htmlFor={`good-${member.id}`} className="text-xs">良好</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fair" id={`fair-${member.id}`} />
                                <Label htmlFor={`fair-${member.id}`} className="text-xs">一般</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-primary-100 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="text-secondary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <div className="text-sm font-medium text-secondary-900">
            {currentStep} / {totalSteps}
          </div>
        </div>
        <div className="mt-3">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="max-w-md mx-auto">
          {renderStep()}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-primary-100 p-4">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl"
          >
            {currentStep === totalSteps ? '完成规划' : '下一步'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}