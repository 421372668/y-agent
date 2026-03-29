# yxkj-cli

一个 AI Agent 团队协作命令行工具，支持多角色团队创建、管理和自动化任务流转。

## 功能特性

- **团队管理**: 创建、启动、停止、删除团队
- **多角色支持**: PM、Designer、Developer、Tester、Reviewer 五种标准角色
- **待办流转**: 自动化的待办任务创建与分配
- **OpenCode 集成**: 集成 OpenCode AI 执行任务
- **持久化存储**: 基于 SQLite 的数据存储
- **状态管理**: 完整的团队生命周期状态管理
- **全局命令**: 支持全局安装，命令行直接调用

## 安装

### 全局安装（推荐）

```bash
# 从 npm 安装
npm install -g yxkj-cli

# 安装后可直接使用 yxkj 命令
yxkj help
```

### 本地开发

```bash
# 克隆项目
 git clone <repository-url>
cd yxkj-cli

# 安装依赖
npm install

# 本地链接（开发测试）
npm link
```

## 使用说明

### 全局命令

安装后可直接使用 `yxkj` 命令：

```bash
# 显示帮助
yxkj help
yxkj

# 显示版本
yxkj help version

# 团队管理
yxkj team <command> [options]

# OpenCode 任务
yxkj opencode run <工作目录> <任务>
```

### 团队管理命令

```bash
# 创建团队
yxkj team create <团队名称> <工作目录> "<团队描述>"

# 查看所有团队
yxkj team list

# 启动团队（成员开始执行任务）
yxkj team start <团队名称> <执行频率ms>

# 查看团队状态
yxkj team status <团队名称>

# 停止团队
yxkj team stop <团队名称>

# 删除团队
yxkj team delete <团队名称>

# 管理团队成员
yxkj team add-member <团队名称> <成员名称> <成员类型>
yxkj team remove-member <团队名称> <成员名称>
yxkj team members <团队名称>
```

### OpenCode 命令

使用 OpenCode AI 执行任务：

```bash
# 执行任务（自动启动服务）
yxkj opencode run <工作目录> "<任务描述>"

# 指定端口
yxkj opencode run <工作目录> "<任务描述>" --port 4097

# 连接已有服务
yxkj opencode run-with-existing-server <工作目录> "<任务描述>" [服务地址]
```

**前置要求：**
```bash
# 安装 OpenCode CLI
npm install -g opencode-ai
```

### 成员管理命令

```bash
# 列出团队成员
yxkj member list <团队名称>

# 添加成员
yxkj member add <团队名称> <成员名称> [成员类型]

# 移除成员
yxkj member remove <团队名称> <成员名称>

# 查看成员详情
yxkj member info <团队名称> <成员名称>
```

### 示例

```bash
# 创建一个名为 "myteam" 的团队
yxkj team create myteam ./workspace/myteam "我的开发团队"

# 启动团队，每 5000ms 执行一次任务
yxkj team start myteam 5000

# 查看团队状态
yxkj team status myteam

# 添加开发者成员
yxkj team add-member myteam zhangsan developer

# 使用 OpenCode 执行任务
yxkj opencode run ./workspace/myteam "创建 README.md 文件"

# 停止团队
yxkj team stop myteam

# 删除团队
yxkj team delete myteam
```

## 角色协作流程

团队成员按以下流程协作处理待办任务：

```
┌─────────────────────────────────────────────────────────────────┐
│                        任务流转流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PM (项目经理)                                                  │
│    │  • 创建待办任务                                              │
│    │  • 分配给 Designer                                          │
│    ▼                                                             │
│   Designer (设计师)                                              │
│    │  • 查询并执行自己的待办                                       │
│    │  • 完成后创建 Developer 待办                                 │
│    ▼                                                             │
│   Developer (开发者)                                             │
│    │  • 查询并执行自己的待办                                       │
│    │  • 完成后创建 Tester 和 Reviewer 待办                        │
│    ├──────────────────────┬──────────────────────┐               │
│    ▼                      ▼                      │               │
│   Tester (测试)        Reviewer (审核)           │               │
│    │  • 执行测试          │  • 执行代码审核        │               │
│    │  • 通过/不通过       │  • 通过/不通过        │               │
│    │  • 创建 Developer    │  • 创建 Developer    │               │
│    │    待办（含结果）     │    待办（含结果）     │               │
│    └──────────────────────┴──────────────────────┘               │
│                            │                                     │
│                            ▼                                     │
│                     Developer (处理反馈)                          │
│                      • 继续下一轮流转...                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 角色职责

| 角色 | 职责 | 下游角色 |
|------|------|----------|
| PM | 创建项目待办任务 | Designer |
| Designer | 设计方案，执行待办 | Developer |
| Developer | 开发实现，执行待办 | Tester, Reviewer |
| Tester | 测试验证（70%通过率） | Developer |
| Reviewer | 代码审核（80%通过率） | Developer |

### 待办状态

- `pending` - 待处理
- `completed` - 已完成

## 项目结构

```
yxkj-cli/
├── bin/
│   └── yxkj.js            # 全局命令入口
├── src/
│   ├── index.js           # CLI 入口
│   ├── commands/
│   │   ├── team.js        # 团队管理命令
│   │   ├── member.js      # 成员管理命令
│   │   ├── opencode.js    # OpenCode 任务命令
│   │   └── help.js        # 帮助命令
│   ├── services/
│   │   ├── agent-service.js   # Agent 服务
│   │   ├── flow-service.js    # 流程服务
│   │   └── git-service.js     # Git 服务
│   ├── role/              # 角色任务定义
│   │   ├── pm.js          # 项目经理
│   │   ├── designer.js    # 设计师
│   │   ├── developer.js   # 开发者
│   │   ├── tester.js      # 测试人员
│   │   ├── reviewer.js    # 审核人员
│   │   └── other.js       # 其他角色 + executeTodo
│   └── utils/
│       ├── config.js      # 配置管理
│       └── logger.js      # 日志工具
├── public/                # Web 界面资源
├── script/
│   └── yxkj.bat           # Windows 批处理脚本（备用）
├── package.json
└── README.md
```

## 数据存储

团队数据存储在指定工作目录下的 SQLite 数据库中：

- `<工作目录>/<团队名称>.db` - 团队数据库
  - `members` 表 - 成员信息
  - `todos` 表 - 待办任务
  - `work_logs` 表 - 工作日志

## 技术栈

- **运行时**: Node.js (ES Module)
- **数据库**: sql.js (SQLite in-memory with persistence)
- **AI 集成**: @opencode-ai/sdk
- **通信**: Socket.IO, Express
- **日志**: Winston

## 依赖

### 运行依赖
- `@opencode-ai/sdk` - OpenCode SDK
- `sql.js` - SQLite 数据库
- `express` - Web 服务
- `socket.io` - 实时通信
- `winston` - 日志
- `uuid` - UUID 生成

### 可选依赖
- `opencode-ai` (全局) - OpenCode CLI，用于 AI 任务执行

## License

MIT
