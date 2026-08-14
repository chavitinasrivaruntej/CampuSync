@echo off
echo ==========================================
echo   Starting CampuSync Development Server
echo ==========================================
cd /d "%~dp0"

if not exist node_modules (
    echo [1/2] Installing dependencies (node_modules not found)...
    call npm install
    echo.
)

echo [2/2] Launching Vite Dev Server...
call npm run dev
pause
