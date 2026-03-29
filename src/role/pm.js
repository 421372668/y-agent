/**
 * PM（项目经理）角色任务
 * @param {object} runtimeInfo - 运行时信息（包含 team, database, members, startTime, frequency, teamName）
 * @param {object} member - 成员实例
 */
export async function run(runtimeInfo, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] PM "${memberName}" 执行项目管理任务 #${executionCount}`);
  
  // PM 可以执行的项目管理任务示例：
  // 1. 检查项目进度
  // 2. 分配任务
  // 3. 协调资源
  // 4. 更新项目状态
  
  if (runtimeInfo && runtimeInfo.team) {
    // 可以访问团队信息
    const teamName = runtimeInfo.team.getName ? runtimeInfo.team.getName() : runtimeInfo.teamName;
    console.log(`[${now}] PM "${memberName}" 正在管理团队 "${teamName}"`);
  }
}

export default { run };
