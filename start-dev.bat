@echo off

echo.
echo  ==========================================
echo   CoeffManager - DEV MODE (no build)
echo  ==========================================
echo.
echo  Backend   : http://localhost:3003
echo  Frontend  : http://localhost:3002
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: node.exe not found.
    pause
    exit /b 1
)

:: Kill stale processes on both ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3003"') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002"') do taskkill /F /PID %%a >nul 2>nul

:: Backend with capped memory
start "CoeffManager Backend" cmd /k "set NODE_OPTIONS=--max-old-space-size=256 && cd /d C:\Users\aymen\coeff-manager\backend && node server.js"

:: Give backend 3 seconds then start Vite dev server with capped memory
timeout /t 3 /nobreak >nul
start "CoeffManager Frontend" cmd /k "set NODE_OPTIONS=--max-old-space-size=256 && cd /d C:\Users\aymen\coeff-manager\frontend && npm run dev"

:: Open browser once Vite is ready
timeout /t 5 /nobreak >nul
start http://localhost:3002
