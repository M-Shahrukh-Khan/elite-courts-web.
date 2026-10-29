@echo off
setlocal enabledelayedexpansion
title EliteCourts - Dev Server

rem === Always run from the folder this file lives in ===
cd /d "%~dp0"

echo ============================================================
echo   EliteCourts website - starting up
echo ============================================================
echo.

rem === 1. Check Node.js is installed ===
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js was not found on this computer.
    echo Please install Node.js 22 or newer from https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node --version') do set NODEVER=%%v
echo Using Node.js !NODEVER!
echo.

rem === 2. Make sure an environment file exists ===
if not exist ".env.local" (
    if exist ".env.example" (
        echo No .env.local found. Creating one from .env.example ...
        copy ".env.example" ".env.local" >nul
        echo Created .env.local. You may edit it later to add real keys.
        echo.
    )
)

rem === 3. Install dependencies the first time (or if missing) ===
if not exist "node_modules" (
    echo Installing dependencies for the first time. This may take a few minutes ...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed. Please check the messages above.
        pause
        exit /b 1
    )
    echo.
)

rem === 4. Open the browser shortly after the server starts ===
echo The website will open in your browser at http://localhost:3000
echo Keep this window open while you use the site.
echo Press Ctrl+C in this window to stop the server.
echo.
rem === start "" /b cmd /c "timeout /t 5 >nul & start http://localhost:3000"

rem === 5. Start the Next.js dev server ===
call npm run dev

echo.
echo Server stopped.
pause
