/**
 * 交付物类型定义
 */

// 交付物分类
export type DeliverableCategory = 
  | 'research'      // 调研报告
  | 'design'        // 设计文档
  | 'technical'     // 技术文档
  | 'product'       // 产品文档
  | 'other';        // 其他

// 交付物状态
export type DeliverableStatus = 
  | 'draft'         // 草稿
  | 'published'     // 已发布
  | 'archived';     // 已归档

// 交付物章节
export interface DeliverableSection {
  id: string;
  title: string;
  level: number;      // 标题级别 1-6
  content: string;    // Markdown 内容
  order: number;      // 排序
}

// 交付物元数据
export interface DeliverableMeta {
  author?: string;
  version?: string;
  keywords?: string[];
  abstract?: string;
}

// 交付物主体结构
export interface Deliverable {
  id: string;
  title: string;
  description: string;
  category: DeliverableCategory;
  status: DeliverableStatus;
  tags: string[];
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  sections: DeliverableSection[];
  meta?: DeliverableMeta;
}

// 交付物列表项（用于列表展示，不包含完整内容）
export interface DeliverableListItem {
  id: string;
  title: string;
  description: string;
  category: DeliverableCategory;
  status: DeliverableStatus;
  tags: string[];
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  sectionCount: number;
}

// 导出格式
export type ExportFormat = 'pdf' | 'word' | 'markdown';

// 导出选项
export interface ExportOptions {
  format: ExportFormat;
  includeTableOfContents?: boolean;
  includeCover?: boolean;
  filename?: string;
}

// 分类信息
export interface CategoryInfo {
  value: DeliverableCategory;
  label: string;
  icon: string;
  color: string;
}

// 分类配置
export const CATEGORY_CONFIG: Record<DeliverableCategory, CategoryInfo> = {
  research: {
    value: 'research',
    label: '调研报告',
    icon: 'FileSearch',
    color: 'iris-primary'
  },
  design: {
    value: 'design',
    label: '设计文档',
    icon: 'Palette',
    color: 'iris-secondary'
  },
  technical: {
    value: 'technical',
    label: '技术文档',
    icon: 'Code',
    color: 'iris-info'
  },
  product: {
    value: 'product',
    label: '产品文档',
    icon: 'Package',
    color: 'iris-success'
  },
  other: {
    value: 'other',
    label: '其他',
    icon: 'FileText',
    color: 'iris-accent'
  }
};

// 状态配置
export const STATUS_CONFIG: Record<DeliverableStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'zinc' },
  published: { label: '已发布', color: 'iris-success' },
  archived: { label: '已归档', color: 'zinc' }
};
