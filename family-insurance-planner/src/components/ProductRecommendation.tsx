import { useState, useEffect } from 'react'
import { ArrowLeft, Star, ExternalLink, Filter, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { InsuranceProduct, InsuranceType } from '@/types/insurance'
import { InsuranceProductScraper } from '@/services/scraper'

interface ProductRecommendationProps {
  onBack: () => void
}

const insuranceTypeNames = {
  criticalIllness: '重疾险',
  medical: '医疗险',
  accident: '意外险',
  lifeInsurance: '寿险',
}

const insuranceTypeDescriptions = {
  criticalIllness: '重大疾病保险，确诊即赔，补偿收入损失',
  medical: '医疗费用报销，覆盖住院门诊等医疗支出',
  accident: '意外伤害保障，保费低保障高，全家必备',
  lifeInsurance: '生命保障，主要针对家庭经济支柱',
}

export default function ProductRecommendation({ onBack }: ProductRecommendationProps) {
  const [selectedType, setSelectedType] = useState<InsuranceType>('criticalIllness')
  const [products, setProducts] = useState<Record<InsuranceType, InsuranceProduct[]>>({
    criticalIllness: [],
    medical: [],
    accident: [],
    lifeInsurance: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<InsuranceProduct[]>([])

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    const allProducts = await InsuranceProductScraper.scrapeAllProducts()
    setProducts(allProducts)
    setLoading(false)
  }

  const refreshProducts = async () => {
    setRefreshing(true)
    const typeProducts = await InsuranceProductScraper.scrapeProductsByType(selectedType)
    if (typeProducts.success && typeProducts.products) {
      setProducts(prev => ({
        ...prev,
        [selectedType]: typeProducts.products!
      }))
    }
    setRefreshing(false)
  }

  const toggleProductSelection = (product: InsuranceProduct) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id)
      if (exists) {
        return prev.filter(p => p.id !== product.id)
      } else {
        return [...prev, product]
      }
    })
  }

  const isProductSelected = (product: InsuranceProduct) => {
    return selectedProducts.some(p => p.id === product.id)
  }

  const openProductLink = (url?: string) => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const formatPriceRange = (priceRange: string) => {
    return priceRange.replace(/元\/年/, '/年')
  }

  const currentProducts = products[selectedType] || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-primary-100 p-4 sticky top-0 z-10">
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
            <h1 className="ml-4 text-lg font-semibold text-secondary-900">产品推荐</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshProducts}
              disabled={refreshing}
              className="text-primary-600 border-primary-200"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              刷新
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-primary-600 border-primary-200"
            >
              <Filter className="w-4 h-4 mr-1" />
              筛选
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* 险种切换 */}
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as InsuranceType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="criticalIllness" className="text-xs">重疾险</TabsTrigger>
              <TabsTrigger value="medical" className="text-xs">医疗险</TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-2 mt-2">
              <TabsTrigger value="accident" className="text-xs">意外险</TabsTrigger>
              <TabsTrigger value="lifeInsurance" className="text-xs">寿险</TabsTrigger>
            </TabsList>

            {/* 险种说明 */}
            <Card className="border-0 shadow-sm mt-4">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-secondary-900">
                    {insuranceTypeNames[selectedType]}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {insuranceTypeDescriptions[selectedType]}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 产品列表 */}
            <TabsContent value={selectedType} className="space-y-4 mt-6">
              {loading ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
                      <p className="text-sm text-secondary-600">正在获取最新产品信息...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : currentProducts.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <p className="text-sm text-secondary-600">暂无相关产品信息</p>
                      <Button
                        onClick={refreshProducts}
                        variant="outline"
                        size="sm"
                        className="border-primary-200 text-primary-700"
                      >
                        重新获取
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {currentProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className={`border-0 shadow-sm transition-all duration-200 ${
                        isProductSelected(product) 
                          ? 'ring-2 ring-primary-500 bg-primary-50' 
                          : 'hover:shadow-md'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* 产品头部 */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-secondary-900">{product.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {product.company}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  {renderStars(product.rating)}
                                </div>
                                <span className="text-sm text-secondary-600">{product.rating}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openProductLink(product.url)}
                              className="text-primary-600 hover:bg-primary-50"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* 保额和价格 */}
                          <div className="grid grid-cols-2 gap-3 py-2 px-3 bg-secondary-50 rounded-lg">
                            <div>
                              <div className="text-xs text-secondary-600">保额范围</div>
                              <div className="text-sm font-medium text-secondary-900">
                                {(product.minCoverage / 10000).toFixed(0)}-{(product.maxCoverage / 10000).toFixed(0)}万
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-secondary-600">价格区间</div>
                              <div className="text-sm font-medium text-secondary-900">
                                {formatPriceRange(product.priceRange)}
                              </div>
                            </div>
                          </div>

                          {/* 产品特色 */}
                          <div className="space-y-2">
                            <div className="text-xs text-secondary-600">产品特色</div>
                            <div className="flex flex-wrap gap-1">
                              {product.features.slice(0, 4).map((feature, index) => (
                                <Badge 
                                  key={index} 
                                  variant="secondary" 
                                  className="text-xs bg-primary-100 text-primary-700"
                                >
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex space-x-2 pt-2">
                            <Button
                              onClick={() => toggleProductSelection(product)}
                              variant={isProductSelected(product) ? "default" : "outline"}
                              size="sm"
                              className={`flex-1 h-9 ${
                                isProductSelected(product)
                                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                                  : 'border-primary-200 text-primary-700 hover:bg-primary-50'
                              }`}
                            >
                              {isProductSelected(product) ? '已选择' : '选择对比'}
                            </Button>
                            <Button
                              onClick={() => openProductLink(product.url)}
                              variant="outline"
                              size="sm"
                              className="border-secondary-200 text-secondary-700 hover:bg-secondary-50"
                            >
                              查看详情
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 底部对比栏 */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary-100 p-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div className="text-sm text-secondary-600">
                已选择 {selectedProducts.length} 个产品
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                  className="border-secondary-200 text-secondary-700"
                >
                  清空
                </Button>
                <Button
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                  disabled={selectedProducts.length < 2}
                >
                  对比产品 ({selectedProducts.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}