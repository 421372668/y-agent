/**
 * Other（其他角色）任务
 * @param {object} team - 团队实例
 * @param {object} member - 成员实例
 */
export async function run(team, member) {
  const now = new Date().toISOString();
  const memberName = member.getName();
  const executionCount = member._executionCount;
  
  console.log(`[${now}] Member "${memberName}" 执行通用任务 #${executionCount}`);
  
  // Other 可以执行的通用任务示例：
  // 1. 通用协作
  // 2. 文档编写
  // 3. 会议参与
  // 4. 其他支持工作
  
  if (team) {
    const teamName = team.getName ? team.getName() : 'unknown';
    console.log(`[${now}] Member "${memberName}" 正在为团队 "${teamName}" 提供支持`);
  }
}

export default { run };
