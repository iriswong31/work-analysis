import { db } from './database';

/**
 * 记忆层数据导出服务
 * 将 IndexedDB 数据导出为 JSON 供 auto-agent-scheduler 使用
 */
export const memoryExporter = {
  /**
   * 导出所有记忆层数据
   */
  async exportAll(): Promise<string> {
    const [
      coreIdentity,
      longTermGoals,
      midTermPlans,
      shortTermTasks,
      immediateContext,
      seedPack,
      feedbacks,
      dailyOutputs,
    ] = await Promise.all([
      db.coreIdentity.toArray(),
      db.longTermGoals.toArray(),
      db.midTermPlans.toArray(),
      db.shortTermTasks.toArray(),
      db.immediateContext.toArray(),
      db.seedPack.toArray(),
      db.feedbacks.toArray(),
      db.dailyOutputs.toArray(),
    ]);

    const data = {
      coreIdentity: coreIdentity[0] || null,
      longTermGoals,
      midTermPlans,
      shortTermTasks,
      immediateContext: immediateContext[0] || null,
      seedPack: seedPack[0] || null,
      feedbacks,
      dailyOutputs,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  },

  /**
   * 导出并下载为文件
   */
  async downloadExport(): Promise<void> {
    const data = await this.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * 导出到本地文件系统（需要 File System Access API）
   */
  async exportToScheduler(): Promise<boolean> {
    try {
      const data = await this.exportAll();
      
      // 尝试使用 File System Access API
      if ('showSaveFilePicker' in window) {
        const handle = await (window as unknown as { showSaveFilePicker: (options: object) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: 'memory_export.json',
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });
        
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
        return true;
      }
      
      // 降级到下载
      await this.downloadExport();
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  },

  /**
   * 获取导出数据的摘要
   */
  async getExportSummary(): Promise<{
    tasksCount: number;
    pendingTasks: number;
    goalsCount: number;
    feedbacksCount: number;
    lastUpdated: Date | null;
  }> {
    const [tasks, goals, feedbacks, context] = await Promise.all([
      db.shortTermTasks.toArray(),
      db.longTermGoals.toArray(),
      db.feedbacks.toArray(),
      db.immediateContext.toArray(),
    ]);

    return {
      tasksCount: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
      goalsCount: goals.length,
      feedbacksCount: feedbacks.length,
      lastUpdated: context[0]?.updatedAt || null,
    };
  },
};
