@echo off
chcp 936 >nul
echo ========================================
echo AMZ Auto AI - 项目启动脚本
echo ========================================
echo.

echo [1/4] 启动数据库服务 (PostgreSQL + Redis)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo 错误: Docker Compose 启动失败
    pause
    exit /b 1
)
echo ? 数据库服务已启动
echo.

echo [2/4] 启动后端服务...
cd backend
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)
call venv\Scripts\activate
echo 安装依赖...
pip install -r requirements.txt -q
echo 启动后端服务 (端口 8000)...
start "Backend Server" cmd /k "cd %CD% && venv\Scripts\activate && python run.py"
cd ..
echo ? 后端服务已启动
echo.

echo [3/4] 启动前端服务...
cd frontend
if not exist "node_modules" (
    echo 安装依赖...
    call npm install
)
echo 启动前端服务 (端口 3000)...
start "Frontend Server" cmd /k "cd %CD% && npm run dev"
cd ..
echo ? 前端服务已启动
echo.

echo [4/4] 等待服务就绪...
echo.
echo ========================================
echo ? 所有服务已启动！
echo ========================================
echo.
echo 前端地址: http://localhost:3000
echo 后端 API: http://localhost:8000
echo API 文档: http://localhost:8000/docs
echo 数据库:   PostgreSQL (端口 5433)
echo 缓存:     Redis (端口 6379)
echo.
echo 按 Ctrl+C 可以停止所有服务
echo.

pause
docker-compose down
echo 所有服务已停止
