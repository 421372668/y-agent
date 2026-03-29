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
 * 10. 启动团队 - start [teamName] 启动团队，创建成员实例并开始工作
 * 11. 停止团队 - stop [teamName] 停止团队所有成员工作
 */

import { getConfig, setConfig } from '../utils/config.js';
import { Member } from './member.js';
import fs from 'fs';
import path from 'path';

const MEMBER_TYPES = ['pm', 'developer', 'tester', 'designer', 'reviewer', 'other'];

export class TeamMember {
  constructor(name, type = 'developer') {
    this._name = name;
    this._type = type;
  }

  getName() { return this._name; }
  setName(name) { this._name = name; }
  getType() { return this._type; }
  
  setType(type) {
    if (!MEMBER_TYPES.includes(type)) throw new Error(`无效的成员类型 "${type}"`);
    this._type = type;
  }

  toJSON() { return { name: this._name, type: this._type }; }
  static fromJSON(obj) { return new TeamMember(obj.name, obj.type); }
}

export class Team {
  constructor(name, workspace, description = '') {
    this._name = name;
    this._workspace = workspace;
    this._description = description;
    this._members = [];
  }

  getName() { return this._name; }
  setName(name) { this._name = name; }
  getWorkspace() { return this._workspace; }
  setWorkspace(workspace) { this._workspace = workspace; }
  getDescription() { return this._description; }
  setDescription(description) { this._description = description; }
  getMembers() { return [...this._members]; }
  getMemberCount() { return this._members.length; }

  addMember(name, type = 'developer') {
    if (!MEMBER_TYPES.includes(type)) throw new Error(`无效的成员类型 "${type}"`);
    if (this._members.some(m => m.getName() === name)) throw new Error(`成员 "${name}" 已在团队中`);
    const member = new TeamMember(name, type);
    this._members.push(member);
    return member;
  }

  removeMember(name) {
    const index = this._members.findIndex(m => m.getName() === name);
    if (index === -1) return false;
    this._members.splice(index, 1);
    return true;
  }

  getMember(name) { return this._members.find(m => m.getName() === name) || null; }
  hasMember(name) { return this._members.some(m => m.getName() === name); }

  updateMemberRole(name, newType) {
    const member = this.getMember(name);
    if (!member) return false;
    member.setType(newType);
    return true;
  }

  toJSON() {
    return {
      name: this._name,
      workspace: this._workspace,
      description: this._description,
      members: this._members.map(m => m.toJSON())
    };
  }

  static fromJSON(obj) {
    const team = new Team(obj.name, obj.workspace, obj.description || '');
    if (obj.members && Array.isArray(obj.members)) {
      team._members = obj.members.map(m => TeamMember.fromJSON(m));
    }
    return team;
  }
}

export class TeamDatabase {
  constructor(workspace, teamName) {
    this._workspace = workspace;
    this._teamName = teamName;
    this._db = null;
    this._dbPath = null;
  }

  async init() {
    try {
      if (!fs.existsSync(this._workspace)) {
        fs.mkdirSync(this._workspace, { recursive: true });
      }
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs();
      this._dbPath = path.join(this._workspace, `${this._teamName}.db`);
      if (fs.existsSync(this._dbPath)) {
        const fileBuffer = fs.readFileSync(this._dbPath);
        this._db = new SQL.Database(fileBuffer);
      } else {
        this._db = new SQL.Database();
      }
      this._createTables();
      this._save();
      return true;
    } catch (error) {
      console.error(`初始化数据库失败: ${error.message}`);
      return false;
    }
  }

  _save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this._dbPath, buffer);
  }

  _createTables() {
    this._db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_name TEXT NOT NULL,
        member_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      )
    `);

    this._db.run(`
      CREATE TABLE IF NOT EXISTS work_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_name TEXT NOT NULL,
        member_type TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        todo_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (todo_id) REFERENCES todos(id)
      )
    `);

    this._db.run(`
      CREATE TABLE IF NOT EXISTS member_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_name TEXT NOT NULL UNIQUE,
        member_type TEXT NOT NULL,
        status TEXT DEFAULT 'idle',
        last_heartbeat DATETIME,
        execution_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  addTodo(memberName, memberType, title, description = '', priority = 0) {
    this._db.run('INSERT INTO todos (member_name, member_type, title, description, priority) VALUES (?, ?, ?, ?, ?)', [memberName, memberType, title, description, priority]);
    this._save();
  }

  updateTodoStatus(id, status) {
    this._db.run(`UPDATE todos SET status = ?, updated_at = CURRENT_TIMESTAMP, completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE id = ?`, [status, status, id]);
    this._save();
  }

  getTodos(memberName = null, status = null) {
    let sql = 'SELECT * FROM todos WHERE 1=1';
    const params = [];
    if (memberName) { sql += ' AND member_name = ?'; params.push(memberName); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY priority DESC, created_at ASC';
    const stmt = this._db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  }

  addWorkLog(memberName, memberType, action, details = '', todoId = null) {
    this._db.run('INSERT INTO work_logs (member_name, member_type, action, details, todo_id) VALUES (?, ?, ?, ?, ?)', [memberName, memberType, action, details, todoId]);
    this._save();
  }

  getWorkLogs(memberName = null, limit = 100) {
    let sql = 'SELECT * FROM work_logs WHERE 1=1';
    const params = [];
    if (memberName) { sql += ' AND member_name = ?'; params.push(memberName); }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    const stmt = this._db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  }

  updateMemberStatus(memberName, memberType, status, executionCount = 0) {
    const existing = this._db.prepare('SELECT id FROM member_status WHERE member_name = ?');
    existing.bind([memberName]);
    const exists = existing.step();
    existing.free();
    
    if (exists) {
      this._db.run('UPDATE member_status SET status = ?, last_heartbeat = CURRENT_TIMESTAMP, execution_count = ?, updated_at = CURRENT_TIMESTAMP WHERE member_name = ?', [status, executionCount, memberName]);
    } else {
      this._db.run('INSERT INTO member_status (member_name, member_type, status, last_heartbeat, execution_count, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)', [memberName, memberType, status, executionCount]);
    }
    this._save();
  }

  getMemberStatuses() {
    const stmt = this._db.prepare('SELECT * FROM member_status ORDER BY member_name');
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  }

  areAllMembersStopped() {
    const memberStatuses = this.getMemberStatuses();
    if (memberStatuses.length === 0) return true;
    return memberStatuses.every(m => m.status === 'stopped');
  }

  close() {
    if (this._db) { this._save(); this._db.close(); this._db = null; }
  }

  getDbPath() { return this._dbPath; }
}

export class TeamManager {
  constructor() {
    this._teams = [];
    this._runningTeams = new Map();
    this._loadFromConfig();
  }

  _loadFromConfig() {
    const teamsData = getConfig('teams');
    if (teamsData && Array.isArray(teamsData)) {
      this._teams = teamsData.map(t => Team.fromJSON(t));
    }
  }

  _saveToConfig() {
    const teamsData = this._teams.map(t => t.toJSON());
    return setConfig('teams', teamsData);
  }

  // 团队状态管理（存储在配置文件中）
  _getTeamStatusConfig(teamName) {
    const teamStatuses = getConfig('teamStatuses') || {};
    return teamStatuses[teamName] || { status: 'idle', startTime: null, stopTime: null };
  }

  _setTeamStatusConfig(teamName, status) {
    const teamStatuses = getConfig('teamStatuses') || {};
    const now = new Date().toISOString();
    
    teamStatuses[teamName] = {
      status,
      startTime: status === 'running' ? now : (teamStatuses[teamName]?.startTime || null),
      stopTime: status === 'stopped' ? now : (teamStatuses[teamName]?.stopTime || null),
      updatedAt: now
    };
    
    setConfig('teamStatuses', teamStatuses);
  }

  getAllTeams() { return [...this._teams]; }
  getTeamCount() { return this._teams.length; }
  getTeam(name) { return this._teams.find(t => t.getName() === name) || null; }
  hasTeam(name) { return this._teams.some(t => t.getName() === name); }

  createTeam(name, workspace, description = '') {
    if (!name) throw new Error('团队名称不能为空');
    if (!workspace) throw new Error('工作空间路径不能为空');
    if (this.hasTeam(name)) throw new Error(`团队 "${name}" 已存在`);
    const team = new Team(name, workspace, description);
    this._teams.push(team);
    const result = this._saveToConfig();
    if (!result.status) { this._teams.pop(); throw new Error(result.message); }
    return team;
  }

  deleteTeam(name) {
    const index = this._teams.findIndex(t => t.getName() === name);
    if (index === -1) throw new Error(`团队 "${name}" 不存在`);
    const removed = this._teams.splice(index, 1)[0];
    const result = this._saveToConfig();
    if (!result.status) { this._teams.splice(index, 0, removed); throw new Error(result.message); }
    
    // 清理团队状态
    const teamStatuses = getConfig('teamStatuses') || {};
    delete teamStatuses[name];
    setConfig('teamStatuses', teamStatuses);
    
    return true;
  }

  updateTeam(name, workspace, description) {
    const team = this.getTeam(name);
    if (!team) throw new Error(`团队 "${name}" 不存在`);
    const oldWorkspace = team.getWorkspace();
    const oldDescription = team.getDescription();
    if (workspace !== undefined && workspace !== '') team.setWorkspace(workspace);
    if (description !== undefined) team.setDescription(description);
    const result = this._saveToConfig();
    if (!result.status) { team.setWorkspace(oldWorkspace); team.setDescription(oldDescription); throw new Error(result.message); }
    return team;
  }

  addMemberToTeam(teamName, memberName, memberType = 'developer') {
    const team = this.getTeam(teamName);
    if (!team) throw new Error(`团队 "${teamName}" 不存在`);
    const member = team.addMember(memberName, memberType);
    const result = this._saveToConfig();
    if (!result.status) { team.removeMember(memberName); throw new Error(result.message); }
    return member;
  }

  removeMemberFromTeam(teamName, memberName) {
    const team = this.getTeam(teamName);
    if (!team) throw new Error(`团队 "${teamName}" 不存在`);
    if (!team.removeMember(memberName)) throw new Error(`成员 "${memberName}" 不在团队 "${teamName}" 中`);
    const result = this._saveToConfig();
    if (!result.status) throw new Error(result.message);
    return true;
  }

  updateMemberRole(teamName, memberName, newRole) {
    const team = this.getTeam(teamName);
    if (!team) throw new Error(`团队 "${teamName}" 不存在`);
    const member = team.getMember(memberName);
    if (!member) throw new Error(`成员 "${memberName}" 不在团队 "${teamName}" 中`);
    const oldType = member.getType();
    member.setType(newRole);
    const result = this._saveToConfig();
    if (!result.status) { member.setType(oldType); throw new Error(result.message); }
    return member;
  }

  refresh() { this._loadFromConfig(); }

  async startTeam(teamName, frequency = 60000) {
    const team = this.getTeam(teamName);
    if (!team) throw new Error(`团队 "${teamName}" 不存在`);
    if (this._runningTeams.has(teamName)) throw new Error(`团队 "${teamName}" 已在运行中`);
    if (team.getMemberCount() === 0) throw new Error(`团队 "${teamName}" 没有成员`);

    const database = new TeamDatabase(team.getWorkspace(), teamName);
    if (!await database.init()) throw new Error(`团队 "${teamName}" 数据库初始化失败`);

    // 设置团队状态为 running（写入配置文件）
    this._setTeamStatusConfig(teamName, 'running');
    database.addWorkLog('system', 'system', 'team_started', `团队启动，执行频率: ${frequency}ms`);

    const runtimeInfo = {
      team, database, members: new Map(),
      startTime: new Date(), frequency, teamName
    };

    const self = this;
    const teamMembers = team.getMembers();
    for (const teamMember of teamMembers) {
      const memberName = teamMember.getName();
      const memberType = teamMember.getType();
      // 创建成员时传入 team 实例，task 为空时会自动加载角色任务
      const member = new Member(memberName, memberType, null, frequency, team);
      
      // 初始化成员（加载角色任务）
      await member.init();

      // 保存原始角色任务，设置包装函数 - 执行前检查团队状态
      const originalTask = member._task;
      member.setTask(async () => {
        try {
          const teamStatus = self._getTeamStatusConfig(teamName);
          
          if (teamStatus.status === 'stopping') {
            console.log(`[${new Date().toISOString()}] 团队 "${teamName}" 正在停止，成员 "${memberName}" 停止执行`);
            member.stop();
            database.updateMemberStatus(memberName, memberType, 'stopped', member._executionCount);
            database.addWorkLog(memberName, memberType, 'member_stopped', `成员因团队停止而停止，总执行次数: ${member._executionCount}`);
            
            if (database.areAllMembersStopped()) {
              self._setTeamStatusConfig(teamName, 'stopped');
              database.addWorkLog('system', 'system', 'team_stopped', '所有成员已停止，团队状态更新为 stopped');
              console.log(`[${new Date().toISOString()}] 团队 "${teamName}" 所有成员已停止，团队状态更新为 stopped`);
            }
            return;
          }
          
          if (teamStatus.status !== 'running') {
            console.log(`[${new Date().toISOString()}] 团队 "${teamName}" 状态为 ${teamStatus.status}，成员 "${memberName}" 跳过执行`);
            return;
          }
          
          database.updateMemberStatus(memberName, memberType, 'working', member._executionCount);
          database.addWorkLog(memberName, memberType, `execute_task_${member._executionCount}`, JSON.stringify({ time: new Date().toISOString(), executionCount: member._executionCount }));
          
          // 调用原始角色任务（如果存在）
          if (originalTask) {
            await originalTask();
          }
        } catch (error) {
          console.error(`成员 "${memberName}" 任务执行失败:`, error.message);
        }
      });

      await member.run();
      runtimeInfo.members.set(memberName, member);
      database.updateMemberStatus(memberName, memberType, 'running', 0);
      database.addWorkLog(memberName, memberType, 'member_started', `成员启动，执行频率: ${frequency}ms`);
    }

    this._runningTeams.set(teamName, runtimeInfo);
    return { teamName, memberCount: teamMembers.length, databasePath: database.getDbPath(), startTime: runtimeInfo.startTime, frequency };
  }

  stopTeam(teamName) {
    const team = this.getTeam(teamName);
    if (!team) throw new Error(`团队 "${teamName}" 不存在`);

    const teamStatus = this._getTeamStatusConfig(teamName);
    if (teamStatus.status !== 'running' && teamStatus.status !== 'stopping') {
      throw new Error(`团队 "${teamName}" 未在运行中，当前状态: ${teamStatus.status}`);
    }

    // 设置团队状态为 stopping（写入配置文件）
    this._setTeamStatusConfig(teamName, 'stopping');

    // 如果团队在当前进程中运行，立即停止成员
    const runtimeInfo = this._runningTeams.get(teamName);
    if (runtimeInfo) {
      runtimeInfo.database.addWorkLog('system', 'system', 'team_stopping', '团队开始停止流程');

      const self = this;
      setTimeout(() => {
        for (const [memberName, member] of runtimeInfo.members) {
          if (member.isRunning()) {
            member.stop();
            runtimeInfo.database.updateMemberStatus(memberName, member.getType(), 'stopped', member._executionCount);
            runtimeInfo.database.addWorkLog(memberName, member.getType(), 'member_stopped', `成员强制停止，总执行次数: ${member._executionCount}`);
          }
        }
        
        self._setTeamStatusConfig(teamName, 'stopped');
        runtimeInfo.database.addWorkLog('system', 'system', 'team_stopped', '团队强制停止完成');
        runtimeInfo.database.close();
        self._runningTeams.delete(teamName);
      }, runtimeInfo.frequency + 1000);

      return { teamName, message: '团队停止流程已启动，等待成员停止...' };
    }

    // 团队在其他进程中运行，通过配置文件状态通知停止
    return { teamName, message: '团队停止信号已发送，运行中的成员将在下次执行时停止' };
  }

  isTeamRunning(teamName) { return this._runningTeams.has(teamName); }
  getRunningTeams() { return Array.from(this._runningTeams.keys()); }

  getTeamStatus(teamName) {
    return this._getTeamStatusConfig(teamName);
  }

  getTeamRuntimeStatus(teamName) {
    const runtimeInfo = this._runningTeams.get(teamName);
    if (!runtimeInfo) return null;
    return {
      teamName,
      startTime: runtimeInfo.startTime,
      frequency: runtimeInfo.frequency,
      memberCount: runtimeInfo.members.size,
      databasePath: runtimeInfo.database.getDbPath(),
      members: Array.from(runtimeInfo.members.values()).map(m => m.getStatus())
    };
  }

  static getMemberTypes() { return [...MEMBER_TYPES]; }
}

const teamManager = new TeamManager();

// CLI 命令接口
export function create(teamName, workspace, description = '') {
  try {
    const team = teamManager.createTeam(teamName, workspace, description);
    
    // 添加标准成员
    const standardMembers = [
      { name: `${teamName}_pm`, type: 'pm' },
      { name: `${teamName}_developer`, type: 'developer' },
      { name: `${teamName}_designer`, type: 'designer' },
      { name: `${teamName}_tester`, type: 'tester' },
      { name: `${teamName}_reviewer`, type: 'reviewer' }
    ];

    for (const sm of standardMembers) {
      team.addMember(sm.name, sm.type);
    }
    teamManager._saveToConfig();

    return { status: true, message: `团队 "${teamName}" 创建成功，已添加 ${standardMembers.length} 名标准成员`, data: team.toJSON() };
  } catch (error) { return { status: false, message: error.message }; }
}

export function deleteTeam(teamName) {
  try {
    teamManager.deleteTeam(teamName);
    return { status: true, message: `团队 "${teamName}" 删除成功` };
  } catch (error) { return { status: false, message: error.message }; }
}

export { deleteTeam as delete };

export function update(teamName, workspace, description) {
  try {
    const team = teamManager.updateTeam(teamName, workspace, description);
    return { status: true, message: `团队 "${teamName}" 更新成功`, data: team.toJSON() };
  } catch (error) { return { status: false, message: error.message }; }
}

export function list() {
  const teams = teamManager.getAllTeams();
  if (teams.length === 0) return { status: true, message: '暂无团队', data: [] };
  return { status: true, message: `共有 ${teams.length} 个团队`, data: teams.map(t => ({ name: t.getName(), workspace: t.getWorkspace(), description: t.getDescription(), memberCount: t.getMemberCount(), status: teamManager.getTeamStatus(t.getName()) })) };
}

export function members(teamName) {
  const team = teamManager.getTeam(teamName);
  if (!team) return { status: false, message: `团队 "${teamName}" 不存在` };
  return { status: true, message: `团队 "${teamName}" 共有 ${team.getMemberCount()} 名成员`, data: { team: { name: team.getName(), workspace: team.getWorkspace(), description: team.getDescription(), status: teamManager.getTeamStatus(teamName) }, members: team.getMembers().map(m => m.toJSON()) } };
}

export function addMember(teamName, memberName, memberType = 'developer') {
  try {
    const member = teamManager.addMemberToTeam(teamName, memberName, memberType);
    return { status: true, message: `成员 "${memberName}" 已添加到团队 "${teamName}"`, data: member.toJSON() };
  } catch (error) { return { status: false, message: error.message }; }
}

export function removeTeamMember(teamName, memberName) {
  try {
    teamManager.removeMemberFromTeam(teamName, memberName);
    return { status: true, message: `成员 "${memberName}" 已从团队 "${teamName}" 中移除` };
  } catch (error) { return { status: false, message: error.message }; }
}

export function updateTeamMemberRole(teamName, memberName, newRole) {
  try {
    const member = teamManager.updateMemberRole(teamName, memberName, newRole);
    return { status: true, message: `成员 "${memberName}" 的角色已更改为 "${newRole}"`, data: member.toJSON() };
  } catch (error) { return { status: false, message: error.message }; }
}

export function showTeamMember(teamName, memberName) {
  const team = teamManager.getTeam(teamName);
  if (!team) return { status: false, message: `团队 "${teamName}" 不存在` };
  const member = team.getMember(memberName);
  if (!member) return { status: false, message: `成员 "${memberName}" 不在团队 "${teamName}" 中` };
  return { status: true, message: '成员信息', data: { team: team.getName(), name: member.getName(), type: member.getType() } };
}

export async function start(teamName, frequency = 60000) {
  try {
    const freq = parseInt(frequency, 10);
    if (isNaN(freq) || freq <= 0) return { status: false, message: '执行频率必须是一个正整数（毫秒）' };
    const result = await teamManager.startTeam(teamName, freq);
    return { status: true, message: `团队 "${teamName}" 已启动，${result.memberCount} 名成员开始工作`, data: result };
  } catch (error) { return { status: false, message: error.message }; }
}

export function stop(teamName) {
  try {
    const result = teamManager.stopTeam(teamName);
    return { status: true, message: `团队 "${teamName}" 停止流程已启动`, data: result };
  } catch (error) { return { status: false, message: error.message }; }
}

export function status(teamName) {
  try {
    const teamStatus = teamManager.getTeamStatus(teamName);
    return { status: true, message: `团队 "${teamName}" 状态`, data: teamStatus };
  } catch (error) { return { status: false, message: error.message }; }
}

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
  start <teamName> [frequency]                  启动团队（默认60秒执行一次）
  stop <teamName>                               停止团队
  status <teamName>                             查看团队状态
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
  yxkj team add-member myteam zhangsan developer
  yxkj team start myteam 30000
  yxkj team stop myteam
`);
}

export default {
  Team, TeamMember, TeamManager, TeamDatabase,
  create, deleteTeam, delete: deleteTeam, update, list, members,
  addMember, removeTeamMember, updateTeamMemberRole, showTeamMember,
  start, stop, status, help
};
