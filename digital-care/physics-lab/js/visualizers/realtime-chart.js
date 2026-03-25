/**
 * AIGP 物理实验室 — 实时图表组件
 * Canvas 绘制折线图/柱状图，支持动态数据推送
 */

export class RealtimeChart {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.type = opts.type || 'line'; // 'line' | 'bar' | 'scatter'
    this.title = opts.title || '';
    this.xLabel = opts.xLabel || '';
    this.yLabel = opts.yLabel || '';
    this.data = [];
    this.maxPoints = opts.maxPoints || 50;
    this.colors = opts.colors || ['#4a9eff', '#00ff88', '#ff8c00', '#ff6b9d'];
    this.padding = { top: 40, right: 20, bottom: 40, left: 50 };
    this.animated = true;
    this.trendLine = opts.trendLine || false;
  }
  
  /** 添加数据点 */
  addPoint(x, y, series = 0) {
    if (!this.data[series]) this.data[series] = [];
    this.data[series].push({ x, y });
    if (this.data[series].length > this.maxPoints) {
      this.data[series].shift();
    }
    this.render();
  }
  
  /** 设置完整数据 */
  setData(data, series = 0) {
    this.data[series] = data;
    this.render();
  }
  
  /** 清空数据 */
  clear() {
    this.data = [];
    this.render();
  }
  
  /** 渲染 */
  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.padding;
    const plotW = w - p.left - p.right;
    const plotH = h - p.top - p.bottom;
    
    // 清除
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, w, h);
    
    // 边框
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.left, p.top, plotW, plotH);
    
    // 标题
    if (this.title) {
      ctx.fillStyle = '#e8ecff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.title, w / 2, 20);
    }
    
    // 获取数据范围
    let allPoints = this.data.flat();
    if (allPoints.length === 0) return;
    
    const xMin = Math.min(...allPoints.map(p => p.x));
    const xMax = Math.max(...allPoints.map(p => p.x));
    const yMin = 0;
    const yMax = Math.max(...allPoints.map(p => p.y)) * 1.1 || 1;
    
    // 网格线
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = p.top + (plotH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(p.left, y);
      ctx.lineTo(p.left + plotW, y);
      ctx.stroke();
      
      // Y轴刻度
      const val = yMax - (yMax - yMin) * (i / 5);
      ctx.fillStyle = '#5a6380';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1), p.left - 5, y + 3);
    }
    
    // 绘制数据系列
    this.data.forEach((series, si) => {
      if (!series || series.length === 0) return;
      const color = this.colors[si % this.colors.length];
      
      const mapX = (x) => p.left + ((x - xMin) / (xMax - xMin || 1)) * plotW;
      const mapY = (y) => p.top + plotH - ((y - yMin) / (yMax - yMin || 1)) * plotH;
      
      if (this.type === 'line' || this.type === 'scatter') {
        // 折线
        if (this.type === 'line' && series.length > 1) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(mapX(series[0].x), mapY(series[0].y));
          for (let i = 1; i < series.length; i++) {
            ctx.lineTo(mapX(series[i].x), mapY(series[i].y));
          }
          ctx.stroke();
        }
        
        // 数据点
        for (const pt of series) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(mapX(pt.x), mapY(pt.y), 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // 趋势线
      if (this.trendLine && series.length >= 2) {
        const { slope, intercept } = linearRegression(series);
        ctx.strokeStyle = color + '60';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(mapX(xMin), mapY(slope * xMin + intercept));
        ctx.lineTo(mapX(xMax), mapY(slope * xMax + intercept));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    
    // X轴标签
    if (this.xLabel) {
      ctx.fillStyle = '#8892b0';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.xLabel, w / 2, h - 5);
    }
    
    // Y轴标签
    if (this.yLabel) {
      ctx.save();
      ctx.translate(12, h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#8892b0';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.yLabel, 0, 0);
      ctx.restore();
    }
  }
}

/** 线性回归 */
function linearRegression(points) {
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}
