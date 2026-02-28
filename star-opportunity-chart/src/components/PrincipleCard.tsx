import { Lightbulb, Calendar, Tag, BookOpen, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Principle } from "@/types";

interface PrincipleCardProps {
  principle: Principle;
}

const categoryColors: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  "投资理念": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", accent: "bg-purple-500" },
  "市场周期": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", accent: "bg-blue-500" },
  "宏观分析": { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", accent: "bg-emerald-500" },
  "资产配置": { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200", accent: "bg-sky-500" },
  "操作策略": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", accent: "bg-orange-500" },
  "行业研究": { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", accent: "bg-indigo-500" },
  "风险控制": { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", accent: "bg-rose-500" },
  "交易纪律": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", accent: "bg-amber-500" },
};

// 解析内容，提取结构化信息
function parseContent(content: string): { type: 'list' | 'paragraph' | 'section'; items: string[]; title?: string }[] {
  const sections: { type: 'list' | 'paragraph' | 'section'; items: string[]; title?: string }[] = [];
  
  // 按段落分割
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n').filter(l => l.trim());
    
    // 检查是否是带标题的段落（如 "止损原则："）
    const titleMatch = lines[0]?.match(/^(.+?)[：:]\s*$/);
    if (titleMatch && lines.length > 1) {
      sections.push({
        type: 'section',
        title: titleMatch[1],
        items: lines.slice(1).map(l => l.replace(/^[-•]\s*/, '').trim())
      });
      continue;
    }
    
    // 检查是否是编号列表
    const isNumberedList = lines.every(l => /^\d+\.\s/.test(l.trim()));
    if (isNumberedList) {
      sections.push({
        type: 'list',
        items: lines.map(l => l.replace(/^\d+\.\s*/, '').trim())
      });
      continue;
    }
    
    // 检查是否是无序列表
    const isBulletList = lines.every(l => /^[-•]/.test(l.trim()));
    if (isBulletList) {
      sections.push({
        type: 'list',
        items: lines.map(l => l.replace(/^[-•]\s*/, '').trim())
      });
      continue;
    }
    
    // 普通段落
    sections.push({
      type: 'paragraph',
      items: [paragraph.replace(/\n/g, ' ')]
    });
  }
  
  return sections;
}

// 渲染列表项，支持冒号分割的标题+内容格式
function renderListItem(item: string, index: number, accentColor: string) {
  const colonIndex = item.indexOf('：');
  const hasTitle = colonIndex > 0 && colonIndex < 15; // 标题通常不超过15个字符
  
  if (hasTitle) {
    const title = item.slice(0, colonIndex);
    const content = item.slice(colonIndex + 1);
    return (
      <li key={index} className="flex items-start gap-3 py-2">
        <span className={`flex-shrink-0 w-6 h-6 rounded-lg ${accentColor} text-white text-xs font-bold flex items-center justify-center mt-0.5`}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-slate-800">{title}</span>
          <span className="text-slate-600">：{content}</span>
        </div>
      </li>
    );
  }
  
  return (
    <li key={index} className="flex items-start gap-3 py-2">
      <span className={`flex-shrink-0 w-6 h-6 rounded-lg ${accentColor} text-white text-xs font-bold flex items-center justify-center mt-0.5`}>
        {index + 1}
      </span>
      <span className="flex-1 text-slate-700">{item}</span>
    </li>
  );
}

export function PrincipleCard({ principle }: PrincipleCardProps) {
  const colors = categoryColors[principle.category] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    accent: "bg-gray-500",
  };

  const parsedContent = parseContent(principle.content);

  return (
    <Card className="group relative overflow-hidden bg-white border-pink-100 hover:border-pink-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* 左侧装饰条 */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colors.accent}`} />

      <div className="p-6 pl-7">
        {/* 顶部：分类和日期 */}
        <div className="flex items-center justify-between mb-4">
          <Badge className={`${colors.bg} ${colors.text} ${colors.border} border px-3 py-1`}>
            <Tag className="w-3 h-3 mr-1.5" />
            {principle.category}
          </Badge>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {principle.createDate}
          </span>
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-xl ${colors.accent} flex items-center justify-center`}>
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <span className="pt-1">{principle.title}</span>
        </h3>

        {/* 结构化内容 */}
        <div className="space-y-4">
          {parsedContent.map((section, sectionIndex) => {
            if (section.type === 'section' && section.title) {
              return (
                <div key={sectionIndex} className="bg-gradient-to-r from-slate-50 to-transparent rounded-xl p-4">
                  <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <ChevronRight className={`w-4 h-4 ${colors.text}`} />
                    {section.title}
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="text-slate-600 text-sm flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.accent} mt-2 flex-shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            
            if (section.type === 'list') {
              return (
                <ul key={sectionIndex} className="space-y-1">
                  {section.items.map((item, idx) => renderListItem(item, idx, colors.accent))}
                </ul>
              );
            }
            
            // paragraph
            return (
              <p key={sectionIndex} className="text-slate-600 leading-relaxed text-sm bg-slate-50 rounded-lg p-3">
                {section.items[0]}
              </p>
            );
          })}
        </div>

        {/* 来源 */}
        {principle.source && (
          <div className="mt-5 pt-4 border-t border-pink-50">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="font-medium">来源：</span>
              <span className={`${colors.text} font-medium`}>{principle.source}</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
