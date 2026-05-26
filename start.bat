@echo off
setlocal enabledelayedexpansion
title SUS - School Uniform System
cls

echo.
echo  =====================================================
echo    School Uniform System (SUS) - Startup Script
echo  =====================================================
echo.

:: Resolve paths
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"

echo  ROOT     : %ROOT%
echo  BACKEND  : %BACKEND%
echo  FRONTEND : %FRONTEND%
echo.

:: Step 1: Check prerequisites
echo [1/5] Checking prerequisites...

where docker >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Docker not found. Please install Docker Desktop.
    pause & exit /b 1
)
echo  [OK] docker found

where mvn >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Maven not found. Please install Maven and add to PATH.
    pause & exit /b 1
)
echo  [OK] mvn found

where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Please install Node.js 20+.
    pause & exit /b 1
)
echo  [OK] node found
echo.

:: Step 2: Start Docker Desktop if not running
echo [2/5] Checking Docker daemon...
docker info >nul 2>&1
if errorlevel 1 (
    echo  Docker not running. Launching Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo  Waiting up to 90 seconds for Docker to start...
    set /a DTIMER=0
    :WAIT_DOCKER
    timeout /t 4 /nobreak >nul
    set /a DTIMER+=4
    docker info >nul 2>&1
    if not errorlevel 1 goto DOCKER_OK
    if !DTIMER! geq 90 (
        echo  [ERROR] Docker did not start. Open Docker Desktop manually then re-run.
        pause & exit /b 1
    )
    echo  Still waiting... !DTIMER!s
    goto WAIT_DOCKER
)
:DOCKER_OK
echo  [OK] Docker daemon is running.
echo.

:: Step 3: Start PostgreSQL
echo [3/5] Starting PostgreSQL via docker-compose...
cd /d "%ROOT%"

docker compose up -d postgres 2>nul
if errorlevel 1 docker-compose up -d postgres

if errorlevel 1 (
    echo  [ERROR] Failed to start PostgreSQL. Check docker-compose.yml.
    pause & exit /b 1
)

echo  Waiting for PostgreSQL to be ready...
set /a PGTIMER=0
:WAIT_PG
timeout /t 2 /nobreak >nul
docker exec sus-postgres pg_isready -U sususer -d susdb >nul 2>&1
if not errorlevel 1 goto PG_OK
set /a PGTIMER+=2
if !PGTIMER! geq 60 (
    echo  [ERROR] PostgreSQL not ready after 60s. Run: docker logs sus-postgres
    pause & exit /b 1
)
echo  Still waiting... !PGTIMER!s
goto WAIT_PG
:PG_OK
echo  [OK] PostgreSQL is ready on localhost:5435
echo.

:: Step 4: Install frontend deps if missing
if not exist "%FRONTEND%\node_modules\next" (
    echo  node_modules not found. Running npm install...
    cd /d "%FRONTEND%"
    call npm install
    if errorlevel 1 (
        echo  [ERROR] npm install failed.
        pause & exit /b 1
    )
    echo  [OK] npm install done.
    echo.
)

:: Step 5: Launch Backend window
echo [4/5] Starting Spring Boot backend (port 8090)...
start "SUS-Backend" cmd /k "cd /d "%BACKEND%" && echo. && echo  [SUS Backend] Starting on port 8090... && echo. && mvn spring-boot:run"
echo  [OK] Backend window launched.
echo.

:: Step 6: Launch Frontend window
echo [5/5] Starting Next.js frontend (port 3000)...
start "SUS-Frontend" cmd /k "cd /d "%FRONTEND%" && echo. && echo  [SUS Frontend] Starting on port 3000... && echo. && npm run dev"
echo  [OK] Frontend window launched.
echo.

:: Done
echo  =====================================================
echo   All services started!
echo  =====================================================
echo.
echo   Frontend  ->  http://localhost:3000
echo   Backend   ->  http://localhost:8090
echo   Swagger   ->  http://localhost:8090/swagger-ui/index.html
echo   Database  ->  localhost:5435 / susdb
echo.
echo   Login     ->  admin@sus.com  /  Admin@123
echo.
echo   NOTE: Backend takes ~30-60s to fully boot on first run.
echo         Watch the "SUS-Backend" window for:
echo         "Started SusApplication in X seconds"
echo.
echo  Press any key to open http://localhost:3000 in your browser...
pause >nul
start "" http://localhost:3000
exit /b 0
