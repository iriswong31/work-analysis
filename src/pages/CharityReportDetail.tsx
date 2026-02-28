/**
 * 社区慈善报告详情页
 * 展示单个报告章节的 Markdown 内容
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Home,
  Sparkles
} from 'lucide-react';
import { dashboardDataService } from '@/services/dashboardDataService';
import type { CharityReportDetail as ReportDetail, CharityReport } from '@/types/dashboard';

// 状态图标映射
const statusIcons = {
  completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  in_progress: <Clock className="w-4 h-4 text-yellow-400" />,
  pending: <AlertCircle className="w-4 h-4 text-zinc-500" />,
};

// 状态标签
const statusLabels = {
  completed: '已完成',
  in_progress: '进行中',
  pending: '待完成',
};

export function CharityReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [allReports, setAllReports] = useState<CharityReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    const [reportDetail, reports] = await Promise.all([
      dashboardDataService.getCharityReportDetail(id),
      dashboardDataService.getCharityReports(),
    ]);
    
    setReport(reportDetail);
    setAllReports(reports);
    setLoading(false);
  };

  const currentIndex = allReports.findIndex(r => r.id === id);
  const prevReport = currentIndex > 0 ? allReports[currentIndex - 1] : null;
  const nextReport = currentIndex < allReports.length - 1 ? allReports[currentIndex + 1] : null;

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

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iris-dark via-iris-darker to-iris-navy flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">报告不存在</p>
          <Button 
            variant="ghost" 
            className="mt-4"
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iris-dark via-iris-darker to-iris-navy">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iris-primary to-iris-secondary 
                            flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">社区慈善调研报告</h1>
              <p className="text-xs text-zinc-500">第 {report.order} 章</p>
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
        <div className="max-w-4xl mx-auto">
          {/* 报告头部 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-iris-primary/20 text-iris-primary">
                第 {report.order} 章
              </Badge>
              <div className="flex items-center gap-1">
                {statusIcons[report.status]}
                <span className="text-xs text-zinc-400">{statusLabels[report.status]}</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{report.title}</h2>
            <p className="text-zinc-500 text-sm">
              更新时间：{new Date(report.updatedAt).toLocaleDateString('zh-CN')}
            </p>
          </div>

          {/* Markdown 内容 */}
          <div className="glass rounded-xl p-8">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <article className="prose prose-invert prose-zinc max-w-none
                prose-headings:text-white prose-headings:font-bold
                prose-h1:text-2xl prose-h1:border-b prose-h1:border-zinc-700 prose-h1:pb-4 prose-h1:mb-6
                prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                prose-h4:text-base prose-h4:mt-4 prose-h4:mb-2
                prose-p:text-zinc-300 prose-p:leading-relaxed
                prose-a:text-iris-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white
                prose-ul:text-zinc-300 prose-ol:text-zinc-300
                prose-li:marker:text-iris-primary
                prose-blockquote:border-l-iris-primary prose-blockquote:text-zinc-400 prose-blockquote:bg-zinc-800/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
                prose-code:text-iris-primary prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded
                prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800
                prose-table:border-collapse
                prose-th:bg-zinc-800 prose-th:text-white prose-th:p-2 prose-th:border prose-th:border-zinc-700
                prose-td:p-2 prose-td:border prose-td:border-zinc-700 prose-td:text-zinc-300
                prose-hr:border-zinc-700
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report.content}
                </ReactMarkdown>
              </article>
            </ScrollArea>
          </div>

          {/* 底部导航 */}
          <div className="mt-8 flex items-center justify-between">
            {prevReport ? (
              <Button
                variant="ghost"
                className="text-zinc-400 hover:text-white"
                onClick={() => navigate(`/reports/community-charity/${prevReport.id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                上一章：{prevReport.title}
              </Button>
            ) : (
              <div />
            )}

            {nextReport ? (
              <Button
                variant="ghost"
                className="text-zinc-400 hover:text-white"
                onClick={() => navigate(`/reports/community-charity/${nextReport.id}`)}
              >
                下一章：{nextReport.title}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="text-zinc-400 hover:text-white"
                onClick={() => navigate('/')}
              >
                返回首页
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CharityReportDetail;
