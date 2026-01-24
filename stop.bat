@echo off
chcp 65001 >nul
echo ========================================
echo Stopping AMZ Auto AI Services (Frontend & Backend)
echo ========================================
echo.

echo [1/2] Killing application processes...
REM Kill Node.js (Frontend)
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Stopped Node.js processes
) else (
    echo [INFO] No Node.js processes found
)

REM Kill Python (Backend)
taskkill /f /im python.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Stopped Python processes
) else (
    echo [INFO] No Python processes found
)

echo.
echo [2/2] Checking and freeing app ports...

REM Only kill app ports (4070, 8800), leave Docker ports alone
for %%p in (4070 8800) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":%%p" ^| find "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
        echo [OK] Freed port %%p [PID: %%a]
    )
)

echo.
echo [INFO] Docker containers are kept running for faster restart.
echo [INFO] To stop Docker containers, run 'docker compose -f docker-compose-unified.yml stop' manually.

echo.
echo ========================================
echo Application services stopped
echo ========================================
pause