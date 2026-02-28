# Memory Manager Skill

管理 Iris 数字分身的五层记忆系统。

## 功能

### 读取记忆
- 读取核心身份 (L4)
- 读取认知层 (L3)
- 读取行为层 (L2)
- 读取情境层 (L1)
- 读取当前状态 (L0)
- 读取目标与规划
- 读取偏好与约束

### 更新记忆
- 添加对话摘要到 L1
- 添加行为观察到 L2
- 添加洞察到队列
- 更新项目状态
- 更新里程碑状态

### 同步记忆
- Git 提交变更
- 同步到 GitHub Gist
- 从 Gist 恢复记忆

## 使用方法

### 查看记忆
```bash
# 查看核心身份
cat memory-system/Memory/L4_核心层.yaml

# 查看当前目标
cat memory-system/Intent/目标与规划.yaml
```

### 更新记忆
```bash
cd memory-system/scripts

# 添加对话摘要
npx tsx update-memory.ts dialogue "今日对话摘要" "决策1,决策2" "行动1,行动2"

# 更新项目状态
npx tsx update-memory.ts project shanzhi_mei active "下一步行动"

# 添加行为观察
npx tsx update-memory.ts behavior "习惯" "上下文" "示例"

# 添加洞察
npx tsx update-memory.ts insight "洞察内容" L1 L2
```

### 同步到云端
```bash
cd memory-system/scripts

# 设置 GitHub Token
export GITHUB_TOKEN=your_token

# 同步到 Gist
npx tsx sync-gist.ts

# 从 Gist 恢复
npx tsx sync-gist.ts pull
```

### Git 提交
```bash
cd memory-system/scripts
npx tsx git-commit.ts update "更新说明"
```

## 目录结构

```
memory-system/
├── Memory/           # 被动沉淀轨道
│   ├── L0_状态层.yaml    # 当前工作状态
│   ├── L1_情境层.yaml    # 近期对话和项目
│   ├── L2_行为层.yaml    # 工作习惯
│   ├── L3_认知层.yaml    # 思维模式
│   └── L4_核心层.yaml    # 核心价值观 (只能人工修改)
├── Intent/           # 主动输入轨道
│   ├── 目标与规划.yaml
│   ├── 偏好与要求.yaml
│   └── 约束与边界.yaml
├── Meta/             # 系统元数据
│   ├── 洞察队列.yaml
│   ├── 框架演变.yaml
│   └── 复盘记录/
├── scripts/          # 管理脚本
└── schemas/          # Schema 定义
```

## 沉淀规则

| 来源层 | 目标层 | 触发条件 | 确认方式 |
|--------|--------|----------|----------|
| L0 → L1 | 会话结束 | 自动 |
| L1 → L2 | 行为模式出现 3+ 次 | 周 review |
| L2 → L3 | 发现稳定思维模式 | 季度 review |
| L3 → L4 | 发现核心价值驱动 | 年度 review (人工) |

## 注意事项

1. **L4 核心层只能人工修改**，AI 不能自动更新
2. 修改 L4 需要记录原因和时间
3. 超过 30 天的 L1 记忆会自动归档
4. 定期进行复盘，确认洞察队列中的待沉淀项
