@echo off
echo ========================================================
echo   BIODIVERSITY - Interactive 3D Digital Magazine
echo ========================================================
echo.

echo Checking ports and launching backend server (Port 5001)...
start "BIODIVERSITY Backend" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3 /nobreak >nul

echo Launching frontend client (Port 3000)...
start "BIODIVERSITY Frontend" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 2 /nobreak >nul
echo.
echo ========================================================
echo   Application started!
echo   Public Website:       http://localhost:3000
echo   Admin Portal:         http://localhost:3000/secure-admin-portal/login
echo   Backend API:          http://localhost:5001/api/health
echo ========================================================

