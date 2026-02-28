import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CustomStockAnalysis, MetricWithSource } from "@/types";
import { MetricValue } from "./MetricTooltip";
import {
  Search,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ImagePlus,
} from "lucide-react";

interface CustomStockAnalyzerProps {
  onAnalyze: (stockCode: string, stockName: string, additionalInfo: string, imageFiles?: File[]) => void;
  analysis: CustomStockAnalysis | null;
  isLoading: boolean;
}

const suggestionConfig = {
  "强烈推荐": { color: "bg-green-500", icon: ThumbsUp, textColor: "text-green-700" },
  "可以关注": { color: "bg-blue-500", icon: HelpCircle, textColor: "text-blue-700" },
  "谨慎观望": { color: "bg-amber-500", icon: AlertTriangle, textColor: "text-amber-700" },
  "不建议": { color: "bg-red-500", icon: ThumbsDown, textColor: "text-red-700" },
};

const MAX_IMAGES = 9;

export function CustomStockAnalyzer({
  onAnalyze,
  analysis,
  isLoading,
}: CustomStockAnalyzerProps) {
  const [stockCode, setStockCode] = useState("");
  const [stockName, setStockName] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 处理多张图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files) {
      addImages(Array.from(files));
    }
  };

  // 添加图片（支持多张）
  const addImages = useCallback((files: File[]) => {
    const remainingSlots = MAX_IMAGES - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    filesToAdd.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
        setImageFiles((prev) => [...prev, file]);
      }
    });
  }, [imageFiles.length]);

  // 处理粘贴事件
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItems: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          imageItems.push(file);
        }
      }
    }

    if (imageItems.length > 0) {
      e.preventDefault();
      addImages(imageItems);
    }
  }, [addImages]);

  // 监听粘贴事件
  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    // 只要股票代码或股票名称有一个就行
    if (!stockCode.trim() && !stockName.trim()) return;
    onAnalyze(
      stockCode.trim(),
      stockName.trim(),
      additionalInfo.trim(),
      imageFiles.length > 0 ? imageFiles : undefined
    );
  };

  const getMetricValue = (value: number | MetricWithSource | undefined): number => {
    if (value === undefined) return 0;
    if (typeof value === "number") return value;
    return value.value;
  };

  // 检查是否可以提交（股票代码或名称至少填一个）
  const canSubmit = stockCode.trim() || stockName.trim();

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-violet-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-violet-500" />
            股票分析
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            输入股票代码或名称，AI将基于方法论进行分析打分
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">股票代码</label>
              <Input
                placeholder="如：600519、00700、AAPL"
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">股票名称</label>
              <Input
                placeholder="如：贵州茅台"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">* 股票代码或名称至少填写一项</p>

          <div className="space-y-2">
            <label className="text-sm font-medium">补充信息（可选）</label>
            <Textarea
              placeholder="输入你了解的关于这只股票的信息，如：最近财报情况、行业动态、个人看法等..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">上传图片（可选，最多{MAX_IMAGES}张）</label>
            <div 
              ref={dropZoneRef}
              className="border-2 border-dashed border-slate-200 rounded-lg p-4 hover:border-violet-300 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {imagePreviews.length === 0 ? (
                <div 
                  className="flex flex-col items-center gap-2 cursor-pointer py-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="w-10 h-10 text-slate-300" />
                  <p className="text-sm text-muted-foreground">点击上传或直接粘贴图片</p>
                  <p className="text-xs text-slate-400">支持财报截图、K线图、研报图片等</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`预览 ${index + 1}`}
                          className="h-20 w-20 object-cover rounded border"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {imagePreviews.length < MAX_IMAGES && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-20 w-20 border-2 border-dashed border-slate-200 rounded flex flex-col items-center justify-center text-slate-400 hover:border-violet-300 hover:text-violet-400 transition-colors"
                      >
                        <ImagePlus className="w-6 h-6" />
                        <span className="text-xs mt-1">添加</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      已上传 {imagePreviews.length}/{MAX_IMAGES} 张
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllImages}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      清空全部
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              💡 提示：可直接按 Ctrl+V / Cmd+V 粘贴剪贴板中的图片
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI分析中...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                开始分析
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 分析结果 */}
      {analysis && (
        <Card className="border-0 shadow-lg overflow-hidden">
          {/* 顶部评级条 */}
          <div className={`h-2 ${suggestionConfig[analysis.suggestion].color}`} />
          
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {analysis.stock.stockName}
                  <Badge variant="outline">{analysis.stock.stockCode}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {analysis.stock.market} · {analysis.stock.sector}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{analysis.stock.score}</span>
                  <span className="text-sm text-muted-foreground">/ 100分</span>
                </div>
                <Badge className={`${suggestionConfig[analysis.suggestion].color} text-white mt-1`}>
                  {analysis.suggestion}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 核心指标 */}
            <div>
              <h4 className="font-medium mb-3">核心指标</h4>
              <div className="grid grid-cols-5 gap-2">
                <MetricValue
                  label="现价"
                  value={analysis.stock.currentPrice}
                  unit=""
                />
                <MetricValue
                  label="PE"
                  value={analysis.stock.pe}
                  unit="x"
                />
                <MetricValue
                  label="股息率"
                  value={analysis.stock.dividendYield}
                  unit="%"
                />
                <MetricValue
                  label="ROE"
                  value={analysis.stock.roe || 0}
                  unit="%"
                />
                <MetricValue
                  label="毛利率"
                  value={analysis.stock.grossMargin || 0}
                  unit="%"
                />
              </div>
            </div>

            {/* 评分明细 */}
            {analysis.stock.scoreBreakdown && (
              <div>
                <h4 className="font-medium mb-3">评分明细</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">估值维度</span>
                      <span className="font-bold text-blue-600">
                        {analysis.stock.scoreBreakdown.valuation}/40
                      </span>
                    </div>
                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(analysis.stock.scoreBreakdown.valuation / 40) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">分红维度</span>
                      <span className="font-bold text-green-600">
                        {analysis.stock.scoreBreakdown.dividend}/25
                      </span>
                    </div>
                    <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(analysis.stock.scoreBreakdown.dividend / 25) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">护城河维度</span>
                      <span className="font-bold text-purple-600">
                        {analysis.stock.scoreBreakdown.moat}/35
                      </span>
                    </div>
                    <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(analysis.stock.scoreBreakdown.moat / 35) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 详细分析 */}
            <div>
              <h4 className="font-medium mb-3">详细分析</h4>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm whitespace-pre-line">{analysis.analysisDetail}</p>
              </div>
            </div>

            {/* 筛选标准匹配情况 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  符合的标准
                </h4>
                <ul className="space-y-2">
                  {analysis.matchedCriteria.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm p-2 bg-green-50 rounded">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  不符合的标准
                </h4>
                <ul className="space-y-2">
                  {analysis.missedCriteria.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm p-2 bg-red-50 rounded">
                      <span className="text-red-500 mt-0.5">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 风险提示 */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                风险提示
              </h4>
              <p className="text-sm text-amber-700">{analysis.stock.riskNote}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
