@echo off
chcp 65001 >nul
echo ========================================
echo AMZ Auto AI - Quick Start (App Only)
echo ========================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [INFO] Assuming Docker services (Postgres, Redis, Dify) are already running.
echo [INFO] If not, please run 'init.bat' or 'docker compose up -d' manually.
echo.

echo [1/2] Starting Backend...
start "Backend Server" cmd /k "cd /d "%SCRIPT_DIR%backend" && venv\Scripts\activate && python run.py"

echo [2/2] Starting Frontend...
start "Frontend Server" cmd /k "cd /d "%SCRIPT_DIR%frontend" && npm run dev"

echo.
echo ========================================
echo Application services started!
echo ========================================
echo Frontend: http://localhost:4070
echo Backend:  http://localhost:8800
echo.
pause