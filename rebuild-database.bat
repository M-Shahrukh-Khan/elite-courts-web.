@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
echo Elite Courts - DESTRUCTIVE TEST DATABASE REBUILD
echo This deletes application data and administrator Auth identities.
echo Do not use this on production. For a new database use install-database.bat.
echo.
where node >nul 2>&1
if errorlevel 1 goto :missing
node -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 1)"
if errorlevel 1 goto :missing
if not exist "node_modules\pg\package.json" goto :missing
node "scripts\rebuild-database.mjs" --interactive
if errorlevel 1 goto :failed
pause
exit /b 0
:missing
echo Install Node.js 24 LTS and run npm ci before continuing.
:failed
echo Rebuild did not complete. Read the message above before retrying.
pause
exit /b 1
