import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { getIrisMePath, config } from '../utils/config.js';
import type { DailyExecutionReport, CodeOutput } from '../types/index.js';

/**
 * 交付物打包器
 * 将生成的代码和报告打包成交付物
 */
export class DeliveryPackager {
  /**
   * 打包每日交付物
   */
  async packageDailyDelivery(report: DailyExecutionReport): Promise<string> {
    const dateStr = report.date.toISOString().split('T')[0];
    const deliveryDir = path.join(
      getIrisMePath(),
      config.delivery.outputDir,
      dateStr
    );

    await fs.mkdir(deliveryDir, { recursive: true });

    // 创建交付物清单
    const manifest = await this.createManifest(report, deliveryDir);
    
    // 保存清单
    const manifestPath = path.join(deliveryDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    logger.info(`Delivery packaged: ${deliveryDir}`);
    return deliveryDir;
  }

  /**
   * 创建交付物清单
   */
  private async createManifest(
    report: DailyExecutionReport,
    deliveryDir: string
  ): Promise<DeliveryManifest> {
    const files: ManifestFile[] = [];

    // 收集所有生成的文件
    for (const result of report.results) {
      for (const output of result.outputs) {
        files.push({
          path: path.relative(deliveryDir, output.filePath),
          language: output.language,
          linesOfCode: output.linesOfCode,
          action: output.action,
          taskId: result.taskId,
        });
      }
    }

    return {
      version: '1.0.0',
      date: report.date.toISOString(),
      generatedAt: new Date().toISOString(),
      summary: {
        tasksPlanned: report.tasksPlanned,
        tasksCompleted: report.tasksCompleted,
        tasksFailed: report.tasksFailed,
        totalLinesOfCode: report.totalLinesOfCode,
        totalDuration: report.totalDuration,
      },
      files,
      report: `daily_report_${report.date.toISOString().split('T')[0]}.md`,
    };
  }

  /**
   * 复制代码文件到项目目录
   */
  async deployToProject(
    outputs: CodeOutput[],
    projectPath: string
  ): Promise<DeployResult> {
    const deployed: string[] = [];
    const failed: Array<{ file: string; error: string }> = [];

    for (const output of outputs) {
      try {
        // 确定目标路径
        let targetPath: string;
        
        if (path.isAbsolute(output.filePath)) {
          targetPath = output.filePath;
        } else {
          targetPath = path.join(projectPath, output.filePath);
        }

        // 确保目录存在
        await fs.mkdir(path.dirname(targetPath), { recursive: true });

        // 检查文件是否已存在
        const exists = await this.fileExists(targetPath);
        
        if (exists && output.action !== 'modify') {
          // 备份现有文件
          const backupPath = `${targetPath}.backup.${Date.now()}`;
          await fs.copyFile(targetPath, backupPath);
          logger.info(`Backed up existing file: ${backupPath}`);
        }

        // 写入文件
        await fs.writeFile(targetPath, output.content, 'utf-8');
        deployed.push(targetPath);
        
        logger.info(`Deployed: ${targetPath}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        failed.push({
          file: output.filePath,
          error: errorMessage,
        });
        logger.error(`Failed to deploy ${output.filePath}: ${errorMessage}`);
      }
    }

    return {
      success: failed.length === 0,
      deployed,
      failed,
    };
  }

  /**
   * 检查文件是否存在
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清理旧的交付物
   */
  async cleanupOldDeliveries(maxAgeDays: number = 30): Promise<number> {
    const deliveryDir = path.join(getIrisMePath(), config.delivery.outputDir);
    let deletedCount = 0;

    try {
      const entries = await fs.readdir(deliveryDir, { withFileTypes: true });
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        // 解析目录名作为日期
        const dirDate = new Date(entry.name);
        if (isNaN(dirDate.getTime())) continue;

        if (dirDate < cutoffDate) {
          const dirPath = path.join(deliveryDir, entry.name);
          await fs.rm(dirPath, { recursive: true });
          deletedCount++;
          logger.info(`Cleaned up old delivery: ${entry.name}`);
        }
      }

    } catch (error) {
      logger.warn('Failed to cleanup old deliveries:', error);
    }

    return deletedCount;
  }

  /**
   * 获取交付物目录大小
   */
  async getDeliverySize(): Promise<{
    totalSize: number;
    fileCount: number;
  }> {
    const deliveryDir = path.join(getIrisMePath(), config.delivery.outputDir);
    let totalSize = 0;
    let fileCount = 0;

    try {
      const walkDir = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else {
            const stat = await fs.stat(fullPath);
            totalSize += stat.size;
            fileCount++;
          }
        }
      };

      await walkDir(deliveryDir);

    } catch (error) {
      // 目录可能不存在
    }

    return { totalSize, fileCount };
  }
}

// 类型定义
interface DeliveryManifest {
  version: string;
  date: string;
  generatedAt: string;
  summary: {
    tasksPlanned: number;
    tasksCompleted: number;
    tasksFailed: number;
    totalLinesOfCode: number;
    totalDuration: number;
  };
  files: ManifestFile[];
  report: string;
}

interface ManifestFile {
  path: string;
  language: string;
  linesOfCode: number;
  action: 'create' | 'modify' | 'delete';
  taskId: string;
}

interface DeployResult {
  success: boolean;
  deployed: string[];
  failed: Array<{ file: string; error: string }>;
}

export const deliveryPackager = new DeliveryPackager();
