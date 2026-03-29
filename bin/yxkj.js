#!/usr/bin/env node

/**
 * yxkj-cli 全局命令入口
 * 支持 Windows/Linux/macOS 跨平台
 */

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 入口文件路径
const indexPath = join(__dirname, '..', 'src', 'index.js');

// 动态导入并执行入口文件
const args = process.argv.slice(2);

// 设置进程参数
process.argv = [process.argv[0], indexPath, ...args];

// 导入入口模块（Windows 下需要使用 file:// URL）
await import(pathToFileURL(indexPath).href);
