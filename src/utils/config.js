import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 此文件提供如下工具：
 * 1. 初始化配置文件，配置文件位于 `~/.config/yxkj-cli/yxkj-cli.json`中，初始化时写入默认配置
 * 2. 获取配置文件，根据配置的 key 读取配置，配置为 JSON 格式，如果没有配置则返回 null
 * 3. 设置配置文件，根据配置的 key 设置配置，配置为 JSON 格式，设置成功返回 true，否则返回 false
 *
 * 配置格式样例为：
 *  {
 *    "teams" : [
 *      {
 *        "name": "",
 *        "workspace": "",
 *        "members": [
 *          {"type": "pm"},
 *          {"type": "developer"},
 *          {"type": "tester"},
 *          {"type": "designer"},
 *          {"type": "reviewer"},
 *          {"type": "other"}
 *        ]
 *      }
 *    ]
 *  }
 */

// 配置文件路径
export const CONFIG_DIR = path.join(os.homedir(), '.config', 'yxkj-cli');
export const CONFIG_FILE = path.join(CONFIG_DIR, 'yxkj-cli.json');

// 默认配置
const DEFAULT_CONFIG = {
  teams: []
};

/**
 * 确保配置目录存在
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, {recursive: true, mode: 0o755});
  }
}

/**
 * 初始化配置文件
 * @returns {boolean} 初始化成功返回 true，否则返回 false
 */
export function initConfig() {
  try {
    ensureConfigDir();

    // 如果配置文件已存在，不覆盖
    if (fs.existsSync(CONFIG_FILE)) {
      console.log('配置文件已存在');
      return true;
    }

    // 写入默认配置
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), {
      encoding: 'utf8',
      mode: 0o644
    });
    console.log('配置文件初始化成功');
    return true;
  } catch (error) {
    console.error('初始化配置文件失败:', error.message);
    return false;
  }
}

/**
 * 获取配置文件内容
 * @param {string} [key] - 可选的配置键，如果提供则返回对应 key 的值，否则返回整个配置
 * @returns {any} 配置内容，如果没有配置则返回 null
 */
export function getConfig(key = null) {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CONFIG_FILE, {
      encoding: 'utf8'
    });

    const config = JSON.parse(content);

    if (key === null || key === '') {
      return config;
    }

    // 支持嵌套 key，使用点分隔符，如 'teams.0.name'
    const keys = key.split('.');
    let value = config;
    for (const k of keys) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[k];
    }

    return value !== undefined ? value : null;
  } catch (error) {
    console.error('读取配置文件失败:', error.message);
    return null;
  }
}

/**
 * 设置配置文件
 * @param {string} key - 配置键
 * @param {any} value - 配置值
 * @returns {boolean} 设置成功返回 true，否则返回 false
 */
export function setConfig(key, value) {
  try {
    ensureConfigDir();

    let config = {};

    // 如果配置文件存在，先读取现有配置
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, {
        encoding: 'utf8'
      });
      config = JSON.parse(content);
    }

    // 设置配置值
    const keys = key.split('.');
    let current = config;

    // 遍历到倒数第二个 key
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k];
    }

    // 设置最后一个 key 的值
    current[keys[keys.length - 1]] = value;

    // 写回配置文件
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
      encoding: 'utf8',
      mode: 0o644
    });
    return {status: true, message:`配置 ${key} 设置成功`};
  } catch (error) {
    return {status: false, message:`设置配置 ${key} 失败:${error.message}`};
  }
}


export function help() {
  console.log('Usage: yxkj config <command> [options]');
  console.log('Commands: initConfig, getConfig, setConfig config help');
}

export function config(...args){
  if(args.length === 0){
    return help();
  }
  if(args.length === 1){
    return getConfig(args[0]);
  }
  return setConfig(args[0], args[1]);
}