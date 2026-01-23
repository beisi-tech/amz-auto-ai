@echo off
chcp 65001 >nul
echo ========================================
echo Stopping AMZ Auto AI Services
echo ========================================
echo.

echo Stopping frontend and backend services...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
echo [OK] Application services stopped

echo.
echo Stopping all Docker services...
docker compose -f docker-compose-unified.yml down
echo [OK] All Docker services stopped

echo.
echo ========================================
echo All services stopped
echo ========================================
pause
