@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
echo Elite Courts - install a NEW, EMPTY production database
echo Existing application tables cause this installer to stop without replacing them.
echo.
where node >nul 2>&1
if errorlevel 1 goto :missing
node -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 1)"
if errorlevel 1 goto :missing
if not exist "node_modules\pg\package.json" goto :missing
node "scripts\install-database.mjs"
if errorlevel 1 goto :failed
echo.
echo Next: run create-production-admin.bat and select owner for the first user.
pause
exit /b 0
:missing
echo Install Node.js 24 LTS and run npm ci before continuing.
:failed
echo Database installation did not complete. Read the error above.
pause
exit /b 1
