/**
 * PM（项目经理）角色任务
 * @param {object} runtimeInfo - 运行时信息
 * @param {object} member - 成员实例
 */
export async function run(runtimeInfo, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] PM "${memberName}" 执行项目管理任务 #${executionCount}`);
  
  if (!runtimeInfo || !runtimeInfo.database) {
    console.warn(`[${now}] PM "${memberName}" 无法访问数据库`);
    return;
  }
  
  const database = runtimeInfo.database;
  const teamName = runtimeInfo.teamName || 'unknown';
  
  // 1. 查询现有待办（模拟查询）
  const pendingTodos = database.getTodos(null, 'pending');
  console.log(`[${now}] PM "${memberName}" 查询到 ${pendingTodos.length} 个待处理待办`);
  
  // 2. 模拟创建新的待办任务
  const todoTemplates = [
    { title: '需求分析', description: '分析用户需求，编写需求文档', priority: 3 },
    { title: '项目计划制定', description: '制定项目里程碑和交付计划', priority: 2 },
    { title: '资源协调', description: '协调开发、测试、设计资源', priority: 2 },
    { title: '风险评估', description: '识别项目风险并制定应对策略', priority: 1 },
    { title: '进度汇报', description: '向相关方汇报项目进度', priority: 1 }
  ];
  
  // 根据执行次数循环选择待办模板
  const template = todoTemplates[executionCount % todoTemplates.length];
  
  // PM 创建待办后分配给 designer
  const designerName = `${teamName}_designer`;
  
  // 写入新待办
  database.addTodo(
    designerName,
    'designer',
    template.title,
    template.description,
    template.priority
  );
  
  console.log(`[${now}] PM "${memberName}" 创建待办: "${template.title}" 分配给 ${designerName}`);
  
  // 记录工作日志
  database.addWorkLog(
    memberName,
    'pm',
    'create_todo',
    JSON.stringify({ title: template.title, assignee: designerName, priority: template.priority })
  );
}

export default { run };
