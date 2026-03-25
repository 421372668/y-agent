# AIAgent 管理系统

操作其他 AIAgent（如 OpenCode）完成软件工程的开发工作。

## 功能特性

- 🌐 **Web 聊天界面** - 提供实时聊天页面供用户输入需求
- 🤖 **AIAgent 集成** - 支持调用外部 AIAgent 进行双向交互
- 🔄 **7 步开发流程** - 自动化执行标准软件开发流程
  1. 需求记录
  2. 需求澄清
  3. 设计输出
  4. 代码开发
  5. 代码审查
  6. 测试验证
  7. Git 提交

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动服务器
```bash
npm start
```

### 访问应用
打开浏览器访问：http://localhost:3000

## 项目结构

```
y-agent/
├── server.js              # 主服务器入口
├── public/                # 前端静态文件
│   ├── index.html         # 聊天页面
│   ├── style.css          # 样式文件
│   └── app.js             # 前端逻辑
├── src/                   # 后端源码
│   ├── services/          # 服务层
│   │   ├── flow-service.js    # 流程引擎
│   │   ├── agent-service.js   # AIAgent 服务
│   │   └── git-service.js     # Git 服务
│   └── utils/             # 工具函数
│       └── logger.js          # 日志工具
├── logs/                  # 日志目录
├── requirements.md        # 需求文档
├── specification.md       # 需求规格说明书
└── design.md              # 设计文档
```

## API 接口

### REST API
- `POST /api/sessions` - 创建新会话
- `GET /api/sessions` - 获取所有会话
- `GET /api/sessions/:id` - 获取会话详情
- `POST /api/sessions/:id/messages` - 发送消息
- `POST /api/sessions/:id/flow/start` - 启动开发流程

### WebSocket 事件
- `message:user` - 用户消息
- `message:agent` - Agent 响应
- `flow:progress` - 流程进度
- `flow:complete` - 流程完成

## 配置

通过环境变量配置：
- `PORT` - 服务端口（默认 3000）
- `AGENT_API_KEY` - Agent API 密钥
- `AGENT_API_URL` - Agent API 地址
- `LOG_LEVEL` - 日志级别（默认 info）

## 技术栈

- **后端**: Node.js + Express + Socket.IO
- **前端**: HTML5 + CSS3 + JavaScript
- **集成**: Git + 文件系统

## 许可证

MIT
