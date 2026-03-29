/**
 * Developer（开发人员）角色任务
 * @param {object} runtimeInfo - 运行时信息（包含 team, database, members, startTime, frequency, teamName）
 * @param {object} member - 成员实例
 */
export async function run(runtimeInfo, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Developer "${memberName}" 执行开发任务 #${executionCount}`);
  
  // Developer 可以执行的开发任务示例：
  // 1. 编写代码
  // 2. 修复 Bug
  // 3. 代码重构
  // 4. 单元测试
  
  if (runtimeInfo && runtimeInfo.team) {
    const teamName = runtimeInfo.team.getName ? runtimeInfo.team.getName() : runtimeInfo.teamName;
    console.log(`[${now}] Developer "${memberName}" 正在为团队 "${teamName}" 开发功能`);
  }
}

export default { run };
