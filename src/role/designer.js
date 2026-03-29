/**
 * Designer（设计人员）角色任务
 * @param {object} runtimeInfo - 运行时信息（包含 team, database, members, startTime, frequency, teamName）
 * @param {object} member - 成员实例
 */
export async function run(runtimeInfo, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Designer "${memberName}" 执行设计任务 #${executionCount}`);
  
  // Designer 可以执行的设计任务示例：
  // 1. UI/UX 设计
  // 2. 原型制作
  // 3. 设计评审
  // 4. 设计文档编写
  
  if (runtimeInfo && runtimeInfo.team) {
    const teamName = runtimeInfo.team.getName ? runtimeInfo.team.getName() : runtimeInfo.teamName;
    console.log(`[${now}] Designer "${memberName}" 正在为团队 "${teamName}" 进行设计`);
  }
}

export default { run };
