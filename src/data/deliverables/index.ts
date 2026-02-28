/**
 * 交付物数据
 */
import { Deliverable } from '@/types/deliverable';
import { aiAnimationReport } from './ai-animation-report';

// 所有交付物列表
export const deliverables: Deliverable[] = [
  aiAnimationReport
];

// 根据 ID 获取交付物
export function getDeliverableById(id: string): Deliverable | undefined {
  return deliverables.find(d => d.id === id);
}

// 获取交付物列表（不含完整内容）
export function getDeliverableList() {
  return deliverables.map(d => ({
    id: d.id,
    title: d.title,
    description: d.description,
    category: d.category,
    status: d.status,
    tags: d.tags,
    coverImage: d.coverImage,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    sectionCount: d.sections.length
  }));
}

// 按分类筛选
export function getDeliverablesByCategory(category: string) {
  if (category === 'all') return getDeliverableList();
  return getDeliverableList().filter(d => d.category === category);
}

// 搜索交付物
export function searchDeliverables(keyword: string) {
  const lowerKeyword = keyword.toLowerCase();
  return getDeliverableList().filter(d => 
    d.title.toLowerCase().includes(lowerKeyword) ||
    d.description.toLowerCase().includes(lowerKeyword) ||
    d.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
  );
}
