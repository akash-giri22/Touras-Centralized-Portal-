@echo off
title Touras - System Check
color 0B

echo.
echo  ==========================================
echo   SYSTEM DIAGNOSTIC - READ CAREFULLY
echo  ==========================================
echo.

echo  [1] Node.js check...
node -v
IF %ERRORLEVEL% NEQ 0 (
    echo      RESULT: NOT INSTALLED
    echo      FIX: Go to https://nodejs.org and install LTS version
) ELSE (
    echo      RESULT: OK
)
echo.

echo  [2] npm check...
npm -v
IF %ERRORLEVEL% NEQ 0 (
    echo      RESULT: NOT FOUND
    echo      FIX: Reinstall Node.js from nodejs.org
) ELSE (
    echo      RESULT: OK
)
echo.

echo  [3] Current folder:
cd
echo.

echo  [4] Files in this folder:
dir /b
echo.

echo  [5] package.json check...
IF EXIST "package.json" (
    echo      RESULT: FOUND - correct folder
) ELSE (
    echo      RESULT: MISSING - WRONG FOLDER!
    echo      FIX: Open the touras folder and run BAT from inside it
)
echo.

echo  [6] node_modules check...
IF EXIST "node_modules\" (
    echo      RESULT: EXISTS - already installed
) ELSE (
    echo      RESULT: NOT FOUND - need to run npm install
)
echo.

echo  ==========================================
echo   Screenshot this window and share if stuck
echo  ==========================================
echo.
pause
