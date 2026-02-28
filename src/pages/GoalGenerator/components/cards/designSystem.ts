// 共用设计系统 - 四种场景卡片（A/B/C/D）
export const sceneCardSystem = {
  // 画布尺寸
  canvas: {
    width: 1080,
    height: 1920,
    // 安全区
    safeArea: {
      horizontal: 72,
      vertical: 90
    },
    contentMaxWidth: 936
  },
  
  // 颜色系统（低饱和、纸感）
  colors: {
    // 背景渐变：暖米白 → 雾蓝灰
    gradientTop: '#F5F0EA',
    gradientBottom: '#D7DEE6',
    
    // 卡片
    cardBg: '#FBFAF8',
    cardBgAlt: 'rgba(255, 255, 255, 0.94)',
    
    // 文字
    textPrimary: '#2E2E2E',
    textSecondary: '#6B6B6B',
    
    // 分割线
    divider: 'rgba(230, 224, 218, 0.6)',
    
    // 点缀色（克制使用，全图最多1-2个）
    accent: {
      gold: '#C9A86A',      // 柔金
      red: '#C97B6B',       // 雾红
      green: '#7E9B86',     // 鼠尾草绿
      blue: '#7C8FA6'       // 雾蓝
    }
  },
  
  // 字体系统
  typography: {
    // 字体族
    fontFamily: {
      cn: '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
      en: '"Inter", "SF Pro Display", sans-serif'
    },
    // 字号（基于1080宽度，实际渲染时按比例缩放）
    fontSize: {
      h1: 56,           // 主标题
      h2: 36,           // 模块标题
      body: 28,         // 正文
      caption: 24       // 说明/注释
    },
    // 字重
    fontWeight: {
      regular: 400,
      semibold: 600
    },
    // 行高
    lineHeight: {
      title: 1.2,
      body: 1.6
    },
    // 字间距
    letterSpacing: {
      title: '-0.01em',
      body: '0'
    }
  },
  
  // 卡片组件样式
  card: {
    borderRadius: 28,
    padding: 32,
    paddingSmall: 24,
    // 极轻柔阴影
    shadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(0, 0, 0, 0.04)'
  },
  
  // 间距系统
  spacing: {
    modulePadding: 32,
    moduleGap: 32,
    paragraphGap: 14,
    iconGap: 12
  },
  
  // 图标
  icon: {
    size: 26,
    gap: 12
  }
};

// 完整版卡片设计系统（毛玻璃+香槟金雾蓝）
export const fullCardSystem = {
  // 画布
  canvas: {
    width: 400,
    minHeight: 700
  },
  
  // 颜色
  colors: {
    // 背景渐变：香槟金+冷雾蓝
    gradient: 'linear-gradient(135deg, #CFD9DF 0%, #E2E2E2 100%)',
    
    // 毛玻璃卡片
    glassBg: 'rgba(255, 255, 255, 0.6)',
    glassBlur: 20,
    
    // 文字
    textPrimary: '#2E2E2E',
    textSecondary: '#5A5A5A',
    
    // 胶囊标签背景
    tagBg: 'rgba(180, 200, 220, 0.3)',
    
    // 分割线
    divider: 'rgba(200, 200, 200, 0.3)'
  },
  
  // 字体（衬线体标题 + 无衬线正文）
  typography: {
    titleFont: '"Noto Serif SC", "Source Han Serif SC", serif',
    bodyFont: '"PingFang SC", "Noto Sans SC", sans-serif',
    titleSize: 28,
    subtitleSize: 16,
    bodySize: 14,
    captionSize: 12,
    lineHeight: 1.8,
    titleLetterSpacing: '0.1em'
  },
  
  // 卡片
  card: {
    borderRadius: 24,
    padding: 24,
    shadow: '0 8px 32px rgba(0, 0, 0, 0.05)'
  }
};
