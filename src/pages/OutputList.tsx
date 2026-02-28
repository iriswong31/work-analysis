/**
 * 产出列表页面
 * 按类型（work/life）展示所有产出的卡片列表
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Home,
  Briefcase,
  Heart,
  FileText,
  Code,
  Palette,
  FileEdit,
  BarChart,
  BookOpen,
  Package,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { dashboardDataService } from '@/services/dashboardDataService';
import type { OutputRecord, OutputCategory } from '@/types/dashboard';

// 图标映射
const categoryIcons: Record<OutputCategory, React.ReactNode> = {
  report: <FileText className="w-5 h-5" />,
  code: <Code className="w-5 h-5" />,
  design: <Palette className="w-5 h-5" />,
  document: <FileEdit className="w-5 h-5" />,
  analysis: <BarChart className="w-5 h-5" />,
  article: <BookOpen className="w-5 h-5" />,
  other: <Package className="w-5 h-5" />,
};

// 类别颜色映射
const categoryColors: Record<OutputCategory, string> = {
  report: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
  code: 'from-green-500/20 to-green-600/10 border-green-500/30',
  design: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  document: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  analysis: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
  article: 'from-pink-500/20 to-pink-600/10 border-pink-500/30',
  other: 'from-slate-500/20 to-slate-600/10 border-slate-500/30',
};

// 类别标签
const categoryLabels: Record<OutputCategory, string> = {
  report: '调研报告',
  code: '代码实现',
  design: '设计方案',
  document: '文档',
  analysis: '分析',
  article: '文章',
  other: '其他',
};

interface OutputCardProps {
  output: OutputRecord;
  onClick: () => void;
  hasLink: boolean;
}

function OutputCard({ output, onClick, hasLink }: OutputCardProps) {
  const date = new Date(output.createdAt).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card 
      className={`glass bg-gradient-to-br ${categoryColors[output.category]} ${
        hasLink 
          ? 'cursor-pointer hover:scale-[1.02] transition-transform' 
          : 'opacity-80'
      }`}
      onClick={hasLink ? onClick : undefined}
    >
      <div className="p-5">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            output.type === 'work' 
              ? 'bg-iris-primary/20 text-iris-primary' 
              : 'bg-iris-accent/20 text-iris-accent'
          }`}>
            {categoryIcons[output.category]}
          </div>
          <div className="flex items-center gap-2">
            {output.type === 'work' ? (
              <Badge className="bg-iris-primary/20 text-iris-primary border-iris-primary/30">
                <Briefcase className="w-3 h-3 mr-1" />
                Work
              </Badge>
            ) : (
              <Badge className="bg-iris-accent/20 text-iris-accent border-iris-accent/30">
                <Heart className="w-3 h-3 mr-1" />
                Life
              </Badge>
            )}
          </div>
        </div>

        {/* 标题和描述 */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {output.title}
        </h3>
        <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
          {output.description}
        </p>

        {/* 底部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Calendar className="w-3 h-3" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {categoryLabels[output.category]}
            </Badge>
            {output.link && (
              <ExternalLink className="w-4 h-4 text-zinc-500" />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function OutputList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [outputs, setOutputs] = useState<OutputRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentType = (searchParams.get('type') as 'work' | 'life' | null) || 'all';

  useEffect(() => {
    loadOutputs();
  }, []);

  const loadOutputs = async () => {
    setLoading(true);
    const data = await dashboardDataService.getAllOutputs();
    setOutputs(data);
    setLoading(false);
  };

  const filteredOutputs = currentType === 'all' 
    ? outputs 
    : outputs.filter(o => o.type === currentType);

  const workCount = outputs.filter(o => o.type === 'work').length;
  const lifeCount = outputs.filter(o => o.type === 'life').length;

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', value);
    }
    setSearchParams(searchParams);
  };

  const handleOutputClick = (output: OutputRecord) => {
    if (output.link) {
      navigate(output.link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iris-dark via-iris-darker to-iris-navy flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-iris-primary animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iris-dark via-iris-darker to-iris-navy">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iris-primary to-iris-secondary 
                            flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">产出列表</h1>
              <p className="text-xs text-zinc-500">数字分身的工作成果</p>
            </div>
          </div>

          {/* 导航按钮 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <Home className="w-4 h-4 mr-1.5" />
              返回首页
            </Button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题和统计 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">全部产出</h2>
            <p className="text-zinc-400">
              共 {outputs.length} 项产出 · Work {workCount} 项 · Life {lifeCount} 项
            </p>
          </div>

          {/* 筛选 Tabs */}
          <div className="mb-6">
            <Tabs value={currentType === 'all' ? 'all' : currentType} onValueChange={handleTabChange}>
              <TabsList className="bg-zinc-800/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-zinc-700">
                  全部 ({outputs.length})
                </TabsTrigger>
                <TabsTrigger value="work" className="data-[state=active]:bg-iris-primary/20 data-[state=active]:text-iris-primary">
                  <Briefcase className="w-4 h-4 mr-1.5" />
                  Work ({workCount})
                </TabsTrigger>
                <TabsTrigger value="life" className="data-[state=active]:bg-iris-accent/20 data-[state=active]:text-iris-accent">
                  <Heart className="w-4 h-4 mr-1.5" />
                  Life ({lifeCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 产出卡片网格 */}
          {filteredOutputs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOutputs.map((output) => (
                <OutputCard
                  key={output.id}
                  output={output}
                  hasLink={!!output.link}
                  onClick={() => handleOutputClick(output)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500 text-lg">暂无产出</p>
              <p className="text-zinc-600 text-sm mt-1">数字分身正在努力工作中...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default OutputList;
