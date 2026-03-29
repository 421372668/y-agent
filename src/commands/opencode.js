import { createOpencode, createOpencodeClient } from '@opencode-ai/sdk';
import { spawn } from 'child_process';
import { platform } from 'os';

/**
 * OpenCode 命令模块
 * 使用 @opencode-ai/sdk 完成任务处理
 */

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  hostname: '127.0.0.1',
  port: 4096,
  timeout: 10000
};

/**
 * 检查 OpenCode 服务是否运行
 * @param {string} baseUrl - 服务地址
 * @returns {Promise<boolean>} 服务是否运行
 */
async function checkServerRunning(baseUrl) {
  try {
    // 使用 /session 端点检查服务是否运行
    const response = await fetch(`${baseUrl}/session`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 等待服务启动
 * @param {string} baseUrl - 服务地址
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<boolean>}
 */
async function waitForServer(baseUrl, timeout) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await checkServerRunning(baseUrl)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

/**
 * 在 Windows 下启动 OpenCode 服务
 * @param {object} config - 配置对象
 * @returns {Promise<object>} 子进程实例
 */
async function startServerOnWindows(config) {
  return new Promise((resolve, reject) => {
    // Windows 下使用 cmd 方式启动
    // 使用 shell 执行命令
    const command = `opencode serve --port ${config.port} --hostname ${config.hostname}`;
    const child = spawn(command, [], {
      shell: true,
      stdio: 'ignore',
      windowsHide: true
    });
    
    child.on('error', (err) => {
      reject(new Error(
        'OpenCode CLI 未安装。请先安装 OpenCode CLI:\n' +
        '  npm install -g opencode-ai\n' +
        '或访问 https://opencode.ai 获取更多信息。'
      ));
    });
    
    // 给进程时间启动
    setTimeout(() => {
      resolve(child);
    }, 2000);
  });
}

/**
 * 运行 OpenCode 任务
 * @param {string} workspace - 工作空间路径
 * @param {string} task - 任务描述
 * @param {object} options - 可选配置 { hostname, port, timeout }
 * @returns {Promise<object>} 任务执行结果
 */
export async function run(workspace, task, options = {}) {
  let opencode = null;
  let client = null;
  let serverProcess = null;
  let serverStarted = false;
  
  const config = { ...DEFAULT_CONFIG, ...options };
  const baseUrl = `http://${config.hostname}:${config.port}`;
  
  try {
    // 先检查服务是否已经运行
    const isRunning = await checkServerRunning(baseUrl);
    
    if (isRunning) {
      // 服务已运行，直接连接
      console.log(`OpenCode 服务已运行于: ${baseUrl}`);
      client = createOpencodeClient({ baseUrl });
    } else {
      // 服务未运行，启动新服务
      console.log(`OpenCode 服务未运行，正在启动...`);
      
      const isWindows = platform() === 'win32';
      
      if (isWindows) {
        // Windows 下手动启动服务
        serverProcess = await startServerOnWindows(config);
        serverStarted = true;
        
        // 等待服务启动
        const started = await waitForServer(baseUrl, config.timeout);
        if (!started) {
          throw new Error('OpenCode 服务启动超时');
        }
        
        console.log(`OpenCode 服务已启动于: ${baseUrl}`);
        client = createOpencodeClient({ baseUrl });
      } else {
        // 非 Windows 下使用 SDK 启动
        try {
          opencode = await createOpencode({
            hostname: config.hostname,
            port: config.port,
            timeout: config.timeout,
            config: {}
          });
          client = opencode.client;
          serverStarted = true;
          console.log(`OpenCode 服务已启动于: ${opencode.server.url}`);
        } catch (startError) {
          if (startError.message && startError.message.includes('ENOENT')) {
            throw new Error(
              'OpenCode CLI 未安装。请先安装 OpenCode CLI:\n' +
              '  npm install -g opencode-ai\n' +
              '或访问 https://opencode.ai 获取更多信息。'
            );
          }
          throw startError;
        }
      }
    }
    
    // 获取所有 session 列表
    const sessionsResult = await client.session.list();
    const sessions = sessionsResult.data || [];
    
    // 查找是否存在该 workspace 的 session
    let targetSession = sessions.find(s => 
      s.path === workspace || 
      s.title?.includes(workspace) ||
      s.cwd === workspace
    );
    
    if (!targetSession) {
      // 不存在则创建新 session
      console.log(`为工作空间 "${workspace}" 创建新的 Session...`);
      const createResult = await client.session.create({
        body: {
          title: `Workspace: ${workspace}`,
          cwd: workspace
        }
      });
      targetSession = createResult.data;
      console.log(`Session 创建成功: ${targetSession.id}`);
    } else {
      console.log(`找到现有 Session: ${targetSession.id}`);
    }
    
    // 发送任务提示词
    console.log(`执行任务: ${task}`);
    const promptResult = await client.session.prompt({
      path: { id: targetSession.id },
      body: {
        parts: [{ type: 'text', text: task }]
      }
    });
    
    // 提取任务结果
    const result = promptResult.data;
    
    // 获取响应内容
    let responseContent = '';
    let parts = [];
    
    if (result && result.parts) {
      parts = result.parts;
      responseContent = parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join('\n');
    }
    
    console.log(`任务执行完成`);
    
    return {
      success: true,
      sessionId: targetSession.id,
      message: responseContent,
      parts: parts,
      raw: result
    };
    
  } catch (error) {
    console.error('OpenCode 任务执行失败:', error.message);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  } finally {
    // 只有当我们启动了服务器时才关闭它
    // 如果是连接已有服务器，不要关闭
    if (serverStarted) {
      if (opencode && opencode.server) {
        console.log('关闭 OpenCode 服务...');
        opencode.server.close();
      } else if (serverProcess) {
        console.log('关闭 OpenCode 服务...');
        serverProcess.kill();
      }
    }
  }
}

/**
 * 连接到已存在的 OpenCode 服务器执行任务
 * @param {string} workspace - 工作空间路径
 * @param {string} task - 任务描述
 * @param {string} baseUrl - OpenCode 服务器地址 (默认: http://localhost:4096)
 * @returns {Promise<object>} 任务执行结果
 */
export async function runWithExistingServer(workspace, task, baseUrl = 'http://localhost:4096') {
  try {
    // 创建客户端连接到已有服务器
    const client = createOpencodeClient({ baseUrl });
    
    // 获取所有 session 列表
    const sessionsResult = await client.session.list();
    const sessions = sessionsResult.data || [];
    
    // 查找是否存在该 workspace 的 session
    let targetSession = sessions.find(s => 
      s.path === workspace || 
      s.title?.includes(workspace) ||
      s.cwd === workspace
    );
    
    if (!targetSession) {
      // 不存在则创建新 session
      console.log(`为工作空间 "${workspace}" 创建新的 Session...`);
      const createResult = await client.session.create({
        body: {
          title: `Workspace: ${workspace}`,
          cwd: workspace
        }
      });
      targetSession = createResult.data;
      console.log(`Session 创建成功: ${targetSession.id}`);
    } else {
      console.log(`找到现有 Session: ${targetSession.id}`);
    }
    
    // 发送任务提示词
    console.log(`执行任务: ${task}`);
    const promptResult = await client.session.prompt({
      path: { id: targetSession.id },
      body: {
        parts: [{ type: 'text', text: task }]
      }
    });
    
    // 提取任务结果
    const result = promptResult.data;
    
    // 获取响应内容
    let responseContent = '';
    let parts = [];
    
    if (result && result.parts) {
      parts = result.parts;
      responseContent = parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join('\n');
    }
    
    console.log(`任务执行完成`);
    
    return {
      success: true,
      sessionId: targetSession.id,
      message: responseContent,
      parts: parts,
      raw: result
    };
    
  } catch (error) {
    console.error('OpenCode 任务执行失败:', error.message);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * 获取或创建 Session
 * @param {object} client - OpenCode 客户端
 * @param {string} workspace - 工作空间路径
 * @returns {Promise<object>} Session 对象
 */
export async function getOrCreateSession(client, workspace) {
  const sessionsResult = await client.session.list();
  const sessions = sessionsResult.data || [];
  
  let targetSession = sessions.find(s => 
    s.path === workspace || 
    s.title?.includes(workspace) ||
    s.cwd === workspace
  );
  
  if (!targetSession) {
    const createResult = await client.session.create({
      body: {
        title: `Workspace: ${workspace}`,
        cwd: workspace
      }
    });
    targetSession = createResult.data;
  }
  
  return targetSession;
}

export default { run, runWithExistingServer, getOrCreateSession };
