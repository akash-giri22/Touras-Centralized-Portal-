@echo off
title Touras Portal - Docker
color 0A

echo.
echo  ==========================================
echo   TOURAS PORTAL - DOCKER LAUNCHER
echo  ==========================================
echo.

echo  [1] Checking Docker...
docker -v > nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo  !! ERROR: Docker is NOT installed !!
    echo.
    echo  Steps to fix:
    echo    1. Go to: https://www.docker.com/products/docker-desktop
    echo    2. Download Docker Desktop for Windows
    echo    3. Install and RESTART computer
    echo    4. Open Docker Desktop (whale icon in taskbar)
    echo    5. Wait for it to say "Docker is running"
    echo    6. Run this file again
    echo.
    pause
    exit /b 1
)
echo  [OK] Docker found
echo.

echo  [2] Checking Docker is running...
docker info > nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0E
    echo.
    echo  !! Docker is installed but NOT running !!
    echo.
    echo  Fix: Open Docker Desktop from Start Menu
    echo       Wait for it to say "Docker is running"
    echo       Then run this file again
    echo.
    pause
    exit /b 1
)
echo  [OK] Docker is running
echo.

echo  [3] Building and starting Touras Portal...
echo  This takes 3-5 minutes on first run. Please wait...
echo.

docker-compose up --build -d

IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo  !! Docker build failed !!
    echo  See errors above. Try running: docker-compose logs
    echo.
    pause
    exit /b 1
)

echo.
echo  ==========================================
echo.
echo   [SUCCESS] Portal is running!
echo.
echo   URL    : http://localhost:3000
echo.
echo   LOGINS :
echo   Admin    - admin@touras.com    / admin123
echo   Manager  - manager@touras.com  / manager123
echo   Employee - employee@touras.com / employee123
echo.
echo   To STOP:  run docker-compose down
echo  ==========================================
echo.

timeout /t 3 /nobreak > nul
start http://localhost:3000

pause
