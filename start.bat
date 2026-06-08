@echo off
title Touras Portal - Setup
color 0A

echo.
echo  ==========================================
echo   TOURAS ENTERPRISE PORTAL - SETUP
echo  ==========================================
echo.

echo  [STEP 1/4] Checking Node.js...
node -v > nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo  !! ERROR: Node.js is NOT installed !!
    echo.
    echo  Follow these steps:
    echo    1. Open your browser
    echo    2. Go to: https://nodejs.org
    echo    3. Click the big "LTS" download button
    echo    4. Install it (keep clicking Next)
    echo    5. RESTART your computer
    echo    6. Run this file again
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODEVER=%%i
echo  [OK] Node.js %NODEVER% found
echo.

echo  [STEP 2/4] Checking project files...
IF NOT EXIST "package.json" (
    color 0C
    echo.
    echo  !! ERROR: Wrong folder !!
    echo.
    echo  This BAT file must be inside the touras folder.
    echo  You should see package.json in the same folder as this file.
    echo.
    echo  Current folder is:
    cd
    echo.
    pause
    exit /b 1
)
echo  [OK] Project files found
echo.

echo  [STEP 3/4] Installing packages...
IF EXIST "node_modules\" (
    echo  [OK] Packages already installed, skipping...
) ELSE (
    echo  Installing... this takes 2-3 minutes on first run.
    echo  Do NOT close this window!
    echo.
    call npm install
    IF %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo  !! ERROR: npm install failed !!
        echo  Check your internet connection and try again.
        echo.
        pause
        exit /b 1
    )
    echo  [OK] Packages installed successfully!
)
echo.

echo  [STEP 4/4] Starting the portal...
echo.
echo  ==========================================
echo.
echo   URL    : http://localhost:3000
echo.
echo   LOGINS :
echo   Admin    - admin@touras.com    / admin123
echo   Manager  - manager@touras.com  / manager123
echo   Employee - employee@touras.com / employee123
echo.
echo   Keep this window OPEN while using portal
echo   Press Ctrl+C to stop
echo.
echo  ==========================================
echo.

timeout /t 4 /nobreak > nul
start http://localhost:3000

call npm run dev

echo.
color 0C
echo  Server stopped. See any errors above.
echo.
pause
