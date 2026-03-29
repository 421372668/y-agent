@echo off
setlocal

:: 核心逻辑：调用node，执行指定JS文件，并传递所有运行参数
:: %* 代表批处理脚本接收的 全部参数（自动拼接，无需手动处理）

:: 优先查找开发路径：当前bat文件/../src/index.js
set "DEV_PATH=%~dp0..\src\index.js"
:: 其次查找安装路径：当前bat文件/node_modules/yxkj-cli/src/index.js
set "INSTALL_PATH=%~dp0node_modules\yxkj-cli\src\index.js"

if exist "%DEV_PATH%" (
    node "%DEV_PATH%" %*
) else (
    node "%INSTALL_PATH%" %*
)

:: 脚本执行完成后退出
endlocal