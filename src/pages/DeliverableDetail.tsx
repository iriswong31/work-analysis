/**
 * 交付物详情页面
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDeliverableById } from '@/data/deliverables';
import { MarkdownRenderer } from '@/components/deliverables/MarkdownRenderer';
import { TableOfContents } from '@/components/deliverables/TableOfContents';
import { ExportToolbar } from '@/components/deliverables/ExportToolbar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATEGORY_CONFIG } from '@/types/deliverable';
import { 
  Sparkles, 
  ArrowLeft,
  Calendar,
  Tag,
  FileText,
  User,
  Menu,
  X
} from 'lucide-react';

export function DeliverableDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [showMobileToc, setShowMobileToc] = useState(false);

  const deliverable = id ? getDeliverableById(id) : undefined;

  // 合并所有章节内容
  const fullContent = deliverable?.sections
    .sort((a, b) => a.order - b.order)
    .map(s => s.content)
    .join('\n\n') || '';

  // 监听滚动更新当前章节
  useEffect(() => {
    if (!deliverable) return;

    const handleScroll = () => {
      const sections = deliverable.sections;
      const scrollTop = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollTop) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [deliverable]);

  // 点击目录跳转
  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
      setShowMobileToc(false);
    }
  };

  // 404 处理
  if (!deliverable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iris-dark via-iris-darker to-iris-navy 
                      flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">交付物不存在</h2>
          <p className="text-zinc-400 mb-6">请检查链接是否正确</p>
          <Button onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const categoryInfo = CATEGORY_CONFIG[deliverable.category];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-iris-dark via-iris-darker to-iris-navy">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* 左侧 */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              返回首页
            </Button>
          </div>

          {/* 中间标题 */}
          <div className="hidden md:flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-iris-primary" />
            <span className="text-white font-medium truncate max-w-md">
              {deliverable.title}
            </span>
          </div>

          {/* 右侧工具栏 */}
          <div className="flex items-center gap-2">
            {/* 移动端目录按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileToc(!showMobileToc)}
              className="lg:hidden text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              {showMobileToc ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            {/* 导出工具栏 */}
            <ExportToolbar 
              deliverable={deliverable} 
              contentRef={contentRef}
            />
          </div>
        </div>
      </header>

      {/* 移动端目录抽屉 */}
      {showMobileToc && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowMobileToc(false)}
          />
          <div className="absolute top-16 right-0 w-80 max-w-full h-[calc(100vh-4rem)] 
                          bg-iris-darker border-l border-zinc-800 p-4">
            <TableOfContents
              sections={deliverable.sections}
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
            />
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-6">
            {/* 左侧目录 - 桌面端 */}
            <aside className="hidden lg:block col-span-3">
              <div className="sticky top-24">
                <TableOfContents
                  sections={deliverable.sections}
                  activeSection={activeSection}
                  onSectionClick={handleSectionClick}
                />
              </div>
            </aside>

            {/* 右侧内容 */}
            <div className="col-span-12 lg:col-span-9">
              {/* 文档头部 */}
              <div className="glass rounded-xl p-6 mb-6">
                {/* 分类标签 */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full 
                                   text-sm font-medium bg-iris-primary/20 text-iris-primary`}>
                    {categoryInfo.label}
                  </span>
                </div>

                {/* 标题 */}
                <h1 className="text-3xl font-bold text-white mb-4">
                  {deliverable.title}
                </h1>

                {/* 描述 */}
                <p className="text-zinc-400 mb-6">
                  {deliverable.description}
                </p>

                {/* 元信息 */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                  {deliverable.meta?.author && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      {deliverable.meta.author}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    更新于 {formatDate(deliverable.updatedAt)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {deliverable.sections.length} 个章节
                  </div>
                </div>

                {/* 标签 */}
                {deliverable.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800">
                    {deliverable.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded 
                                   bg-zinc-800 text-zinc-400 text-xs"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 文档内容 */}
              <div 
                ref={contentRef}
                className="glass rounded-xl p-6 lg:p-8"
                id="deliverable-content"
              >
                <MarkdownRenderer content={fullContent} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DeliverableDetail;
