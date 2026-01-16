/**
 * GitHub Gist 同步脚本
 * 将记忆系统文件同步到 GitHub Gist 实现云备份
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as YAML from 'yaml';
import { Octokit } from 'octokit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORY_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(MEMORY_ROOT, 'config.yaml');

interface GistConfig {
  enabled: boolean;
  gist_id: string;
  description: string;
  public: boolean;
}

interface Config {
  sync: {
    gist: GistConfig;
  };
}

// 需要同步的文件列表
const FILES_TO_SYNC = [
  'Memory/L1_情境层.yaml',
  'Memory/L2_行为层.yaml',
  'Memory/L3_认知层.yaml',
  'Memory/L4_核心层.yaml',
  'Intent/目标与规划.yaml',
  'Intent/偏好与要求.yaml',
  'Intent/约束与边界.yaml',
  'Meta/洞察队列.yaml',
  'Meta/框架演变.yaml',
];

function readConfig(): Config {
  const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return YAML.parse(content) as Config;
}

function updateConfig(gistId: string): void {
  const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const config = YAML.parse(content);
  config.sync.gist.gist_id = gistId;
  fs.writeFileSync(CONFIG_PATH, YAML.stringify(config, { indent: 2 }), 'utf-8');
}

function readFilesForSync(): Record<string, { content: string }> {
  const files: Record<string, { content: string }> = {};
  
  for (const relativePath of FILES_TO_SYNC) {
    const fullPath = path.join(MEMORY_ROOT, relativePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      // 使用下划线替换路径分隔符，作为 Gist 文件名
      const gistFileName = relativePath.replace(/\//g, '_');
      files[gistFileName] = { content };
    }
  }
  
  // 添加一个索引文件
  files['_INDEX.md'] = {
    content: `# Iris 数字分身记忆系统

## 同步时间
${new Date().toISOString()}

## 文件列表
${FILES_TO_SYNC.map(f => `- ${f}`).join('\n')}

## 说明
这是 Iris 数字分身的五层记忆系统备份。
基于晓辉博士的记忆系统理论设计。

### 层级说明
- **L0 状态层**: 当前工作状态（不同步）
- **L1 情境层**: 近期对话和项目状态
- **L2 行为层**: 工作习惯和行为模式
- **L3 认知层**: 思维模式和决策框架
- **L4 核心层**: 核心价值观和身份认同

### Intent 轨道
- **目标与规划**: 长期目标和当前聚焦
- **偏好与要求**: 工作偏好和沟通要求
- **约束与边界**: 约束条件和边界设定

### Meta 轨道
- **洞察队列**: 待沉淀的洞察
- **框架演变**: 系统演变历史
`,
  };
  
  return files;
}

async function syncToGist(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ 请设置 GITHUB_TOKEN 环境变量');
    console.log('\n使用方法:');
    console.log('  export GITHUB_TOKEN=your_github_token');
    console.log('  npm run sync');
    process.exit(1);
  }
  
  const config = readConfig();
  const gistConfig = config.sync.gist;
  
  if (!gistConfig.enabled) {
    console.log('⚠️ Gist 同步未启用，请在 config.yaml 中设置 sync.gist.enabled: true');
    return;
  }
  
  const octokit = new Octokit({ auth: token });
  const files = readFilesForSync();
  
  console.log('🚀 开始同步到 GitHub Gist...\n');
  console.log(`📁 同步文件数: ${Object.keys(files).length}`);
  
  try {
    if (gistConfig.gist_id) {
      // 更新现有 Gist
      console.log(`📝 更新 Gist: ${gistConfig.gist_id}`);
      
      await octokit.rest.gists.update({
        gist_id: gistConfig.gist_id,
        description: `${gistConfig.description} - 更新于 ${new Date().toISOString()}`,
        files,
      });
      
      console.log(`\n✅ Gist 更新成功！`);
      console.log(`🔗 https://gist.github.com/${gistConfig.gist_id}`);
    } else {
      // 创建新 Gist
      console.log('📝 创建新 Gist...');
      
      const response = await octokit.rest.gists.create({
        description: gistConfig.description,
        public: gistConfig.public,
        files,
      });
      
      const newGistId = response.data.id!;
      updateConfig(newGistId);
      
      console.log(`\n✅ Gist 创建成功！`);
      console.log(`🔗 ${response.data.html_url}`);
      console.log(`\n💡 Gist ID 已保存到 config.yaml`);
    }
  } catch (error) {
    console.error('❌ 同步失败:', error);
    process.exit(1);
  }
}

async function pullFromGist(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ 请设置 GITHUB_TOKEN 环境变量');
    process.exit(1);
  }
  
  const config = readConfig();
  const gistId = config.sync.gist.gist_id;
  
  if (!gistId) {
    console.error('❌ 没有配置 Gist ID，请先运行 sync 创建 Gist');
    process.exit(1);
  }
  
  const octokit = new Octokit({ auth: token });
  
  console.log('🔄 从 Gist 拉取记忆数据...\n');
  
  try {
    const response = await octokit.rest.gists.get({ gist_id: gistId });
    const files = response.data.files;
    
    if (!files) {
      console.error('❌ Gist 中没有文件');
      process.exit(1);
    }
    
    for (const [gistFileName, fileData] of Object.entries(files)) {
      if (gistFileName.startsWith('_')) continue; // 跳过索引文件
      
      // 还原路径
      const relativePath = gistFileName.replace(/_/g, '/');
      const fullPath = path.join(MEMORY_ROOT, relativePath);
      
      // 确保目录存在
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, fileData?.content || '', 'utf-8');
      console.log(`✅ 已恢复: ${relativePath}`);
    }
    
    console.log('\n🎉 记忆数据恢复完成！');
  } catch (error) {
    console.error('❌ 拉取失败:', error);
    process.exit(1);
  }
}

// 命令行参数处理
const command = process.argv[2];

if (command === 'pull') {
  pullFromGist().catch(console.error);
} else {
  syncToGist().catch(console.error);
}
