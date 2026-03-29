/**团队成员
 * 可以创建一个成员的实例，该实例包含成员的名称、类型、任务函数、执行频率。
 * 成员具有以下方法：
 * - getName()：返回成员的名称。
 * - getType()：返回成员的类型。
 * - setName(name)：设置成员的名称。
 * - setType(type)：设置成员的类型。
 * - run()：运行成员，成员运行后采用异步线程运行一个任务函数，每隔一段时间执行一次。
 * - stop()：停止成员的运行。
 * - isRunning()：返回成员是否正在运行。
 * - setTask(task)：设置成员的任务函数。
 * - setFrequency(frequency)：设置成员的执行频率。
 */

// 支持的成员类型
const MEMBER_TYPES = ['pm', 'developer', 'tester', 'designer', 'reviewer', 'other'];

// 默认执行频率（毫秒）
const DEFAULT_FREQUENCY = 60000; // 1分钟

/**
 * 成员类
 * 用于创建可周期性执行任务的成员实例
 */
export class Member {
  /**
   * 创建成员实例
   * @param {string} name 成员名称
   * @param {string} type 成员类型
   * @param {Function} task 任务函数
   * @param {number} frequency 执行频率（毫秒）
   */
  constructor(name, type = 'developer', task = null, frequency = DEFAULT_FREQUENCY) {
    this._name = name;
    this._type = type;
    this._task = task;
    this._frequency = frequency;
    this._running = false;
    this._timerId = null;
    this._lastExecutionTime = null;
    this._executionCount = 0;
  }

  /**
   * 获取成员名称
   * @returns {string} 成员名称
   */
  getName() {
    return this._name;
  }

  /**
   * 设置成员名称
   * @param {string} name 成员名称
   */
  setName(name) {
    this._name = name;
  }

  /**
   * 获取成员类型
   * @returns {string} 成员类型
   */
  getType() {
    return this._type;
  }

  /**
   * 设置成员类型
   * @param {string} type 成员类型
   */
  setType(type) {
    this._type = type;
  }

  /**
   * 设置任务函数
   * @param {Function} task 任务函数
   */
  setTask(task) {
    if (typeof task !== 'function') {
      throw new Error('任务必须是一个函数');
    }
    this._task = task;
  }

  /**
   * 设置执行频率
   * @param {number} frequency 执行频率（毫秒）
   */
  setFrequency(frequency) {
    if (typeof frequency !== 'number' || frequency <= 0) {
      throw new Error('执行频率必须是一个正数（毫秒）');
    }
    this._frequency = frequency;
    
    // 如果正在运行，重启定时器以应用新频率
    if (this._running) {
      this.stop();
      this.run();
    }
  }

  /**
   * 获取执行频率
   * @returns {number} 执行频率（毫秒）
   */
  getFrequency() {
    return this._frequency;
  }

  /**
   * 运行成员
   * 开始周期性执行任务函数
   * @returns {boolean} 是否成功启动
   */
  run() {
    if (this._running) {
      console.log(`成员 "${this._name}" 已在运行中`);
      return false;
    }

    if (!this._task) {
      console.log(`成员 "${this._name}" 没有设置任务函数`);
      return false;
    }

    this._running = true;
    
    // 立即执行一次
    this._executeTask();
    
    // 设置定时器
    this._timerId = setInterval(() => {
      this._executeTask();
    }, this._frequency);

    console.log(`成员 "${this._name}" 开始运行，执行频率: ${this._frequency}ms`);
    return true;
  }

  /**
   * 执行任务
   * @private
   */
  async _executeTask() {
    try {
      this._lastExecutionTime = new Date();
      this._executionCount++;
      await this._task();
    } catch (error) {
      console.error(`成员 "${this._name}" 执行任务失败:`, error.message);
    }
  }

  /**
   * 停止成员运行
   * @returns {boolean} 是否成功停止
   */
  stop() {
    if (!this._running) {
      console.log(`成员 "${this._name}" 未在运行`);
      return false;
    }

    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }

    this._running = false;
    console.log(`成员 "${this._name}" 已停止运行`);
    return true;
  }

  /**
   * 检查成员是否正在运行
   * @returns {boolean} 是否正在运行
   */
  isRunning() {
    return this._running;
  }

  /**
   * 获取成员状态信息
   * @returns {object} 状态信息
   */
  getStatus() {
    return {
      name: this._name,
      type: this._type,
      running: this._running,
      frequency: this._frequency,
      lastExecutionTime: this._lastExecutionTime,
      executionCount: this._executionCount
    };
  }
}

// 成员实例管理器（用于 CLI 命令）
class MemberManager {
  constructor() {
    this._members = new Map();
  }

  /**
   * 创建成员实例
   * @param {string} name 成员名称
   * @param {string} type 成员类型
   * @param {number} frequency 执行频率
   * @returns {Member} 成员实例
   */
  create(name, type = 'developer', frequency = DEFAULT_FREQUENCY) {
    if (this._members.has(name)) {
      throw new Error(`成员 "${name}" 已存在`);
    }

    const member = new Member(name, type, null, frequency);
    this._members.set(name, member);
    return member;
  }

  /**
   * 获取成员实例
   * @param {string} name 成员名称
   * @returns {Member|undefined} 成员实例
   */
  get(name) {
    return this._members.get(name);
  }

  /**
   * 删除成员实例
   * @param {string} name 成员名称
   * @returns {boolean} 是否成功删除
   */
  delete(name) {
    const member = this._members.get(name);
    if (member && member.isRunning()) {
      member.stop();
    }
    return this._members.delete(name);
  }

  /**
   * 获取所有成员
   * @returns {Array<Member>} 成员列表
   */
  getAll() {
    return Array.from(this._members.values());
  }

  /**
   * 获取所有成员状态
   * @returns {Array<object>} 成员状态列表
   */
  getAllStatus() {
    return this.getAll().map(member => member.getStatus());
  }
}

// 全局成员管理器实例
const memberManager = new MemberManager();

// ==================== CLI 命令接口 ====================

/**
 * 创建成员
 * @param {string} name 成员名称
 * @param {string} type 成员类型
 * @param {number} frequency 执行频率（毫秒）
 * @returns {object} 操作结果
 */
export function create(name, type = 'developer', frequency = DEFAULT_FREQUENCY) {
  if (!name) {
    return { status: false, message: '成员名称不能为空' };
  }

  if (!MEMBER_TYPES.includes(type)) {
    return { status: false, message: `无效的成员类型 "${type}"，支持的类型: ${MEMBER_TYPES.join(', ')}` };
  }

  const freq = parseInt(frequency, 10);
  if (isNaN(freq) || freq <= 0) {
    return { status: false, message: '执行频率必须是一个正整数（毫秒）' };
  }

  try {
    const member = memberManager.create(name, type, freq);
    return { 
      status: true, 
      message: `成员 "${name}" 创建成功`,
      data: member.getStatus()
    };
  } catch (error) {
    return { status: false, message: error.message };
  }
}

/**
 * 删除成员
 * @param {string} name 成员名称
 * @returns {object} 操作结果
 */
export function deleteMember(name) {
  if (!name) {
    return { status: false, message: '成员名称不能为空' };
  }

  if (!memberManager.get(name)) {
    return { status: false, message: `成员 "${name}" 不存在` };
  }

  memberManager.delete(name);
  return { status: true, message: `成员 "${name}" 删除成功` };
}

// delete 是保留字，创建别名导出
export { deleteMember as delete };

/**
 * 启动成员运行
 * @param {string} name 成员名称
 * @returns {object} 操作结果
 */
export function start(name) {
  if (!name) {
    return { status: false, message: '成员名称不能为空' };
  }

  const member = memberManager.get(name);
  if (!member) {
    return { status: false, message: `成员 "${name}" 不存在` };
  }

  // 创建一个默认任务（示例任务）
  if (!member._task) {
    member.setTask(async () => {
      console.log(`[${new Date().toISOString()}] 成员 "${name}" 执行任务 #${member._executionCount}`);
    });
  }

  const success = member.run();
  return { 
    status: success, 
    message: success ? `成员 "${name}" 开始运行` : `成员 "${name}" 启动失败`,
    data: member.getStatus()
  };
}

/**
 * 停止成员运行
 * @param {string} name 成员名称
 * @returns {object} 操作结果
 */
export function stop(name) {
  if (!name) {
    return { status: false, message: '成员名称不能为空' };
  }

  const member = memberManager.get(name);
  if (!member) {
    return { status: false, message: `成员 "${name}" 不存在` };
  }

  const success = member.stop();
  return { 
    status: success, 
    message: success ? `成员 "${name}" 已停止` : `成员 "${name}" 停止失败`,
    data: member.getStatus()
  };
}

/**
 * 查看成员状态
 * @param {string} name 成员名称
 * @returns {object} 操作结果
 */
export function status(name) {
  if (!name) {
    return { status: false, message: '成员名称不能为空' };
  }

  const member = memberManager.get(name);
  if (!member) {
    return { status: false, message: `成员 "${name}" 不存在` };
  }

  return { 
    status: true, 
    message: `成员 "${name}" 状态`,
    data: member.getStatus()
  };
}

/**
 * 列出所有成员
 * @returns {object} 操作结果
 */
export function list() {
  const members = memberManager.getAllStatus();
  
  if (members.length === 0) {
    return { status: true, message: '暂无成员实例', data: [] };
  }

  return { 
    status: true, 
    message: `共有 ${members.length} 个成员实例`,
    data: members
  };
}

/**
 * 设置成员执行频率
 * @param {string} name 成员名称
 * @param {number} frequency 执行频率（毫秒）
 * @returns {object} 操作结果
 */
export function setFrequency(name, frequency) {
  if (!name) {
    return { status: false, message: '成员名称不能为空' };
  }

  const freq = parseInt(frequency, 10);
  if (isNaN(freq) || freq <= 0) {
    return { status: false, message: '执行频率必须是一个正整数（毫秒）' };
  }

  const member = memberManager.get(name);
  if (!member) {
    return { status: false, message: `成员 "${name}" 不存在` };
  }

  member.setFrequency(freq);
  return { 
    status: true, 
    message: `成员 "${name}" 执行频率已设置为 ${freq}ms`,
    data: member.getStatus()
  };
}

/**
 * 设置成员类型
 * @param {string} name 成员名称
 * @param {string} type 成员类型
 * @returns {object} 操作结果
 */
export function setType(name, type) {
  if (!name) {
    return { status: false, message: '成员名称不能为空' };
  }

  if (!MEMBER_TYPES.includes(type)) {
    return { status: false, message: `无效的成员类型 "${type}"，支持的类型: ${MEMBER_TYPES.join(', ')}` };
  }

  const member = memberManager.get(name);
  if (!member) {
    return { status: false, message: `成员 "${name}" 不存在` };
  }

  member.setType(type);
  return { 
    status: true, 
    message: `成员 "${name}" 类型已设置为 "${type}"`,
    data: member.getStatus()
  };
}

/**
 * 显示帮助信息
 */
export function help() {
  console.log(`
成员管理命令 (member)

用法: yxkj member <command> [options]

命令:
  create <name> [type] [frequency]  创建成员实例
  delete <name>                     删除成员实例
  start <name>                      启动成员运行
  stop <name>                       停止成员运行
  status <name>                     查看成员状态
  list                              列出所有成员
  set-frequency <name> <frequency>  设置执行频率（毫秒）
  set-type <name> <type>            设置成员类型
  help                              显示帮助信息

成员类型 (type):
  pm          项目经理
  developer   开发人员 (默认)
  tester      测试人员
  designer    设计人员
  reviewer    审核人员
  other       其他

示例:
  yxkj member create agent1 developer 5000
  yxkj member start agent1
  yxkj member status agent1
  yxkj member set-frequency agent1 10000
  yxkj member stop agent1
  yxkj member list
  yxkj member delete agent1
`);
}

export default {
  Member,
  create,
  deleteMember,
  delete: deleteMember,
  start,
  stop,
  status,
  list,
  setFrequency,
  setType,
  help
};
