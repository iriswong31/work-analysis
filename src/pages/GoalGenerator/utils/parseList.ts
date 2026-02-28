/**
 * 智能解析用户输入的列表文本
 * 支持多种分隔方式：换行符、中文标点、英文标点
 */
export function parseList(text: string): string[] {
  if (!text || !text.trim()) return [];
  
  // 首先尝试按换行符分割（包括 \n, \r\n, \r）
  let items = text.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
  
  // 如果只解析出一条，尝试其他分隔符
  if (items.length === 1) {
    const singleLine = items[0];
    
    // 尝试按中文分隔符分割（顿号、中文分号、中文逗号）
    if (/[、；，]/.test(singleLine)) {
      const byChinesePunc = singleLine.split(/[、；，]/).map(s => s.trim()).filter(Boolean);
      if (byChinesePunc.length > 1) {
        items = byChinesePunc;
      }
    }
    // 尝试按英文分号分割
    else if (singleLine.includes(';')) {
      const bySemicolon = singleLine.split(';').map(s => s.trim()).filter(Boolean);
      if (bySemicolon.length > 1) {
        items = bySemicolon;
      }
    }
    // 尝试按数字序号分割 (如 "1. xxx 2. xxx" 或 "1、xxx 2、xxx")
    else if (/\d+[.、)）]\s*/.test(singleLine)) {
      const byNumber = singleLine.split(/\d+[.、)）]\s*/).map(s => s.trim()).filter(Boolean);
      if (byNumber.length > 1) {
        items = byNumber;
      }
    }
  }
  
  return items;
}
