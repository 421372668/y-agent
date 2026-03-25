/**
 * AIAgent 管理系统 - 主服务器入口
 * 提供 Web 聊天页面和 AIAgent 流程控制
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 导入服务模块
const FlowService = require('./src/services/flow-service');
const AgentService = require('./src/services/agent-service');
const GitService = require('./src/services/git-service');
const logger = require('./src/utils/logger');

// 初始化 Express 应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 内存存储（生产环境应使用数据库）
const sessions = new Map();
const messages = new Map();

// 初始化服务
const flowService = new FlowService(sessions, messages, io);
const agentService = new AgentService();
const gitService = new GitService();

// ==================== REST API 路由 ====================

// 获取所有会话
app.get('/api/sessions', (req, res) => {
  const sessionList = Array.from(sessions.values()).map(s => ({
    id: s.id,
    status: s.status,
    currentStep: s.currentStep,
    createdAt: s.createdAt
  }));
  res.json(sessionList);
});

// 创建新会话
app.post('/api/sessions', (req, res) => {
  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    status: 'active',
    currentStep: 0,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  sessions.set(sessionId, session);
  messages.set(sessionId, []);
  logger.info(`创建新会话: ${sessionId}`);
  res.json(session);
});

// 获取会话详情
app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  res.json(session);
});

// 获取消息历史
app.get('/api/sessions/:id/messages', (req, res) => {
  const sessionMessages = messages.get(req.params.id) || [];
  res.json(sessionMessages);
});

// 发送用户消息
app.post('/api/sessions/:id/messages', async (req, res) => {
  const { content } = req.body;
  const sessionId = req.params.id;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: '会话不存在' });
  }
  
  const message = {
    id: uuidv4(),
    sessionId,
    type: 'user',
    content,
    timestamp: new Date()
  };
  
  messages.get(sessionId).push(message);
  io.to(sessionId).emit('message:user', message);
  
  logger.info(`用户消息: ${content.substring(0, 50)}...`);
  res.json(message);
});

// 启动开发流程
app.post('/api/sessions/:id/flow/start', async (req, res) => {
  const sessionId = req.params.id;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: '会话不存在' });
  }
  
  try {
    io.emit('flow:started', { sessionId, timestamp: new Date() });
    await flowService.executeFlow(sessionId);
    res.json({ status: 'completed', sessionId });
  } catch (error) {
    logger.error(`流程执行失败: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// 获取流程状态
app.get('/api/sessions/:id/flow/status', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  res.json({
    sessionId: session.id,
    currentStep: session.currentStep,
    status: session.status
  });
});

// 调用 AIAgent
app.post('/api/agent/invoke', async (req, res) => {
  const { prompt, context } = req.body;
  
  try {
    const response = await agentService.invoke(prompt, context);
    res.json(response);
  } catch (error) {
    logger.error(`Agent 调用失败: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ==================== WebSocket 处理 ====================

io.on('connection', (socket) => {
  logger.info('客户端连接:', socket.id);
  
  // 加入会话房间
  socket.on('join:session', (sessionId) => {
    socket.join(sessionId);
    logger.info(`Socket ${socket.id} 加入会话 ${sessionId}`);
  });
  
  // 发送用户消息
  socket.on('message:user', async (data) => {
    const { sessionId, content } = data;
    
    if (!sessions.has(sessionId)) {
      socket.emit('error', { message: '会话不存在' });
      return;
    }
    
    const message = {
      id: uuidv4(),
      sessionId,
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    messages.get(sessionId).push(message);
    io.to(sessionId).emit('message:user', message);
    
    // 自动触发 Agent 响应（简化版）
    setTimeout(async () => {
      try {
        const agentResponse = await agentService.invoke(content, { sessionId });
        const agentMessage = {
          id: uuidv4(),
          sessionId,
          type: 'agent',
          content: agentResponse.content,
          timestamp: new Date()
        };
        messages.get(sessionId).push(agentMessage);
        io.to(sessionId).emit('message:agent', agentMessage);
      } catch (error) {
        logger.error(`Agent 响应失败: ${error.message}`);
      }
    }, 1000);
  });
  
  // 手动触发流程
  socket.on('flow:start', async (sessionId) => {
    try {
      await flowService.executeFlow(sessionId);
    } catch (error) {
      socket.emit('flow:error', { message: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    logger.info(`客户端断开: ${socket.id}`);
  });
});

// ==================== 错误处理 ====================

app.use((err, req, res, next) => {
  logger.error('服务器错误:', err);
  res.status(500).json({ error: '内部服务器错误' });
});

// ==================== 启动服务器 ====================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`服务器启动于端口 ${PORT}`);
  logger.info(`访问地址：http://localhost:${PORT}`);
  logger.info(`工作目录：${process.cwd()}`);
});

module.exports = { app, server, io };
