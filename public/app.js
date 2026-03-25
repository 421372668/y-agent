/**
 * AIAgent 管理系统 - 前端客户端逻辑
 */

// 全局状态
let currentSessionId = null;
let socket = null;
let sessions = [];

// DOM 元素
const newSessionBtn = document.getElementById('newSessionBtn');
const startFlowBtn = document.getElementById('startFlowBtn');
const sessionList = document.getElementById('sessionList');
const currentSessionTitle = document.getElementById('currentSessionTitle');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const flowLog = document.getElementById('flowLog');

// 初始化 Socket.IO
function initSocket() {
  socket = io();
  
  socket.on('connect', () => {
    console.log('Socket 连接成功');
    logToFlow('已连接到服务器', 'info');
  });
  
  socket.on('message:user', (message) => {
    addMessageToChat(message);
  });
  
  socket.on('message:agent', (message) => {
    addMessageToChat(message);
  });
  
  socket.on('flow:started', (data) => {
    logToFlow(`流程启动：${data.sessionId}`, 'info');
  });
  
  socket.on('flow:progress', (data) => {
    updateFlowStatus(data.step);
    logToFlow(`步骤 ${data.step}: ${data.message}`, 'info');
  });
  
  socket.on('flow:complete', (data) => {
    updateFlowStatus(7);
    logToFlow('流程完成！', 'success');
    addSystemMessage('开发流程已完成！');
  });
  
  socket.on('flow:error', (data) => {
    logToFlow(`流程错误：${data.message}`, 'error');
    addSystemMessage(`流程错误：${data.message}`);
  });
  
  socket.on('error', (data) => {
    console.error('Socket 错误:', data);
    addSystemMessage(`错误：${data.message}`);
  });
}

// 加载会话列表
async function loadSessions() {
  try {
    const response = await fetch('/api/sessions');
    sessions = await response.json();
    renderSessionList();
  } catch (error) {
    console.error('加载会话失败:', error);
  }
}

// 渲染会话列表
function renderSessionList() {
  sessionList.innerHTML = '';
  sessions.forEach(session => {
    const li = document.createElement('li');
    li.dataset.sessionId = session.id;
    li.innerHTML = `
      <div>会话 ${session.id.substring(0, 8)}...</div>
      <div class="session-id">步骤：${session.currentStep}/7</div>
    `;
    if (session.id === currentSessionId) {
      li.classList.add('active');
    }
    li.addEventListener('click', () => selectSession(session.id));
    sessionList.appendChild(li);
  });
}

// 选择会话
async function selectSession(sessionId) {
  currentSessionId = sessionId;
  
  // 更新 UI
  currentSessionTitle.textContent = `会话：${sessionId.substring(0, 8)}...`;
  startFlowBtn.disabled = false;
  messageInput.disabled = false;
  sendBtn.disabled = false;
  
  // 加入 Socket 房间
  socket.emit('join:session', sessionId);
  
  // 更新会话列表高亮
  renderSessionList();
  
  // 加载消息历史
  await loadMessages(sessionId);
}

// 加载消息历史
async function loadMessages(sessionId) {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/messages`);
    const messages = await response.json();
    messagesContainer.innerHTML = '';
    messages.forEach(msg => addMessageToChat(msg));
  } catch (error) {
    console.error('加载消息失败:', error);
  }
}

// 创建新会话
async function createNewSession() {
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const session = await response.json();
    sessions.push(session);
    renderSessionList();
    selectSession(session.id);
    logToFlow(`新会话创建：${session.id.substring(0, 8)}...`, 'info');
  } catch (error) {
    console.error('创建会话失败:', error);
  }
}

// 发送消息
async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || !currentSessionId) return;
  
  try {
    const response = await fetch(`/api/sessions/${currentSessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const message = await response.json();
    addMessageToChat(message);
    messageInput.value = '';
  } catch (error) {
    console.error('发送消息失败:', error);
  }
}

// 添加消息到聊天
function addMessageToChat(message) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${message.type}`;
  
  const typeLabel = message.type === 'user' ? '👤 您' : 
                    message.type === 'agent' ? '🤖 Agent' : '⚙️ 系统';
  
  const time = new Date(message.timestamp).toLocaleTimeString();
  
  msgDiv.innerHTML = `
    <div class="message-content">${escapeHtml(message.content)}</div>
    <div class="message-meta">${typeLabel} · ${time}</div>
  `;
  
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 添加系统消息
function addSystemMessage(content) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message system';
  msgDiv.innerHTML = `
    <div class="message-content">${escapeHtml(content)}</div>
  `;
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 启动开发流程
async function startFlow() {
  if (!currentSessionId) return;
  
  startFlowBtn.disabled = true;
  logToFlow('启动 7 步开发流程...', 'info');
  
  try {
    const response = await fetch(`/api/sessions/${currentSessionId}/flow/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    if (result.status === 'completed') {
      logToFlow('流程执行完成！', 'success');
    }
  } catch (error) {
    console.error('启动流程失败:', error);
    logToFlow(`流程启动失败：${error.message}`, 'error');
  } finally {
    startFlowBtn.disabled = false;
  }
}

// 更新流程状态
function updateFlowStatus(currentStep) {
  document.querySelectorAll('.flow-step').forEach(step => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.remove('active', 'completed');
    
    if (stepNum < currentStep) {
      step.classList.add('completed');
    } else if (stepNum === currentStep) {
      step.classList.add('active');
    }
  });
}

// 记录到流程日志
function logToFlow(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `flow-log-entry ${type}`;
  const time = new Date().toLocaleTimeString();
  entry.textContent = `[${time}] ${message}`;
  flowLog.appendChild(entry);
  flowLog.scrollTop = flowLog.scrollHeight;
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 事件绑定
newSessionBtn.addEventListener('click', createNewSession);
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
startFlowBtn.addEventListener('click', startFlow);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  loadSessions();
});
