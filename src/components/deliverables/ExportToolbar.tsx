/**
 * 导出工具栏组件
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Deliverable } from '@/types/deliverable';
import { exportToPDF, exportToWord, exportToMarkdown } from '@/services/exportService';
import { 
  Download,
  FileText,
  FileType,
  File,
  Loader2,
  Check
} from 'lucide-react';

interface ExportToolbarProps {
  deliverable: Deliverable;
  contentRef: React.RefObject<HTMLDivElement>;
}

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

export function ExportToolbar({ deliverable, contentRef }: ExportToolbarProps) {
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>('idle');
  const [wordStatus, setWordStatus] = useState<ExportStatus>('idle');
  const [mdStatus, setMdStatus] = useState<ExportStatus>('idle');

  // 合并所有章节内容
  const fullContent = deliverable.sections
    .sort((a, b) => a.order - b.order)
    .map(s => s.content)
    .join('\n\n');

  const handleExportPDF = async () => {
    setPdfStatus('loading');
    const success = await exportToPDF(
      contentRef.current,
      deliverable.title
    );
    setPdfStatus(success ? 'success' : 'error');
    setTimeout(() => setPdfStatus('idle'), 2000);
  };

  const handleExportWord = async () => {
    setWordStatus('loading');
    const success = await exportToWord(
      fullContent,
      deliverable.title,
      deliverable
    );
    setWordStatus(success ? 'success' : 'error');
    setTimeout(() => setWordStatus('idle'), 2000);
  };

  const handleExportMarkdown = async () => {
    setMdStatus('loading');
    const success = await exportToMarkdown(
      fullContent,
      deliverable.title,
      deliverable
    );
    setMdStatus(success ? 'success' : 'error');
    setTimeout(() => setMdStatus('idle'), 2000);
  };

  const getButtonContent = (status: ExportStatus, icon: React.ReactNode, label: string) => {
    if (status === 'loading') {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (status === 'success') {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    return (
      <>
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </>
    );
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-zinc-500 mr-2 hidden sm:inline">导出</span>
      
      {/* PDF 导出 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExportPDF}
        disabled={pdfStatus === 'loading'}
        className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1.5"
        title="导出为 PDF"
      >
        {getButtonContent(pdfStatus, <FileText className="w-4 h-4" />, 'PDF')}
      </Button>

      {/* Word 导出 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExportWord}
        disabled={wordStatus === 'loading'}
        className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1.5"
        title="导出为 Word"
      >
        {getButtonContent(wordStatus, <FileType className="w-4 h-4" />, 'Word')}
      </Button>

      {/* Markdown 导出 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExportMarkdown}
        disabled={mdStatus === 'loading'}
        className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1.5"
        title="导出为 Markdown"
      >
        {getButtonContent(mdStatus, <File className="w-4 h-4" />, 'MD')}
      </Button>
    </div>
  );
}

export default ExportToolbar;
