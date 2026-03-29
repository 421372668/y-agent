/**
 * 团队管理
 * 1. 创建团队 - create [teamName] [workspace]
 * 2. 删除团队 - delete [teamName]
 * 3. 修改团队 - update [teamName] [workspace]
 * 4. 列出所有团队 - list
 * 5. 显示团队信息 - members [teamName]
 * 6. 添加团队成员 - add-member [teamName] [memberName]
 * 7. 移除团队成员 - remove-team-member [teamName] [memberName]
 * 8. 修改团队成员角色 - update-team-member-role [teamName] [memberName] [role]
 * 9. 显示团队成员信息 - show-team-member [teamName] [memberName]
 * 
 * 团队信息保存在配置中，调用配置模块进行管理
 * 团队的数据结构为：
 * {
 *    "teams" : [
 *      {
 *        "name": "",
 *        "workspace": "",
 *        "description": "",
 *        "members": [
 *          {"name": "", "type": "pm"},
 *          {"name": "", "type": "developer"},
 *          {"name": "", "type": "tester"},
 *          {"name": "", "type": "designer"},
 *          {"name": "", "type": "reviewer"},
 *          {"name": "", "type": "other"}
 *        ]
 *      }
 *    ]
 * }
 */

import { getConfig, setConfig } from '../utils/config.js';

// 支持的成员类型
const MEMBER_TYPES = ['pm', 'developer', 'tester', 'designer', 'reviewer', 'other'];

/**
 * 获取所有团队
 * @returns {Array} 团队列表
 */
function getTeams() {
  const teams = getConfig('teams');
  return teams || [];
}

/**
 * 保存团队列表
 * @param {Array} teams 团队列表
 * @returns {object} 操作结果
 */
function saveTeams(teams) {
  return setConfig('teams', teams);
}

/**
 * 根据名称查找团队索引
 * @param {string} teamName 团队名称
 * @returns {number} 团队索引，未找到返回 -1
 */
function findTeamIndex(teamName) {
  const teams = getTeams();
  return teams.findIndex(team => team.name === teamName);
}

/**
 * 根据名称查找团队
 * @param {string} teamName 团队名称
 * @returns {object|null} 团队对象，未找到返回 null
 */
function findTeam(teamName) {
  const teams = getTeams();
  return teams.find(team => team.name === teamName) || null;
}

/**
 * 创建团队
 * @param {string} teamName 团队名称
 * @param {string} workspace 工作空间路径
 * @param {string} [description] 团队描述
 * @returns {object} 操作结果
 */
export function create(teamName, workspace, description = '') {
  if (!teamName) {
    return { status: false, message: '团队名称不能为空' };
  }
  if (!workspace) {
    return { status: false, message: '工作空间路径不能为空' };
  }

  const teams = getTeams();
  
  // 检查团队是否已存在
  if (teams.some(team => team.name === teamName)) {
    return { status: false, message: `团队 "${teamName}" 已存在` };
  }

  // 创建新团队
  const newTeam = {
    name: teamName,
    workspace: workspace,
    description: description,
    members: []
  };

  teams.push(newTeam);
  const result = saveTeams(teams);
  
  if (result.status) {
    return { status: true, message: `团队 "${teamName}" 创建成功` };
  }
  return result;
}

/**
 * 删除团队
 * @param {string} teamName 团队名称
 * @returns {object} 操作结果
 */
export function deleteTeam(teamName) {
  if (!teamName) {
    return { status: false, message: '团队名称不能为空' };
  }

  const teams = getTeams();
  const index = teams.findIndex(team => team.name === teamName);

  if (index === -1) {
    return { status: false, message: `团队 "${teamName}" 不存在` };
  }

  teams.splice(index, 1);
  const result = saveTeams(teams);
  
  if (result.status) {
    return { status: true, message: `团队 "${teamName}" 删除成功` };
  }
  return result;
}

/**
 * 修改团队
 * @param {string} teamName 团队名称
 * @param {string} [workspace] 工作空间路径
 * @param {string} [description] 团队描述
 * @returns {object} 操作结果
 */
export function update(teamName, workspace, description) {
  if (!teamName) {
    return { status: false, message: '团队名称不能为空' };
  }

  const teams = getTeams();
  const team = teams.find(t => t.name === teamName);

  if (!team) {
    return { status: false, message: `团队 "${teamName}" 不存在` };
  }

  // 更新团队信息
  if (workspace !== undefined && workspace !== '') {
    team.workspace = workspace;
  }
  if (description !== undefined) {
    team.description = description;
  }

  const result = saveTeams(teams);
  
  if (result.status) {
    return { status: true, message: `团队 "${teamName}" 更新成功`, data: team };
  }
  return result;
}

/**
 * 列出所有团队
 * @returns {object} 操作结果和团队列表
 */
export function list() {
  const teams = getTeams();
  
  if (teams.length === 0) {
    return { status: true, message: '暂无团队', data: [] };
  }

  return { 
    status: true, 
    message: `共有 ${teams.length} 个团队`,
    data: teams.map(team => ({
      name: team.name,
      workspace: team.workspace,
      description: team.description || '',
      memberCount: team.members ? team.members.length : 0
    }))
  };
}

/**
 * 显示团队成员信息
 * @param {string} teamName 团队名称
 * @returns {object} 操作结果和成员列表
 */
export function members(teamName) {
  if (!teamName) {
    return { status: false, message: '团队名称不能为空' };
  }

  const team = findTeam(teamName);
  
  if (!team) {
    return { status: false, message: `团队 "${teamName}" 不存在` };
  }

  const memberList = team.members || [];
  
  return { 
    status: true, 
    message: `团队 "${teamName}" 共有 ${memberList.length} 名成员`,
    data: {
      team: {
        name: team.name,
        workspace: team.workspace,
        description: team.description || ''
      },
      members: memberList
    }
  };
}

/**
 * 添加团队成员
 * @param {string} teamName 团队名称
 * @param {string} memberName 成员名称
 * @param {string} [memberType='developer'] 成员类型
 * @returns {object} 操作结果
 */
export function addMember(teamName, memberName, memberType = 'developer') {
  if (!teamName) {
    return { status: false, message: '团队名称不能为空' };
  }
  if (!memberName) {
    return { status: false, message: '成员名称不能为空' };
  }

  // 验证成员类型
  if (!MEMBER_TYPES.includes(memberType)) {
    return { status: false, message: `无效的成员类型 "${memberType}"，支持的类型: ${MEMBER_TYPES.join(', ')}` };
  }

  const teams = getTeams();
  const team = teams.find(t => t.name === teamName);

  if (!team) {
    return { status: false, message: `团队 "${teamName}" 不存在` };
  }

  // 初始化成员数组
  if (!team.members) {
    team.members = [];
  }

  // 检查成员是否已存在
  if (team.members.some(m => m.name === memberName)) {
    return { status: false, message: `成员 "${memberName}" 已在团队 "${teamName}" 中` };
  }

  // 添加成员
  team.members.push({
    name: memberName,
    type: memberType
  });

  const result = saveTeams(teams);
  
  if (result.status) {
    return { status: true, message: `成员 "${memberName}" 已添加到团队 "${teamName}"` };
  }
  return result;
}

/**
 * 移除团队成员
 * @param {string} teamName 团队名称
 * @param {string} memberName 成员名称
 * @returns {object} 操作结果
 */
export function removeTeamMember(teamName, memberName) {
  if (!teamName) {
    return { status: false, message: '团队名称不能为空' };
  }
  if (!memberName) {
    return { status: false, message: '成员名称不能为空' };
  }

  const teams = getTeams();
  const team = teams.find(t => t.name === teamName);

  if (!team) {
    return { status: false, message: `团队 "${teamName}" 不存在` };
  }

  if (!team.members || team.members.length === 0) {
    return { status: false, message: `团队 "${teamName}" 中没有成员` };
  }

  const memberIndex = team.members.findIndex(m => m.name === memberName);
  
  if (memberIndex === -1) {
    return { status: false, message: `成员 "${memberName}" 不在团队 "${teamName}" 中` };
  }

  team.members.splice(memberIndex, 1);
  const result = saveTeams(teams);
  
  if (result.status) {
    return { status: true, message: `成员 "${memberName}" 已从团队 "${teamName}" 中移除` };
  }
  return result;
}

/**
 * 修改团队成员角色
 * @param {string} teamName 团队名称
 * @param {string} memberName 成员名称
 * @param {string} newRole 新角色
 * @returns {object} 操作结果
 */
export function updateTeamMemberRole(teamName, memberName, newRole) {
  if (!teamName) {
    return { status: false, message: '团队名称不能为空' };
  }
  if (!memberName) {
    return { status: false, message: '成员名称不能为空' };
  }
  if (!newRole) {
    return { status: false, message: '新角色不能为空' };
  }

  // 验证角色类型
  if (!MEMBER_TYPES.includes(newRole)) {
    return { status: false, message: `无效的角色类型 "${newRole}"，支持的类型: ${MEMBER_TYPES.join(', ')}` };
  }

  const teams = getTeams();
  const team = teams.find(t => t.name === teamName);

  if (!team) {
    return { status: false, message: `团队 "${teamName}" 不存在` };
  }

  if (!team.members || team.members.length === 0) {
    return { status: false, message: `团队 "${teamName}" 中没有成员` };
  }

  const member = team.members.find(m => m.name === memberName);
  
  if (!member) {
    return { status: false, message: `成员 "${memberName}" 不在团队 "${teamName}" 中` };
  }

  const oldRole = member.type;
  member.type = newRole;
  
  const result = saveTeams(teams);
  
  if (result.status) {
    return { 
      status: true, 
      message: `成员 "${memberName}" 的角色已从 "${oldRole}" 更改为 "${newRole}"` 
    };
  }
  return result;
}

/**
 * 显示团队成员详细信息
 * @param {string} teamName 团队名称
 * @param {string} memberName 成员名称
 * @returns {object} 操作结果和成员信息
 */
export function showTeamMember(teamName, memberName) {
  if (!teamName) {
    return { status: false, message: '团队名称不能为空' };
  }
  if (!memberName) {
    return { status: false, message: '成员名称不能为空' };
  }

  const team = findTeam(teamName);
  
  if (!team) {
    return { status: false, message: `团队 "${teamName}" 不存在` };
  }

  if (!team.members || team.members.length === 0) {
    return { status: false, message: `团队 "${teamName}" 中没有成员` };
  }

  const member = team.members.find(m => m.name === memberName);
  
  if (!member) {
    return { status: false, message: `成员 "${memberName}" 不在团队 "${teamName}" 中` };
  }

  return { 
    status: true, 
    message: `成员信息`,
    data: {
      team: team.name,
      name: member.name,
      type: member.type
    }
  };
}

/**
 * 显示帮助信息
 */
export function help() {
  console.log(`
团队管理命令 (team)

用法: yxkj team <command> [options]

命令:
  create <teamName> <workspace> [description]   创建新团队
  delete <teamName>                             删除团队
  update <teamName> [workspace] [description]   更新团队信息
  list                                          列出所有团队
  members <teamName>                            显示团队成员列表
  add-member <teamName> <memberName> [type]     添加团队成员
  remove-team-member <teamName> <memberName>    移除团队成员
  update-team-member-role <teamName> <memberName> <role>  修改成员角色
  show-team-member <teamName> <memberName>      显示成员详细信息
  help                                          显示帮助信息

成员类型 (type/role):
  pm          项目经理
  developer   开发人员 (默认)
  tester      测试人员
  designer    设计人员
  reviewer    审核人员
  other       其他

示例:
  yxkj team create myteam /path/to/workspace
  yxkj team list
  yxkj team add-member myteam zhangsan developer
  yxkj team update-team-member-role myteam zhangsan pm
  yxkj team members myteam
`);
}

// delete 是保留字，创建别名导出
export { deleteTeam as delete };

export default {
  create,
  deleteTeam,
  delete: deleteTeam,
  update,
  list,
  members,
  addMember,
  removeTeamMember,
  updateTeamMemberRole,
  showTeamMember,
  help
};
