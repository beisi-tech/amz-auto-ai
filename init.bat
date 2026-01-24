@echo off
chcp 65001 >nul
echo ========================================
echo AMZ Auto AI - Project Initialization Script
echo ========================================
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [0/4] Cleaning up old containers...
:check_docker
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop is NOT running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
docker stop amz-auto-ai-redis docker-redis amz-auto-ai-dify-init 2>nul
docker rm amz-auto-ai-redis docker-redis amz-auto-ai-dify-init 2>nul
echo [OK] Old containers cleaned
echo.

echo [0.5/4] Initializing Dify permissions...
docker run --rm -v amz-auto-ai_dify_app_storage:/app/api/storage busybox:latest sh -c "echo 'Initializing permissions for /app/api/storage'; chown -R 1001:1001 /app/api/storage; echo 'Permissions initialized.'"
echo [OK] Permissions initialized
echo.

echo [1/4] Starting all services (AMZ + Dify)...
docker-compose -f docker-compose-unified.yml up -d
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose startup failed
    pause
    exit /b 1
)
echo [OK] All services started
echo.

echo [2/4] Starting backend service...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing dependencies...
pip install -r requirements.txt -q
echo Starting backend server (port 8800)...
start "Backend Server" cmd /k "cd /d "%SCRIPT_DIR%backend" && venv\Scripts\activate && python run.py"
cd /d "%SCRIPT_DIR%"
echo [OK] Backend server started
echo.

echo [3/4] Starting frontend service...
cd frontend
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)
echo Starting frontend server (port 4070)...
start "Frontend Server" cmd /k "cd /d "%SCRIPT_DIR%frontend" && npm run dev"
cd /d "%SCRIPT_DIR%"
echo [OK] Frontend server started
echo.

echo [4/4] Waiting for services to be ready...
echo.
echo ========================================
echo [OK] All services are running
echo ========================================
echo.
echo Frontend: http://localhost:4070
echo Frontend-admin: http://localhost:4070/admin
echo Backend:  http://localhost:8800
echo API Docs: http://localhost:8800/docs
echo Dify UI:  http://localhost:4080
echo Dify API: http://localhost:5001/health
echo Database AMZ: PostgreSQL (port 5433)
echo Database Dify: PostgreSQL (port 5434)
echo Cache AMZ:  Redis (port 6900)
echo Cache Dify: Redis (port 6901)
echo.
echo Press any key to exit this window (Services will keep running)...
pause >nul