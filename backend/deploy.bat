@echo off
chcp 65001
cd /d "%~dp0"

echo ========================================
echo 部署广告链接管理系统 API
echo ========================================

:: 检查 node_modules 是否存在
if not exist "node_modules\.bin\wrangler" (
    echo 正在安装依赖...
    npm install
)

:: 使用局部 wrangler 部署
echo 正在部署到 Cloudflare Workers...
call .\node_modules\.bin\wrangler deploy

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 部署成功！
    echo ========================================
) else (
    echo.
    echo ========================================
    echo 部署失败，请检查错误信息
    echo ========================================
)

pause