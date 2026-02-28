/**
 * 导出服务 - 支持 PDF、Word、Markdown 格式导出
 */
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import { Deliverable } from '@/types/deliverable';

/**
 * 导出为 PDF
 */
export async function exportToPDF(
  element: HTMLElement | null,
  filename: string
): Promise<boolean> {
  if (!element) {
    console.error('导出 PDF 失败：元素不存在');
    return false;
  }

  const options = {
    margin: [15, 15, 15, 15],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#1a1a2e'
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  await html2pdf().set(options).from(element).save();
  return true;
}

/**
 * 解析 Markdown 为段落
 */
function parseMarkdownToParagraphs(markdown: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      // 空行
      paragraphs.push(new Paragraph({ text: '' }));
      continue;
    }

    // 标题
    if (trimmedLine.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace(/^# /, ''),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }));
    } else if (trimmedLine.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace(/^## /, ''),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 }
      }));
    } else if (trimmedLine.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace(/^### /, ''),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }));
    } else if (trimmedLine.startsWith('#### ')) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace(/^#### /, ''),
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 150, after: 80 }
      }));
    }
    // 列表项
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: '• ' + trimmedLine.replace(/^[-*] /, '') })
        ],
        indent: { left: 720 },
        spacing: { before: 60, after: 60 }
      }));
    }
    // 有序列表
    else if (/^\d+\. /.test(trimmedLine)) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: trimmedLine })
        ],
        indent: { left: 720 },
        spacing: { before: 60, after: 60 }
      }));
    }
    // 引用
    else if (trimmedLine.startsWith('> ')) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ 
            text: trimmedLine.replace(/^> /, ''),
            italics: true
          })
        ],
        indent: { left: 720 },
        spacing: { before: 100, after: 100 }
      }));
    }
    // 分割线
    else if (trimmedLine === '---' || trimmedLine === '***') {
      paragraphs.push(new Paragraph({
        text: '─'.repeat(50),
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 }
      }));
    }
    // 普通段落
    else {
      // 处理加粗和斜体
      const textRuns: TextRun[] = [];
      let remaining = trimmedLine;
      
      // 简单处理：移除 Markdown 格式符号
      remaining = remaining
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

      textRuns.push(new TextRun({ text: remaining }));

      paragraphs.push(new Paragraph({
        children: textRuns,
        spacing: { before: 100, after: 100 }
      }));
    }
  }

  return paragraphs;
}

/**
 * 导出为 Word
 */
export async function exportToWord(
  content: string,
  filename: string,
  deliverable?: Deliverable
): Promise<boolean> {
  // 创建封面
  const coverParagraphs: Paragraph[] = [
    new Paragraph({ text: '', spacing: { after: 1000 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: deliverable?.title || filename,
          bold: true,
          size: 56
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: deliverable?.description || '',
          size: 24,
          color: '666666'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `生成时间：${new Date().toLocaleDateString('zh-CN')}`,
          size: 20,
          color: '999999'
        })
      ],
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({ text: '', spacing: { after: 1000 } }),
    new Paragraph({
      text: '─'.repeat(50),
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  ];

  // 解析内容
  const contentParagraphs = parseMarkdownToParagraphs(content);

  // 创建文档
  const doc = new Document({
    sections: [{
      properties: {},
      children: [...coverParagraphs, ...contentParagraphs]
    }]
  });

  // 生成并下载
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
  return true;
}

/**
 * 导出为 Markdown
 */
export async function exportToMarkdown(
  content: string,
  filename: string,
  deliverable?: Deliverable
): Promise<boolean> {
  // 添加元数据头
  let fullContent = '';
  
  if (deliverable) {
    fullContent += `---
title: ${deliverable.title}
description: ${deliverable.description}
category: ${deliverable.category}
tags: [${deliverable.tags.join(', ')}]
created: ${deliverable.createdAt}
updated: ${deliverable.updatedAt}
---

`;
  }

  fullContent += content;

  // 创建 Blob 并下载
  const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${filename}.md`);
  return true;
}
