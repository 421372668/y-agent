/**
 * Tester（测试人员）角色任务
 * @param {object} runtimeInfo - 运行时信息（包含 team, database, members, startTime, frequency, teamName）
 * @param {object} member - 成员实例
 */
export async function run(runtimeInfo, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Tester "${memberName}" 执行测试任务 #${executionCount}`);
  
  // Tester 可以执行的测试任务示例：
  // 1. 执行测试用例
  // 2. 回归测试
  // 3. 性能测试
  // 4. 报告 Bug
  
  if (runtimeInfo && runtimeInfo.team) {
    const teamName = runtimeInfo.team.getName ? runtimeInfo.team.getName() : runtimeInfo.teamName;
    console.log(`[${now}] Tester "${memberName}" 正在为团队 "${teamName}" 执行测试`);
  }
}

export default { run };
