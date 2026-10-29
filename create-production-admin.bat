@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
echo Elite Courts production administrator setup
echo.
where node >nul 2>&1
if errorlevel 1 goto :missing
node -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 1)"
if errorlevel 1 goto :missing
if not exist "node_modules\tsx\dist\cli.mjs" goto :missing
rem Node reads answers directly; user input never becomes shell commands.
node "node_modules\tsx\dist\cli.mjs" "scripts\bootstrap-production-admin.ts" --interactive --log-file "logs\admin-bootstrap.log"
if errorlevel 1 (
  echo.
  echo Setup did not complete cleanly. Read the message above before retrying.
  pause
  exit /b 1
)
echo.
echo Administrator creation completed.
pause
exit /b 0
:missing
echo Install Node.js 24 LTS and run npm ci before continuing.
pause
exit /b 1
