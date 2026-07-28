@echo off
title Resona Music Player
setlocal
cd /d "%~dp0"

echo ========================================
echo   Resona - Music Player
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm not found.
  echo Install Node.js from https://nodejs.org and try again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
  echo Failed to install dependencies.
    pause
    exit /b 1
  )
  echo.
)

echo Starting application...
echo Close this window to stop the app.
echo.
call npm run electron:dev
set ERR=%ERRORLEVEL%

echo.
if %ERR% neq 0 (
  echo Application exited with error code %ERR%.
) else (
  echo Application closed.
)
pause
exit /b %ERR%
