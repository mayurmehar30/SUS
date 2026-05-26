@echo off
setlocal
title SUS - Stop Services

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

cls
echo.
echo  =====================================================
echo    SUS - Stopping all services
echo  =====================================================
echo.

:: Kill Backend window (title set to SUS-Backend in start.bat)
echo  [1/3] Stopping Spring Boot backend...
taskkill /FI "WINDOWTITLE eq SUS-Backend" /T /F >nul 2>&1
echo  [OK] Backend stopped.

:: Kill Frontend window (title set to SUS-Frontend in start.bat)
echo  [2/3] Stopping Next.js frontend...
taskkill /FI "WINDOWTITLE eq SUS-Frontend" /T /F >nul 2>&1
echo  [OK] Frontend stopped.

:: Stop PostgreSQL container
echo  [3/3] Stopping PostgreSQL container...
cd /d "%ROOT%"
docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose stop postgres
) else (
    docker compose stop postgres
)
echo  [OK] PostgreSQL stopped.

echo.
echo  All services stopped. Run start.bat to start again.
echo.
timeout /t 3 /nobreak >nul
exit /b 0
