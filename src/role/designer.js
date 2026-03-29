/**
 * Designer（设计人员）角色任务
 * @param {object} team - 团队实例
 * @param {object} member - 成员实例
 */
export async function run(team, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Designer "${memberName}" 执行设计任务 #${executionCount}`);
  
  // Designer 可以执行的设计任务示例：
  // 1. UI/UX 设计
  // 2. 原型制作
  // 3. 设计评审
  // 4. 设计文档编写
  
  if (team) {
    const teamName = team.getName ? team.getName() : 'unknown';
    console.log(`[${now}] Designer "${memberName}" 正在为团队 "${teamName}" 进行设计`);
  }
}

export default { run };
