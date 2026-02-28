import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  FileText, 
  Copy, 
  ExternalLink,
  Sparkles,
  Calendar
} from 'lucide-react';
import { DailyOutput } from '@/types/memory';

interface DailyOutputPreviewProps {
  output: DailyOutput | null;
  isGenerating?: boolean;
  onGenerate?: () => void;
  onCopy?: (content: string) => void;
}

export function DailyOutputPreview({
  output,
  isGenerating,
  onGenerate,
  onCopy,
}: DailyOutputPreviewProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    onCopy?.(content);
  };

  if (!output) {
    return (
      <Card className="glass border-iris-primary/20">
        <div className="p-6 text-center">
          <Sparkles className="w-12 h-12 text-iris-primary/50 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">今日产出</h3>
          <p className="text-zinc-500 text-sm mb-4">
            完成任务并提交反馈后，数字分身将自动生成今日复盘日记和公众号文章
          </p>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-iris-primary to-iris-secondary"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                生成今日产出
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass border-iris-primary/20 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-iris-primary" />
          <h3 className="text-white font-medium">今日产出</h3>
        </div>
        <span className="text-xs text-zinc-500">{formatDate(output.date)}</span>
      </div>

      <Tabs defaultValue="diary" className="w-full">
        <TabsList className="w-full bg-iris-dark/50 rounded-none border-b border-zinc-800">
          <TabsTrigger 
            value="diary" 
            className="flex-1 data-[state=active]:bg-iris-primary/20 data-[state=active]:text-iris-primary"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            复盘日记
          </TabsTrigger>
          <TabsTrigger 
            value="article"
            className="flex-1 data-[state=active]:bg-iris-primary/20 data-[state=active]:text-iris-primary"
          >
            <FileText className="w-4 h-4 mr-2" />
            公众号文章
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diary" className="m-0">
          <ScrollArea className="h-[300px]">
            <div className="p-4 space-y-4">
              {/* 做了什么 */}
              <div>
                <h4 className="text-iris-primary text-sm font-medium mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-iris-primary" />
                  今日完成
                </h4>
                <ul className="space-y-1">
                  {output.diary.whatDone.map((item, i) => (
                    <li key={i} className="text-zinc-300 text-sm pl-3 border-l border-zinc-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 收到的反馈 */}
              {output.diary.feedback.length > 0 && (
                <div>
                  <h4 className="text-iris-secondary text-sm font-medium mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-iris-secondary" />
                    反馈记录
                  </h4>
                  <ul className="space-y-1">
                    {output.diary.feedback.map((item, i) => (
                      <li key={i} className="text-zinc-300 text-sm pl-3 border-l border-zinc-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 收获 */}
              {output.diary.insights.length > 0 && (
                <div>
                  <h4 className="text-iris-accent text-sm font-medium mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-iris-accent" />
                    今日收获
                  </h4>
                  <ul className="space-y-1">
                    {output.diary.insights.map((item, i) => (
                      <li key={i} className="text-zinc-300 text-sm pl-3 border-l border-zinc-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 下一步 */}
              {output.diary.nextSteps.length > 0 && (
                <div>
                  <h4 className="text-iris-info text-sm font-medium mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-iris-info" />
                    下一步计划
                  </h4>
                  <ul className="space-y-1">
                    {output.diary.nextSteps.map((item, i) => (
                      <li key={i} className="text-zinc-300 text-sm pl-3 border-l border-zinc-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 优先级决策 */}
              {output.diary.priorityDecisions.length > 0 && (
                <div>
                  <h4 className="text-iris-warning text-sm font-medium mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-iris-warning" />
                    优先级决策回顾
                  </h4>
                  <div className="space-y-2">
                    {output.diary.priorityDecisions.map((decision, i) => (
                      <div key={i} className="p-2 bg-iris-dark/50 rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white">{decision.taskTitle}</span>
                          <span className="text-iris-primary font-mono">{decision.score}</span>
                        </div>
                        <p className="text-zinc-500 text-xs">{decision.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="article" className="m-0">
          {output.article ? (
            <div>
              <ScrollArea className="h-[260px]">
                <div className="p-4">
                  <h4 className="text-white font-medium mb-2">{output.article.title}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    {output.article.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-iris-primary/20 text-iris-primary text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                    <span className="text-zinc-500 text-xs">
                      {output.article.wordCount} 字
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {output.article.content}
                  </p>
                </div>
              </ScrollArea>
              <div className="p-3 border-t border-zinc-800 flex items-center justify-between">
                <span className={`text-xs ${output.article.publishReady ? 'text-iris-success' : 'text-iris-warning'}`}>
                  {output.article.publishReady ? '✓ 可发布' : '⚠ 需审核'}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => handleCopy(output.article!.content)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    复制
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    编辑
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">
                文章将在完成更多任务后自动生成
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default DailyOutputPreview;
