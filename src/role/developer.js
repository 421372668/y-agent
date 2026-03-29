import { executeTodo } from './other.js';

/**
 * Developer（开发人员）角色任务
 * @param {object} runtimeInfo - 运行时信息
 * @param {object} member - 成员实例
 */
export async function run(runtimeInfo, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Developer "${memberName}" 执行开发任务 #${executionCount}`);
  
  if (!runtimeInfo || !runtimeInfo.database) {
    console.warn(`[${now}] Developer "${memberName}" 无法访问数据库`);
    return;
  }
  
  const database = runtimeInfo.database;
  const teamName = runtimeInfo.teamName || 'unknown';
  
  // 查询自己的待办
  const myTodos = database.getTodos(memberName, 'pending');
  
  if (myTodos.length === 0) {
    console.log(`[${now}] Developer "${memberName}" 没有待处理的待办`);
    return;
  }
  
  // 执行第一个待办
  const todo = myTodos[0];
  const result = await executeTodo(runtimeInfo, member, todo);
  
  // 执行完待办后创建 tester 和 reviewer 的待办
  const testerName = `${teamName}_tester`;
  const reviewerName = `${teamName}_reviewer`;
  
  // 创建 tester 待办
  const testerTodoTitle = `测试: ${todo.title}`;
  const testerTodoDesc = `测试开发实现: ${todo.description}`;
  
  database.addTodo(
    testerName,
    'tester',
    testerTodoTitle,
    testerTodoDesc,
    todo.priority || 2
  );
  console.log(`[${now}] Developer "${memberName}" 创建待办: "${testerTodoTitle}" 分配给 ${testerName}`);
  
  // 创建 reviewer 待办
  const reviewerTodoTitle = `代码审核: ${todo.title}`;
  const reviewerTodoDesc = `审核代码实现: ${todo.description}`;
  
  database.addTodo(
    reviewerName,
    'reviewer',
    reviewerTodoTitle,
    reviewerTodoDesc,
    todo.priority || 2
  );
  console.log(`[${now}] Developer "${memberName}" 创建待办: "${reviewerTodoTitle}" 分配给 ${reviewerName}`);
  
  database.addWorkLog(
    memberName,
    'developer',
    'create_todos',
    JSON.stringify({ 
      testerTodo: { title: testerTodoTitle, assignee: testerName },
      reviewerTodo: { title: reviewerTodoTitle, assignee: reviewerName },
      fromTodo: todo.id 
    })
  );
}

export default { run };
