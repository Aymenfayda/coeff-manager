@echo off

echo.
echo  ==========================================
echo   CoeffManager - Starting...
echo  ==========================================
echo.
echo  App       : http://localhost:3003
echo.

:: Check node is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: node.exe not found. Install Node.js first.
    pause
    exit /b 1
)

:: Kill anything already on port 3003
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3003"') do taskkill /F /PID %%a >nul 2>nul

echo Building frontend...
cd /d C:\Users\aymen\coeff-manager\frontend
set NODE_OPTIONS=--max-old-space-size=512
call npm run build
set NODE_OPTIONS=
if errorlevel 1 (
    echo ERROR: Frontend build failed.
    pause
    exit /b 1
)

echo Starting server...
start "CoeffManager" cmd /k "cd /d C:\Users\aymen\coeff-manager\backend && node --max-old-space-size=512 server.js"

:: Give the server 5 seconds to start before opening the browser
timeout /t 5 /nobreak >nul
start http://localhost:3003
