@echo off
chcp 65001
cd /d "%~dp0"

echo ========================================
echo 清理和重新安装依赖包
echo ========================================

:: 删除 node_modules 和 package-lock.json
echo 正在删除旧的依赖包...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"

:: 重新安装依赖
echo 正在安装新的依赖包...
npm install

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 依赖安装成功！
    echo 现在可以执行部署命令：wrangler deploy
    echo ========================================
) else (
    echo.
    echo ========================================
    echo 依赖安装失败，请检查网络连接
    echo ========================================
)

pause