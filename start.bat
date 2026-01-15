@echo off
chcp 65001 >nul
echo ========================================
echo AMZ Auto AI - Project Startup Script
echo ========================================
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Cleanup old containers first
echo [0/5] Cleaning up old containers...
docker stop amz-auto-ai-redis docker-redis 2>nul
docker rm amz-auto-ai-redis docker-redis 2>nul
echo [OK] Old containers cleaned
echo.

echo [1/5] Starting database services (PostgreSQL + Redis)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose startup failed
    pause
    exit /b 1
)
echo [OK] Database services started
echo.

echo [2/5] Starting Dify services...
cd dify\docker
docker compose -p amz-auto-ai up -d
if %errorlevel% neq 0 (
    echo ERROR: Dify Docker Compose startup failed
    pause
    exit /b 1
)
echo [OK] Dify services started (UI: http://localhost:3001)
echo Connecting Dify to amz-network...
docker network connect amz-auto-ai-amz-network amz-auto-ai-api 2>nul
docker network connect amz-auto-ai-amz-network amz-auto-ai-worker 2>nul
docker network connect amz-auto-ai-amz-network amz-auto-ai-worker-beat 2>nul
docker network connect amz-auto-ai-amz-network amz-auto-ai-web 2>nul
docker network connect amz-auto-ai-amz-network amz-auto-ai-nginx 2>nul
docker network connect amz-auto-ai-amz-network amz-auto-ai-redis 2>nul
echo [OK] Dify connected to amz-network
cd /d "%SCRIPT_DIR%"
echo.

echo [3/5] Starting backend service...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing dependencies...
pip install -r requirements.txt -q
echo Starting backend server (port 8000)...
start "Backend Server" cmd /k "cd /d "%SCRIPT_DIR%backend" && venv\Scripts\activate && python run.py"
cd /d "%SCRIPT_DIR%"
echo [OK] Backend server started
echo.

echo [4/5] Starting frontend service...
cd frontend
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)
echo Starting frontend server (port 3000)...
start "Frontend Server" cmd /k "cd /d "%SCRIPT_DIR%frontend" && npm run dev"
cd /d "%SCRIPT_DIR%"
echo [OK] Frontend server started
echo.

echo [5/5] Waiting for services to be ready...
echo.
echo ========================================
echo [OK] All services are running
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Dify UI:  http://localhost:3001
echo Dify API: http://localhost:5001
echo Database: PostgreSQL (port 5433)
echo Cache AMZ:  Redis (port 6380)
echo Cache Dify: Redis (port 6381)
echo.
echo Press Ctrl+C to stop all services
echo.

pause
docker network disconnect amz-auto-ai-amz-network amz-auto-ai-api 2>nul
docker network disconnect amz-auto-ai-amz-network amz-auto-ai-worker 2>nul
docker network disconnect amz-auto-ai-amz-network amz-auto-ai-worker-beat 2>nul
docker network disconnect amz-auto-ai-amz-network amz-auto-ai-web 2>nul
docker network disconnect amz-auto-ai-amz-network amz-auto-ai-nginx 2>nul
docker network disconnect amz-auto-ai-amz-network amz-auto-ai-redis 2>nul
cd dify\docker
docker compose -p amz-auto-ai down
cd /d "%SCRIPT_DIR%"
docker-compose down
echo All services stopped
