/**
 * 帮助命令模块
 * 显示所有可用命令的帮助信息
 */

/**
 * 显示帮助信息
 */
export function help() {
  console.log(`
${colors.bright}${colors.cyan}yxkj-cli${colors.reset} - AI Agent 团队协作命令行工具

${colors.bright}用法:${colors.reset}
  yxkj <command> <sub-command> [options]
  yxkj <command> help          显示命令详细帮助

${colors.bright}命令列表:${colors.reset}

  ${colors.green}team${colors.reset}       团队管理命令
              创建、启动、停止、删除团队，管理团队成员

  ${colors.green}member${colors.reset}     成员管理命令
              管理团队成员，查看成员状态

  ${colors.green}opencode${colors.reset}   OpenCode 任务执行命令
              使用 OpenCode AI 执行任务

  ${colors.green}config${colors.reset}     配置管理命令
              查看、设置配置项

${colors.bright}团队管理命令 (team):${colors.reset}
  team create <名称> <工作目录> [描述]     创建新团队
  team delete <名称>                       删除团队
  team list                                列出所有团队
  team start <名称> [频率ms]               启动团队（默认60秒）
  team stop <名称>                         停止团队
  team status <名称>                       查看团队状态
  team members <名称>                      显示团队成员
  team add-member <团队> <成员> [类型]     添加成员
  team remove-member <团队> <成员>         移除成员

${colors.bright}OpenCode 命令 (opencode):${colors.reset}
  opencode run <工作目录> <任务>           执行 AI 任务
              --port <端口>                指定服务端口（默认4096）
              --hostname <主机>            指定服务主机（默认127.0.0.1）

  opencode run-with-existing-server <工作目录> <任务> [服务地址]
                                          连接已有服务执行任务

${colors.bright}成员管理命令 (member):${colors.reset}
  member list <团队名称>                   列出团队成员
  member add <团队> <名称> [类型]          添加成员
  member remove <团队> <名称>              移除成员
  member info <团队> <名称>                查看成员详情

${colors.bright}成员类型:${colors.reset}
  pm          项目经理 - 创建待办任务
  designer    设计师 - 设计方案
  developer   开发者 - 开发实现（默认）
  tester      测试人员 - 测试验证
  reviewer    审核人员 - 代码审核
  other       其他角色

${colors.bright}示例:${colors.reset}
  # 创建并启动团队
  yxkj team create myteam ./workspace/myteam "我的开发团队"
  yxkj team start myteam 5000

  # 查看团队状态
  yxkj team status myteam

  # 添加成员
  yxkj team add-member myteam zhangsan developer

  # 执行 AI 任务
  yxkj opencode run ./workspace "创建 README.md 文件"

${colors.bright}更多帮助:${colors.reset}
  yxkj team help      团队命令详细帮助
  yxkj member help    成员命令详细帮助
  yxkj opencode help  OpenCode 命令详细帮助

${colors.bright}版本:${colors.reset} 1.0.0
${colors.bright}许可证:${colors.reset} MIT
`);
}

/**
 * 颜色常量
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

/**
 * 显示版本信息
 */
export function version() {
  console.log('yxkj-cli v1.0.0');
}

/**
 * 显示简短帮助
 */
export function shortHelp() {
  console.log(`
用法: yxkj <command> <sub-command> [options]

命令:
  team       团队管理命令
  member     成员管理命令
  opencode   OpenCode 任务执行命令

运行 'yxkj help' 查看详细帮助信息。
`);
}

export default { help, version, shortHelp };
