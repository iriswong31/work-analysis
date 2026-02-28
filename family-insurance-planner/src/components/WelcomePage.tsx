import { Shield, Calculator, FileSearch, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FamilyData } from '@/types/insurance'

interface WelcomePageProps {
  onNext: (step: 'family-form' | 'policy-diagnosis', data?: FamilyData) => void
}

export default function WelcomePage({ onNext }: WelcomePageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-in">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-secondary-900">
              家庭保险规划师
            </h1>
            <p className="text-secondary-600 text-sm leading-relaxed">
              让保险规划更简单，为您的家庭量身定制专业保障方案
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-3">
          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-secondary-900">科学计算</h3>
                  <p className="text-xs text-secondary-600">基于双十原则和生命价值法</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileSearch className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-secondary-900">智能诊断</h3>
                  <p className="text-xs text-secondary-600">AI识别保单，分析保障缺口</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => onNext('family-form')}
            className="w-full h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <span className="flex items-center justify-center space-x-2">
              <span>开始规划</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>

          <Button 
            onClick={() => onNext('policy-diagnosis')}
            variant="outline"
            className="w-full h-12 border-primary-200 text-primary-700 hover:bg-primary-50 font-medium rounded-xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            保单诊断
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="text-center space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex justify-center space-x-4 text-xs text-secondary-500">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>数据安全</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>专业算法</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>免费使用</span>
            </span>
          </div>
          <p className="text-xs text-secondary-400">
            所有数据仅在本地存储，绝不上传服务器
          </p>
        </div>
      </div>
    </div>
  )
}