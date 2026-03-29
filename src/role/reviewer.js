/**
 * Reviewer（审核人员）角色任务
 * @param {object} runtimeInfo - 运行时信息（包含 team, database, members, startTime, frequency, teamName）
 * @param {object} member - 成员实例
 */
export async function run(runtimeInfo, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Reviewer "${memberName}" 执行审核任务 #${executionCount}`);
  
  // Reviewer 可以执行的审核任务示例：
  // 1. 代码审核
  // 2. 设计审核
  // 3. 文档审核
  // 4. 质量检查
  
  if (runtimeInfo && runtimeInfo.team) {
    const teamName = runtimeInfo.team.getName ? runtimeInfo.team.getName() : runtimeInfo.teamName;
    console.log(`[${now}] Reviewer "${memberName}" 正在为团队 "${teamName}" 进行审核`);
  }
}

export default { run };
