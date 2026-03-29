import { executeTodo } from './other.js';

/**
 * Designer（设计人员）角色任务
 * @param {object} runtimeInfo - 运行时信息
 * @param {object} member - 成员实例
 */
export async function run(runtimeInfo, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Designer "${memberName}" 执行设计任务 #${executionCount}`);
  
  if (!runtimeInfo || !runtimeInfo.database) {
    console.warn(`[${now}] Designer "${memberName}" 无法访问数据库`);
    return;
  }
  
  const database = runtimeInfo.database;
  const teamName = runtimeInfo.teamName || 'unknown';
  
  // 查询自己的待办
  const myTodos = database.getTodos(memberName, 'pending');
  
  if (myTodos.length === 0) {
    console.log(`[${now}] Designer "${memberName}" 没有待处理的待办`);
    return;
  }
  
  // 执行第一个待办
  const todo = myTodos[0];
  const result = await executeTodo(runtimeInfo, member, todo);
  
  // 执行完待办后创建 developer 的待办
  const developerName = `${teamName}_developer`;
  const newTodoTitle = `开发实现: ${todo.title}`;
  const newTodoDesc = `根据设计文档实现: ${todo.description}`;
  
  database.addTodo(
    developerName,
    'developer',
    newTodoTitle,
    newTodoDesc,
    todo.priority || 2
  );
  
  console.log(`[${now}] Designer "${memberName}" 创建待办: "${newTodoTitle}" 分配给 ${developerName}`);
  
  database.addWorkLog(
    memberName,
    'designer',
    'create_todo',
    JSON.stringify({ title: newTodoTitle, assignee: developerName, fromTodo: todo.id })
  );
}

export default { run };
