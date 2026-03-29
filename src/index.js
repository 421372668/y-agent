/**
 * 文件有一个main函数，接受node执行的全部参数，根据第一个参数找到要执行的JS文件，自动导入对应的JS文件，第二参数为执行JS文件的方法，其他参数为方法的参数
 * 例如：node index.js config run arg1 arg2
 * 中config.js为要执行的JS文件，run为执行JS文件的方法，arg1和arg2为方法的参数
 */

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 解析命令行参数
 * @returns {{moduleName: string, methodName: string, methodArgs: string[]}}
 */
function parseArgs() {
    const args = process.argv.slice(2);
    if(args.length == 0){
        return { moduleName: 'help', methodName: 'help', methodArgs: [] };
    }
    if(args.length == 1){
        return { moduleName: args[0], methodName: 'help', methodArgs: [] };
    }
    const [moduleName, methodName, ...methodArgs] = args;
    return { moduleName, methodName, methodArgs };
}

/**
 * 动态加载模块
 * @param {string} moduleName 
 * @returns {Promise<object>}
 */
async function loadModule(moduleName) {
    const searchPaths = [
        join(__dirname, 'commands', `${moduleName}.js`),
        join(__dirname, 'services', `${moduleName}.js`),
        join(__dirname, 'utils', `${moduleName}.js`),
        join(__dirname, `${moduleName}.js`)
    ];

    for (const modulePath of searchPaths) {
        try {
            return await import(pathToFileURL(modulePath).href);
        } catch (e) {
            // 继续尝试下一个路径
        }
    }
    throw new Error(`找不到模块: ${moduleName}`);
}

/**
 * 执行模块方法
 * @param {object} module 
 * @param {string} moduleName 
 * @param {string} methodName 
 * @param {string[]} methodArgs 
 * @returns {Promise<any>}
 */
async function executeMethod(module, moduleName, methodName, methodArgs) {
    let rawMethodName = methodName;
    if(methodName.startsWith('-') ){
        rawMethodName = methodName.substring(1);
    }
    if(methodName.startsWith('--')){
        rawMethodName = methodName.substring(2);
    }

    let finnalMethod = rawMethodName;
    if(typeof module[finnalMethod] !== 'function'){
        finnalMethod = methodName.replace(/-/g, '');
    }
    if(typeof module[finnalMethod] !== 'function'){
        finnalMethod = rawMethodName.replace(/-\w/g, (part) =>{
            return part.slice(1).toUpperCase();
        });
    }

    if (typeof module[finnalMethod] !== 'function') {
        throw new Error(`模块 ${moduleName} 中不存在方法: ${methodName}`);
    }
    return await module[finnalMethod](...methodArgs);
}

/**
 * 主入口函数
 */
async function main() {
    const { moduleName, methodName, methodArgs } = parseArgs();

    try {
        const module = await loadModule(moduleName);
        const result = await executeMethod(module, moduleName, methodName, methodArgs);
        if (result !== undefined) {
            if (typeof result === 'object') {
                console.log(JSON.stringify(result, null, 2));
            } else {
                console.log(result);
            }
        }
    } catch (error) {
        console.error(`错误: ${error.message}`);
        process.exit(1);
    }
}

main();