/**
 * Tester（测试人员）角色任务
 * @param {object} team - 团队实例
 * @param {object} member - 成员实例
 */
export async function run(team, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Tester "${memberName}" 执行测试任务 #${executionCount}`);
  
  // Tester 可以执行的测试任务示例：
  // 1. 执行测试用例
  // 2. 回归测试
  // 3. 性能测试
  // 4. 报告 Bug
  
  if (team) {
    const teamName = team.getName ? team.getName() : 'unknown';
    console.log(`[${now}] Tester "${memberName}" 正在为团队 "${teamName}" 执行测试`);
  }
}

export default { run };
