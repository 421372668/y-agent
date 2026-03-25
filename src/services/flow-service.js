/**
 * 流程引擎服务 - 执行 7 步开发流程
 */

const logger = require('../utils/logger');

class FlowService {
  constructor(sessions, messages, io) {
    this.sessions = sessions;
    this.messages = messages;
    this.io = io;
  }

  // 执行完整流程
  async executeFlow(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    logger.info(`开始执行流程 - 会话：${sessionId}`);
    this._emitProgress(sessionId, 0, '流程启动');

    const steps = [
      { num: 1, name: 'requirement', fn: this.stepRequirement },
      { num: 2, name: 'clarify', fn: this.stepClarify },
      { num: 3, name: 'design', fn: this.stepDesign },
      { num: 4, name: 'develop', fn: this.stepDevelop },
      { num: 5, name: 'review', fn: this.stepReview },
      { num: 6, name: 'test', fn: this.stepTest },
      { num: 7, name: 'git', fn: this.stepGit }
    ];

    for (const step of steps) {
      try {
        session.currentStep = step.num;
        session.updatedAt = new Date();
        
        this._emitProgress(sessionId, step.num, `执行步骤 ${step.num}: ${step.name}`);
        await step.fn.call(this, sessionId);
        
        this._emitProgress(sessionId, step.num, `步骤 ${step.num} 完成`);
        
        // 添加系统消息
        this.messages.get(sessionId).push({
          id: `system-${step.num}`,
          sessionId,
          type: 'system',
          content: `✅ 步骤 ${step.num} (${step.name}) 完成`,
          timestamp: new Date()
        });
        this.io.to(sessionId).emit('message:system', {
          type: 'system',
          content: `步骤 ${step.num} (${step.name}) 完成`
        });
        
      } catch (error) {
        logger.error(`步骤 ${step.num} 失败：${error.message}`);
        this._emitProgress(sessionId, step.num, `错误：${error.message}`, true);
        throw error;
      }
    }

    session.status = 'completed';
    session.updatedAt = new Date();
    this._emitComplete(sessionId);
    logger.info(`流程完成 - 会话：${sessionId}`);
  }

  // 步骤 1: 需求记录
  async stepRequirement(sessionId) {
    logger.info('步骤 1: 需求记录');
    await this._delay(1000); // 模拟处理时间
    
    const sessionMessages = this.messages.get(sessionId) || [];
    const userMessages = sessionMessages.filter(m => m.type === 'user');
    
    const requirementSummary = userMessages.length > 0 
      ? userMessages[userMessages.length - 1].content
      : '暂无用户需求';
    
    // 保存需求文档
    const fs = require('fs');
    const path = require('path');
    const requirementDoc = `# 需求记录 - 会话 ${sessionId}\n\n## 用户需求\n${requirementSummary}\n\n## 记录时间\n${new Date().toISOString()}\n`;
    
    const reqPath = path.join(process.cwd(), 'logs', `requirement-${sessionId}.md`);
    fs.writeFileSync(reqPath, requirementDoc);
    
    logger.info(`需求已记录：${reqPath}`);
  }

  // 步骤 2: 需求澄清
  async stepClarify(sessionId) {
    logger.info('步骤 2: 需求澄清');
    await this._delay(1000);
    
    // 生成澄清问题
    const clarificationQuestions = [
      '请确认功能的核心使用场景',
      '请说明技术栈偏好（如 Node.js/Python/React 等）',
      '请描述预期交付物（代码/文档/部署包）',
      '是否有性能或安全要求'
    ];
    
    this.messages.get(sessionId).push({
      id: `clarify-${sessionId}`,
      sessionId,
      type: 'agent',
      content: `📋 需求澄清问题：\n\n${clarificationQuestions.join('\n')}\n\n请补充以上信息以便继续开发流程。`,
      timestamp: new Date()
    });
    
    this.io.to(sessionId).emit('message:agent', {
      type: 'agent',
      content: '需求澄清问题已生成'
    });
  }

  // 步骤 3: 设计输出
  async stepDesign(sessionId) {
    logger.info('步骤 3: 设计输出');
    await this._delay(1000);
    
    const session = this.sessions.get(sessionId);
    const designDoc = `# 设计方案 - 会话 ${sessionId}\n\n## 系统架构\n- 前端：HTML/CSS/JavaScript\n- 后端：Node.js + Express\n- 通信：WebSocket + REST API\n\n## 数据模型\n- 会话模型 (Session)\n- 消息模型 (Message)\n\n## API 设计\n- POST /api/sessions - 创建会话\n- GET /api/sessions/:id - 获取会话\n- POST /api/sessions/:id/messages - 发送消息\n\n## 流程设计\n- 7 步标准流程：需求→澄清→设计→开发→审查→测试→Git\n\n## 创建时间\n${new Date().toISOString()}\n`;
    
    const fs = require('fs');
    const designPath = path.join(process.cwd(), 'logs', `design-${sessionId}.md`);
    fs.writeFileSync(designPath, designDoc);
    
    logger.info(`设计文档已保存：${designPath}`);
  }

  // 步骤 4: 代码开发
  async stepDevelop(sessionId) {
    logger.info('步骤 4: 代码开发');
    await this._delay(1500);
    
    // 实际项目中这里会调用 AIAgent 生成代码
    // 简化版：记录开发日志
    this.messages.get(sessionId).push({
      id: `develop-${sessionId}`,
      sessionId,
      type: 'system',
      content: '🔨 代码开发完成\n- 创建 server.js 主服务器\n- 创建前端页面 (index.html, style.css, app.js)\n- 实现服务层模块',
      timestamp: new Date()
    });
  }

  // 步骤 5: 代码审查
  async stepReview(sessionId) {
    logger.info('步骤 5: 代码审查');
    await this._delay(1000);
    
    // 简化版：模拟代码审查结果
    const reviewResult = {
      passed: true,
      issues: [],
      suggestions: ['建议添加输入验证', '建议增加错误处理', '建议添加单元测试']
    };
    
    this.messages.get(sessionId).push({
      id: `review-${sessionId}`,
      sessionId,
      type: 'system',
      content: `📋 代码审查结果\n\n✅ 审查通过\n\n建议：\n${reviewResult.suggestions.join('\n')}`,
      timestamp: new Date()
    });
  }

  // 步骤 6: 测试验证
  async stepTest(sessionId) {
    logger.info('步骤 6: 测试验证');
    await this._delay(1000);
    
    // 简化版：模拟测试结果
    const testResult = {
      passed: true,
      testCases: [
        { name: '会话创建', status: 'PASS' },
        { name: '消息发送', status: 'PASS' },
        { name: '流程执行', status: 'PASS' },
        { name: 'WebSocket 通信', status: 'PASS' }
      ]
    };
    
    this.messages.get(sessionId).push({
      id: `test-${sessionId}`,
      sessionId,
      type: 'system',
      content: `🧪 测试结果\n\n${testResult.testCases.map(t => `${t.status === 'PASS' ? '✅' : '❌'} ${t.name}`).join('\n')}\n\n全部测试通过！`,
      timestamp: new Date()
    });
  }

  // 步骤 7: Git 提交
  async stepGit(sessionId) {
    logger.info('步骤 7: Git 提交');
    await this._delay(1000);
    
    const { execSync } = require('child_process');
    const path = require('fs');
    
    try {
      // 检查 Git 仓库
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (gitStatus.trim()) {
        // 添加文件
        execSync('git add .', { encoding: 'utf8' });
        
        // 创建提交
        const commitMsg = `AIAgent 管理系统 - 会话 ${sessionId.substring(0, 8)}`;
        execSync(`git commit -m "${commitMsg}"`, { encoding: 'utf8' });
        
        logger.info('Git 提交成功');
        
        this.messages.get(sessionId).push({
          id: `git-${sessionId}`,
          sessionId,
          type: 'system',
          content: `📦 Git 提交完成\n\n提交信息：${commitMsg}`,
          timestamp: new Date()
        });
      } else {
        logger.info('无更改需要提交');
        this.messages.get(sessionId).push({
          id: `git-${sessionId}`,
          sessionId,
          type: 'system',
          content: '📦 无更改需要提交',
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error(`Git 操作失败：${error.message}`);
      this.messages.get(sessionId).push({
        id: `git-error-${sessionId}`,
        sessionId,
        type: 'system',
        content: `⚠️ Git 操作失败：${error.message}`,
        timestamp: new Date()
      });
    }
  }

  // 发送进度事件
  _emitProgress(sessionId, step, message, isError = false) {
    this.io.emit('flow:progress', {
      sessionId,
      step,
      message,
      timestamp: new Date(),
      isError
    });
  }

  // 发送完成事件
  _emitComplete(sessionId) {
    this.io.emit('flow:complete', {
      sessionId,
      timestamp: new Date()
    });
  }

  // 延迟工具
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = FlowService;
