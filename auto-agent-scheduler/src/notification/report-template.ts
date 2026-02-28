/**
 * 日报邮件 HTML 模板
 */

import type { DailyReport } from '../autonomous/types.js';

export function generateReportHtml(report: DailyReport): string {
  const successRate = report.tasksPlanned > 0 
    ? ((report.tasksCompleted / report.tasksPlanned) * 100).toFixed(1)
    : '0';
  
  const efficiencyColor = report.efficiency >= 100 ? '#10b981' : 
                          report.efficiency >= 80 ? '#f59e0b' : '#ef4444';
  
  const statusEmoji = report.tasksCompleted === report.tasksPlanned ? '🎉' :
                      report.tasksCompleted > 0 ? '📈' : '⚠️';

  // 生成任务详情 HTML
  const tasksHtml = report.results.map(result => {
    const statusIcon = result.success ? '✅' : '❌';
    const statusColor = result.success ? '#10b981' : '#ef4444';
    const outputsHtml = result.outputs.length > 0 
      ? `<div style="margin-top: 8px; padding-left: 16px; border-left: 2px solid #e5e7eb;">
          ${result.outputs.map(o => `
            <div style="font-size: 12px; color: #6b7280; margin: 4px 0;">
              📄 ${o.path || o.type} ${o.linesOfCode ? `(${o.linesOfCode} 行)` : ''}
            </div>
          `).join('')}
        </div>`
      : '';
    
    return `
      <div style="background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">${statusIcon}</span>
          <span style="font-weight: 500; color: #1f2937;">${result.taskId}</span>
          <span style="color: ${statusColor}; font-size: 12px; margin-left: auto;">
            ${result.actualMinutes}分钟
          </span>
        </div>
        ${outputsHtml}
      </div>
    `;
  }).join('');

  // 生成成就 HTML
  const achievementsHtml = report.achievements.length > 0
    ? `<div style="margin-top: 20px;">
        <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">🏆 今日成就</h3>
        ${report.achievements.map(a => `
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 6px; padding: 8px 12px; margin-bottom: 6px; font-size: 14px;">
            ${a}
          </div>
        `).join('')}
      </div>`
    : '';

  // 生成学习收获 HTML
  const learningsHtml = report.learnings.length > 0
    ? `<div style="margin-top: 20px;">
        <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">💡 学习收获</h3>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
          ${report.learnings.map(l => `<li style="margin-bottom: 4px;">${l}</li>`).join('')}
        </ul>
      </div>`
    : '';

  // 生成阻塞问题 HTML
  const blockersHtml = report.blockers.length > 0
    ? `<div style="margin-top: 20px;">
        <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">🚧 遇到的问题</h3>
        <ul style="margin: 0; padding-left: 20px; color: #ef4444;">
          ${report.blockers.map(b => `<li style="margin-bottom: 4px;">${b}</li>`).join('')}
        </ul>
      </div>`
    : '';

  // 生成明日建议 HTML
  const recommendationsHtml = report.nextDayRecommendations.length > 0
    ? `<div style="margin-top: 20px;">
        <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">📋 明日建议</h3>
        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
          ${report.nextDayRecommendations.map(r => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
        </ul>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Iris 数字分身日报 - ${report.date}</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
        ${statusEmoji} Iris 数字分身日报
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
        ${report.date}
      </p>
    </div>
    
    <!-- Stats Cards -->
    <div style="background: white; padding: 20px; border-bottom: 1px solid #e5e7eb;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #10b981;">${report.tasksCompleted}/${report.tasksPlanned}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">完成任务</div>
        </div>
        <div style="background: #fef3c7; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${successRate}%</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">成功率</div>
        </div>
        <div style="background: #ede9fe; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #8b5cf6;">${report.totalActualMinutes}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">工作分钟</div>
        </div>
        <div style="background: #fce7f3; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: ${efficiencyColor};">${report.efficiency.toFixed(0)}%</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">效率指数</div>
        </div>
      </div>
    </div>
    
    <!-- Task Details -->
    <div style="background: white; padding: 20px;">
      <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 16px 0;">📝 任务详情</h3>
      ${tasksHtml || '<p style="color: #9ca3af; font-size: 14px;">今日没有执行任务</p>'}
      
      ${achievementsHtml}
      ${learningsHtml}
      ${blockersHtml}
      ${recommendationsHtml}
    </div>
    
    <!-- Feedback Section -->
    <div style="background: #f0f9ff; padding: 20px; border-radius: 0 0 12px 12px;">
      <h3 style="color: #0369a1; font-size: 14px; margin: 0 0 8px 0;">💬 请给我反馈</h3>
      <p style="color: #0c4a6e; font-size: 13px; margin: 0; line-height: 1.5;">
        您可以直接回复此邮件，告诉我今天的工作哪些做得好、哪些需要改进。我会根据您的反馈学习和优化。
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 20px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        此邮件由 Iris 数字分身自动发送 · ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
