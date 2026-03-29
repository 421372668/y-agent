/**
 * 执行待办任务（统一执行函数）
 * @param {object} runtimeInfo - 运行时信息
 * @param {object} member - 成员实例
 * @param {object} todo - 待办对象
 * @returns {object} 执行结果 { success: boolean, message: string }
 */
export async function executeTodo(runtimeInfo, member, todo) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const database = runtimeInfo?.database;
  
  if (!todo) {
    return { success: false, message: '没有待办可执行' };
  }
  
  console.log(`[${now}] ${memberName} 开始执行待办: "${todo.title}"`);
  
  // 模拟执行过程（实际项目中这里可以调用具体的任务处理器）
  const executionResult = {
    success: true,
    message: `待办 "${todo.title}" 执行完成`,
    completedAt: now
  };
  
  // 更新待办状态为已完成
  if (database) {
    database.updateTodoStatus(todo.id, 'completed');
    database.addWorkLog(
      memberName,
      member.getType(),
      'complete_todo',
      JSON.stringify({ todoId: todo.id, title: todo.title, result: executionResult })
    );
  }
  
  console.log(`[${now}] ${memberName} 完成待办: "${todo.title}"`);
  
  return executionResult;
}

/**
 * Other（其他角色）任务
 * @param {object} runtimeInfo - 运行时信息
 * @param {object} member - 成员实例
 */
export async function run(runtimeInfo, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Member "${memberName}" 执行通用任务 #${executionCount}`);
  
  if (!runtimeInfo || !runtimeInfo.database) {
    console.warn(`[${now}] Member "${memberName}" 无法访问数据库`);
    return;
  }
  
  const database = runtimeInfo.database;
  const teamName = runtimeInfo.teamName || 'unknown';
  
  // 查询自己的待办
  const myTodos = database.getTodos(memberName, 'pending');
  
  if (myTodos.length === 0) {
    console.log(`[${now}] Member "${memberName}" 没有待处理的待办`);
    return;
  }
  
  // 执行第一个待办
  const todo = myTodos[0];
  await executeTodo(runtimeInfo, member, todo);
}

export default { run, executeTodo };
