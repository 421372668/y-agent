/**
 * AIAgent 服务 - 调用外部 AIAgent
 */

const logger = require('../utils/logger');

class AgentService {
  constructor() {
    this.apiKey = process.env.AGENT_API_KEY || '';
    this.baseUrl = process.env.AGENT_API_URL || 'http://localhost:8080';
  }

  /**
   * 调用 AIAgent
   * @param {string} prompt - 用户提示
   * @param {object} context - 上下文信息
   * @returns {Promise<{content: string, metadata: object}>}
   */
  async invoke(prompt, context = {}) {
    logger.info(`调用 AIAgent: ${prompt.substring(0, 50)}...`);

    // 简化版：模拟 Agent 响应
    // 实际项目中这里会调用 OpenCode 或其他 Agent API
    const mockResponse = this._generateMockResponse(prompt, context);
    
    logger.info(`Agent 响应：${mockResponse.content.substring(0, 50)}...`);
    
    return mockResponse;
  }

  /**
   * 生成模拟响应（用于开发测试）
   */
  _generateMockResponse(prompt, context) {
    const responses = {
      'requirement': '我已记录您的需求。接下来将进行需求澄清。',
      'clarify': '请补充以下信息：1. 核心功能 2. 技术栈偏好 3. 交付物要求',
      'design': '设计方案已生成，包括系统架构、数据模型和 API 设计。',
      'develop': '代码开发完成，已创建所有必要文件。',
      'review': '代码审查通过，代码质量良好。',
      'test': '所有测试用例通过，功能验证完成。',
      'git': '代码已提交到 Git 仓库。'
    };

    // 根据 prompt 内容匹配响应
    let responseType = 'default';
    if (prompt.includes('需求')) responseType = 'requirement';
    else if (prompt.includes('澄清') || prompt.includes('确认')) responseType = 'clarify';
    else if (prompt.includes('设计')) responseType = 'design';
    else if (prompt.includes('开发') || prompt.includes('代码')) responseType = 'develop';
    else if (prompt.includes('审查')) responseType = 'review';
    else if (prompt.includes('测试')) responseType = 'test';
    else if (prompt.includes('git') || prompt.includes('Git') || prompt.includes('提交')) responseType = 'git';

    return {
      content: responses[responseType] || '收到您的消息，我正在处理...',
      metadata: {
        sessionId: context.sessionId,
        timestamp: new Date(),
        responseType
      }
    };
  }

  /**
   * 调用真实 Agent API（预留接口）
   */
  async _invokeRealAPI(prompt, context) {
    // 实际项目中实现真实的 API 调用
    // 例如：调用 OpenCode API、Claude API 等
    try {
      const fetch = require('node-fetch');
      const response = await fetch(`${this.baseUrl}/api/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt,
          context,
          model: 'opencode'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API 请求失败：${response.status}`);
      }
      
      const data = await response.json();
      return {
        content: data.content,
        metadata: data.metadata
      };
    } catch (error) {
      logger.error(`真实 API 调用失败：${error.message}`);
      return this._generateMockResponse(prompt, context);
    }
  }
}

module.exports = AgentService;
