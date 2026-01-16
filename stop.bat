echo ========================================
echo 停止 AMZ Auto AI 服务
echo ========================================
echo.

echo 停止前端和后端服务...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
echo ? 应用服务已停止

echo.
echo 停止数据库服务...
docker-compose down
echo ? 数据库服务已停止

echo.
echo ========================================
echo 所有服务已停止
echo ========================================
pause
@echo off
chcp 936 >nul
echo ========================================
echo 停止 AMZ Auto AI 服务
echo ========================================
echo.

echo 停止前端和后端服务...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
echo ? 应用服务已停止

echo.
echo 停止数据库服务...
docker-compose down
echo ? 数据库服务已停止

echo.
echo ========================================
echo 所有服务已停止
echo ========================================
pause
