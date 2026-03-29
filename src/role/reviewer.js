/**
 * Reviewer（审核人员）角色任务
 * @param {object} team - 团队实例
 * @param {object} member - 成员实例
 */
export async function run(team, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Reviewer "${memberName}" 执行审核任务 #${executionCount}`);
  
  // Reviewer 可以执行的审核任务示例：
  // 1. 代码审核
  // 2. 设计审核
  // 3. 文档审核
  // 4. 质量检查
  
  if (team) {
    const teamName = team.getName ? team.getName() : 'unknown';
    console.log(`[${now}] Reviewer "${memberName}" 正在为团队 "${teamName}" 进行审核`);
  }
}

export default { run };
