import { useState, useRef } from 'react'
import { ArrowLeft, Upload, FileImage, Camera, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PolicyOCRService } from '@/services/ocr'
import { PolicyInfo, DiagnosisReport } from '@/types/insurance'

interface PolicyDiagnosisProps {
  onBack: () => void
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

export default function PolicyDiagnosis({ onBack }: PolicyDiagnosisProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [recognizedPolicy, setRecognizedPolicy] = useState<PolicyInfo | null>(null)
  const [diagnosisReport, setDiagnosisReport] = useState<DiagnosisReport | null>(null)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('请上传 JPG、PNG 或 PDF 格式的文件')
      setUploadState('error')
      return
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB')
      setUploadState('error')
      return
    }

    setUploadedFile(file)
    setUploadState('processing')
    setError('')

    // 调用OCR识别
    const result = await PolicyOCRService.recognizePolicy(file)
    
    if (result.success && result.policy) {
      setRecognizedPolicy(result.policy)
      setUploadState('success')
      
      // 生成诊断报告（这里使用示例数据，实际应该基于用户的家庭规划数据）
      const mockRecommendedBudget = {
        breakdown: {
          criticalIllness: 500000,
          medical: 1000000,
          accident: 500000,
          lifeInsurance: 1000000,
        }
      }
      
      const diagnosis = await PolicyOCRService.generateDiagnosisReport([result.policy], mockRecommendedBudget)
      setDiagnosisReport(diagnosis)
    } else {
      setError(result.error || '识别失败，请重试')
      setUploadState('error')
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const resetUpload = () => {
    setUploadState('idle')
    setUploadedFile(null)
    setRecognizedPolicy(null)
    setDiagnosisReport(null)
    setError('')
  }

  const downloadReport = () => {
    // TODO: 实现报告下载功能
    console.log('下载诊断报告')
  }

  const formatMoney = (amount: number) => {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`
    }
    return `${amount.toLocaleString()}元`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '保障充足'
    if (score >= 60) return '基本保障'
    return '保障不足'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-primary-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-secondary-600"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <h1 className="ml-4 text-lg font-semibold text-secondary-900">保单诊断</h1>
          </div>
          {diagnosisReport && (
            <Button
              size="sm"
              onClick={downloadReport}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Download className="w-4 h-4 mr-1" />
              下载报告
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {uploadState === 'idle' && (
            <>
              {/* 说明卡片 */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">AI智能识别</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-secondary-600 leading-relaxed">
                    上传您的保单图片或PDF文件，AI将自动识别保单信息，
                    分析保障缺口并给出专业建议。支持多种格式，识别准确率高达95%以上。
                  </p>
                </CardContent>
              </Card>

              {/* 上传区域 */}
              <Card className="border-2 border-dashed border-primary-200 bg-primary-50/50">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-secondary-900">上传保单文件</h3>
                      <p className="text-sm text-secondary-600">
                        支持 JPG、PNG、PDF 格式，文件大小不超过 10MB
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-12 border-primary-200 text-primary-700 hover:bg-primary-50"
                        onClick={handleCameraCapture}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        拍照上传
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 border-primary-200 text-primary-700 hover:bg-primary-50"
                        onClick={handleFileUpload}
                      >
                        <FileImage className="w-4 h-4 mr-2" />
                        选择文件
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 功能说明 */}
              <div className="space-y-3">
                <h3 className="font-medium text-secondary-900">诊断功能</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                          <span className="text-blue-600 text-sm font-semibold">识</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-secondary-900">信息提取</h4>
                          <p className="text-xs text-secondary-600">自动识别保单关键信息</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                          <span className="text-green-600 text-sm font-semibold">析</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-secondary-900">缺口分析</h4>
                          <p className="text-xs text-secondary-600">发现保障不足之处</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto">
                          <span className="text-yellow-600 text-sm font-semibold">评</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-secondary-900">专业评分</h4>
                          <p className="text-xs text-secondary-600">给出保障充足度评分</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                          <span className="text-purple-600 text-sm font-semibold">荐</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-secondary-900">优化建议</h4>
                          <p className="text-xs text-secondary-600">提供改进和补充方案</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          {uploadState === 'processing' && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-secondary-900">AI正在识别中...</h3>
                    <p className="text-sm text-secondary-600">
                      正在分析您的保单信息，请稍候
                    </p>
                  </div>
                  <Progress value={75} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {uploadState === 'error' && (
            <Card className="border-0 shadow-sm border-red-200">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-red-900">识别失败</h3>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                  <Button
                    onClick={resetUpload}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    重新上传
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {uploadState === 'success' && recognizedPolicy && diagnosisReport && (
            <div className="space-y-6">
              {/* 识别结果 */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    识别成功
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="font-medium text-secondary-900 mb-2">{recognizedPolicy.productName}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-secondary-600">保险公司：</span>
                        <span className="text-secondary-900">{recognizedPolicy.insurer}</span>
                      </div>
                      <div>
                        <span className="text-secondary-600">保额：</span>
                        <span className="text-secondary-900">{formatMoney(recognizedPolicy.coverage)}</span>
                      </div>
                      <div>
                        <span className="text-secondary-600">保费：</span>
                        <span className="text-secondary-900">{formatMoney(recognizedPolicy.premium)}</span>
                      </div>
                      <div>
                        <span className="text-secondary-600">类型：</span>
                        <span className="text-secondary-900">
                          {{
                            criticalIllness: '重疾险',
                            medical: '医疗险',
                            accident: '意外险',
                            lifeInsurance: '寿险',
                          }[recognizedPolicy.insuranceType]}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 诊断评分 */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">保障评分</h3>
                      <p className="text-primary-100 text-sm">基于您当前的保险配置</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-4xl font-bold">
                        {diagnosisReport.score}分
                      </div>
                      <div className="text-primary-100">
                        {getScoreLabel(diagnosisReport.score)}
                      </div>
                      <Progress 
                        value={diagnosisReport.score} 
                        className="w-full bg-white/20" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 保障缺口 */}
              {diagnosisReport.coverageGaps.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">保障缺口分析</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {diagnosisReport.coverageGaps.map((gap, index) => (
                      <div key={index} className="bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-secondary-900">
                            {{
                              criticalIllness: '重疾险',
                              medical: '医疗险',
                              accident: '意外险',
                              lifeInsurance: '寿险',
                            }[gap.type]}
                          </span>
                          <span className="text-sm text-yellow-700">
                            缺口 {formatMoney(gap.gap)}
                          </span>
                        </div>
                        <div className="text-xs text-secondary-600">
                          当前保额：{formatMoney(gap.currentCoverage)} / 
                          建议保额：{formatMoney(gap.recommendedCoverage)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 优化建议 */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">优化建议</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {diagnosisReport.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-secondary-700">{recommendation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 重新上传按钮 */}
              <Button
                onClick={resetUpload}
                variant="outline"
                className="w-full h-12 border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                上传其他保单
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}