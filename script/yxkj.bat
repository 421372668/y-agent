@echo off
setlocal

:: 核心逻辑：调用node，执行指定JS文件，并传递所有运行参数
:: %* 代表批处理脚本接收的 全部参数（自动拼接，无需手动处理）
node "%~dp0node_modules\yxkj-cli\src\index.js" %*

:: 脚本执行完成后退出
endlocal