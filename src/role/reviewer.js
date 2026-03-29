import { executeTodo } from './other.js';

/**
 * Reviewer（审核人员）角色任务
 * @param {object} runtimeInfo - 运行时信息
 * @param {object} member - 成员实例
 */
export async function run(runtimeInfo, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Reviewer "${memberName}" 执行审核任务 #${executionCount}`);
  
  if (!runtimeInfo || !runtimeInfo.database) {
    console.warn(`[${now}] Reviewer "${memberName}" 无法访问数据库`);
    return;
  }
  
  const database = runtimeInfo.database;
  const teamName = runtimeInfo.teamName || 'unknown';
  
  // 查询自己的待办
  const myTodos = database.getTodos(memberName, 'pending');
  
  if (myTodos.length === 0) {
    console.log(`[${now}] Reviewer "${memberName}" 没有待处理的待办`);
    return;
  }
  
  // 执行第一个待办
  const todo = myTodos[0];
  const result = await executeTodo(runtimeInfo, member, todo);
  
  // 模拟审核结果（随机通过或不通过）
  const passed = Math.random() > 0.2; // 80% 通过率
  const developerName = `${teamName}_developer`;
  
  // 无论通过与否，都创建 developer 的待办
  let newTodoTitle, newTodoDesc;
  
  if (passed) {
    newTodoTitle = `审核通过: ${todo.title}`;
    newTodoDesc = `代码审核通过，可以合并: ${todo.description}`;
    console.log(`[${now}] Reviewer "${memberName}" 审核通过: "${todo.title}"`);
  } else {
    newTodoTitle = `审核不通过: ${todo.title}`;
    const reasons = [
      '代码风格不符合规范',
      '存在潜在的性能问题',
      '缺少必要的注释',
      '代码复杂度过高',
      '存在代码重复',
      '缺少单元测试覆盖'
    ];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    newTodoDesc = `审核不通过，原因: ${reason}。原待办: ${todo.description}`;
    console.log(`[${now}] Reviewer "${memberName}" 审核不通过: "${todo.title}"，原因: ${reason}`);
  }
  
  database.addTodo(
    developerName,
    'developer',
    newTodoTitle,
    newTodoDesc,
    todo.priority || 2
  );
  
  console.log(`[${now}] Reviewer "${memberName}" 创建待办: "${newTodoTitle}" 分配给 ${developerName}`);
  
  database.addWorkLog(
    memberName,
    'reviewer',
    passed ? 'review_passed' : 'review_failed',
    JSON.stringify({ 
      title: newTodoTitle, 
      assignee: developerName, 
      passed,
      fromTodo: todo.id 
    })
  );
}

export default { run };
