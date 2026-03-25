/**
 * Git 服务 - 执行 Git 操作
 */

const { execSync } = require('child_process');
const logger = require('../utils/logger');

class GitService {
  constructor() {
    this.workDir = process.cwd();
  }

  /**
   * 检查是否为 Git 仓库
   */
  isGitRepo() {
    try {
      execSync('git rev-parse --is-inside-work-tree', { 
        encoding: 'utf8',
        cwd: this.workDir
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取 Git 状态
   */
  getStatus() {
    try {
      const status = execSync('git status --porcelain', { 
        encoding: 'utf8',
        cwd: this.workDir
      });
      return {
        hasChanges: status.trim().length > 0,
        raw: status
      };
    } catch (error) {
      logger.error(`获取 Git 状态失败：${error.message}`);
      return { hasChanges: false, raw: '', error: error.message };
    }
  }

  /**
   * 添加文件到暂存区
   */
  add(files = '.') {
    try {
      execSync(`git add ${files}`, { 
        encoding: 'utf8',
        cwd: this.workDir
      });
      logger.info(`Git add: ${files}`);
      return { success: true };
    } catch (error) {
      logger.error(`Git add 失败：${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建提交
   */
  commit(message) {
    try {
      execSync(`git commit -m "${message}"`, { 
        encoding: 'utf8',
        cwd: this.workDir
      });
      logger.info(`Git commit: ${message}`);
      return { success: true, message };
    } catch (error) {
      logger.error(`Git commit 失败：${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取最近提交
   */
  getRecentCommits(limit = 5) {
    try {
      const log = execSync(`git log -${limit} --oneline`, { 
        encoding: 'utf8',
        cwd: this.workDir
      });
      return log.trim().split('\n').map(line => {
        const [hash, ...msg] = line.split(' ');
        return { hash, message: msg.join(' ') };
      });
    } catch (error) {
      logger.error(`获取提交历史失败：${error.message}`);
      return [];
    }
  }

  /**
   * 推送到远程（需要用户确认）
   */
  push(remote = 'origin', branch = 'main') {
    try {
      execSync(`git push ${remote} ${branch}`, { 
        encoding: 'utf8',
        cwd: this.workDir
      });
      logger.info(`Git push: ${remote}/${branch}`);
      return { success: true };
    } catch (error) {
      logger.error(`Git push 失败：${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建分支
   */
  createBranch(branchName) {
    try {
      execSync(`git checkout -b ${branchName}`, { 
        encoding: 'utf8',
        cwd: this.workDir
      });
      logger.info(`创建分支：${branchName}`);
      return { success: true, branch: branchName };
    } catch (error) {
      logger.error(`创建分支失败：${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = GitService;
