# AIAgent 管理系统 - 详细设计方案

## 1. 系统架构

### 1.1 整体架构
```
┌─────────────────────────────────────────────────────────┐
│                    浏览器客户端                          │
│              (HTML/CSS/JS + WebSocket)                  │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket + HTTP
┌────────────────────▼────────────────────────────────────┐
│                  Node.js 后端服务器                      │
│  ┌─────────────┬─────────────┬─────────────────────┐   │
│  │  聊天路由   │  流程路由   │   Agent 路由        │   │
│  └─────────────┴─────────────┴─────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              流程引擎 (7 步控制器)                │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │           AIAgent 集成模块 (OpenCode)            │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Git 操作模块                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                     │ 文件系统
┌────────────────────▼────────────────────────────────────┐
│                  本地文件系统                            │
│              (项目代码 + 配置文件)                       │
└─────────────────────────────────────────────────────────┘
```

## 2. 文件结构设计

```
y-agent/
├── package.json              # 项目配置
├── server.js                 # 主服务器入口
├── requirements.md           # 需求文档
├── specification.md          # 需求规格说明书
├── design.md                 # 设计文档
├── public/                   # 前端静态文件
│   ├── index.html           # 聊天页面
│   ├── style.css            # 样式
│   └── app.js               # 前端逻辑
├── src/                      # 后端源码
│   ├── routes/              # 路由模块
│   │   ├── chat.js          # 聊天路由
│   │   ├── flow.js          # 流程路由
│   │   └── agent.js         # Agent 路由
│   ├── services/            # 服务层
│   │   ├── agent-service.js # AIAgent 服务
│   │   ├── flow-service.js  # 流程引擎服务
│   │   └── git-service.js   # Git 服务
│   ├── models/              # 数据模型
│   │   ├── message.js       # 消息模型
│   │   └── session.js       # 会话模型
│   └── utils/               # 工具函数
│       └── logger.js        # 日志工具
└── logs/                    # 日志目录
```

## 3. 数据模型设计

### 3.1 消息模型 (Message)
```javascript
{
  id: string,           // 唯一标识
  sessionId: string,    // 会话 ID
  type: 'user' | 'agent' | 'system',  // 消息类型
  content: string,      // 消息内容
  timestamp: Date,      // 时间戳
  metadata: object      // 附加元数据
}
```

### 3.2 会话模型 (Session)
```javascript
{
  id: string,           // 会话 ID
  status: 'active' | 'completed' | 'paused',  // 会话状态
  currentStep: number,  // 当前流程步骤 (1-7)
  messages: [],         // 消息历史
  createdAt: Date,      // 创建时间
  updatedAt: Date       // 更新时间
}
```

### 3.3 流程步骤枚举
```javascript
const FLOW_STEPS = {
  1: 'requirement',   // 需求记录
  2: 'clarify',       // 需求澄清
  3: 'design',        // 设计输出
  4: 'develop',       // 代码开发
  5: 'review',        // 代码审查
  6: 'test',          // 测试验证
  7: 'git'            // Git 提交
}
```

## 4. API 设计

### 4.1 REST API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/chat/send | 发送用户消息 |
| GET  | /api/chat/history | 获取消息历史 |
| POST | /api/flow/start | 启动开发流程 |
| GET  | /api/flow/status | 获取流程状态 |
| POST | /api/agent/invoke | 调用 AIAgent |

### 4.2 WebSocket 事件

| 事件 | 方向 | 描述 |
|------|------|------|
| message:user | 客户端→服务器 | 用户发送消息 |
| message:agent | 服务器→客户端 | Agent 响应消息 |
| flow:progress | 服务器→客户端 | 流程进度更新 |
| flow:complete | 服务器→客户端 | 流程完成通知 |

## 5. 流程引擎设计

### 5.1 7 步流程控制器
```javascript
class FlowController {
  async execute(sessionId) {
    const steps = [
      this.stepRequirement,
      this.stepClarify,
      this.stepDesign,
      this.stepDevelop,
      this.stepReview,
      this.stepTest,
      this.stepGit
    ]
    
    for (const step of steps) {
      await step(sessionId)
      this.notifyProgress(sessionId, step)
    }
  }
}
```

### 5.2 错误处理策略
- 每步可配置重试次数
- 失败时暂停流程并通知用户
- 支持手动恢复/跳过步骤

## 6. 安全设计

### 6.1 输入验证
- 消息内容 XSS 过滤
- 文件路径遍历防护
- 命令注入防护

### 6.2 资源限制
- 消息长度限制
- 请求频率限制
- 内存使用监控

## 7. 部署设计

### 7.1 启动流程
```bash
npm install
node server.js
# 访问 http://localhost:3000
```

### 7.2 配置项
- PORT: 服务端口 (默认 3000)
- WORKSPACE_ROOT: 工作目录
- AGENT_API_KEY: Agent API 密钥

---
*设计文档版本: 1.0*
*创建日期: 2026-03-25*
