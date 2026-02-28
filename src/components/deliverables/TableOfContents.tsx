/**
 * 目录导航组件
 */
import { useState, useEffect } from 'react';
import { DeliverableSection } from '@/types/deliverable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, ChevronRight } from 'lucide-react';

interface TableOfContentsProps {
  sections: DeliverableSection[];
  activeSection?: string;
  onSectionClick?: (sectionId: string) => void;
}

export function TableOfContents({ 
  sections, 
  activeSection,
  onSectionClick 
}: TableOfContentsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 根据标题级别计算缩进
  const getIndent = (level: number) => {
    const indents: Record<number, string> = {
      1: 'pl-0',
      2: 'pl-3',
      3: 'pl-6',
      4: 'pl-9',
      5: 'pl-12',
      6: 'pl-15'
    };
    return indents[level] || 'pl-0';
  };

  // 根据标题级别计算字体大小
  const getFontSize = (level: number) => {
    const sizes: Record<number, string> = {
      1: 'text-sm font-semibold',
      2: 'text-sm font-medium',
      3: 'text-xs',
      4: 'text-xs',
      5: 'text-xs',
      6: 'text-xs'
    };
    return sizes[level] || 'text-xs';
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* 标题栏 */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 
                   cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2 text-white font-medium">
          <List className="w-4 h-4" />
          目录
        </div>
        <ChevronRight 
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200
                     ${isCollapsed ? '' : 'rotate-90'}`} 
        />
      </div>

      {/* 目录内容 */}
      {!isCollapsed && (
        <ScrollArea className="max-h-[calc(100vh-300px)]">
          <nav className="p-3">
            <ul className="space-y-1">
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <li key={section.id}>
                    <button
                      onClick={() => onSectionClick?.(section.id)}
                      className={`w-full text-left py-1.5 px-2 rounded-md transition-all duration-200
                                 ${getIndent(section.level)} ${getFontSize(section.level)}
                                 ${isActive 
                                   ? 'bg-iris-primary/20 text-iris-primary' 
                                   : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                 }`}
                    >
                      <span className="line-clamp-1">{section.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </ScrollArea>
      )}
    </div>
  );
}

export default TableOfContents;
