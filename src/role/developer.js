/**
 * Developer（开发人员）角色任务
 * @param {object} team - 团队实例
 * @param {object} member - 成员实例
 */
export async function run(team, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Developer "${memberName}" 执行开发任务 #${executionCount}`);
  
  // Developer 可以执行的开发任务示例：
  // 1. 编写代码
  // 2. 修复 Bug
  // 3. 代码重构
  // 4. 单元测试
  
  if (team) {
    const teamName = team.getName ? team.getName() : 'unknown';
    console.log(`[${now}] Developer "${memberName}" 正在为团队 "${teamName}" 开发功能`);
  }
}

export default { run };
