@echo off
setlocal
cd /d "%~dp0"

set "NO_PAUSE="
if /I "%~1"=="--no-pause" (
  set "NO_PAUSE=1"
  shift
)

if "%~1"=="" goto unit
if /I "%~1"=="unit" goto unit
if /I "%~1"=="coverage" goto coverage
if /I "%~1"=="e2e" goto e2e
if /I "%~1"=="all" goto all

echo Unknown test mode: %~1
echo Usage: run-tests.bat [unit^|coverage^|e2e^|all]
set ERR=1
goto finish

:unit
echo Running unit tests...
call npm test
set ERR=%ERRORLEVEL%
goto finish

:coverage
echo Running unit tests with coverage...
call npm run test:coverage
set ERR=%ERRORLEVEL%
goto finish

:e2e
echo Running E2E tests...
call npm run test:e2e
set ERR=%ERRORLEVEL%
goto finish

:all
echo Running unit tests...
call npm test
if errorlevel 1 (
  set ERR=%ERRORLEVEL%
  goto finish
)
echo.
echo Running E2E tests...
call npm run test:e2e
set ERR=%ERRORLEVEL%
goto finish

:finish
if "%NO_PAUSE%"=="1" exit /b %ERR%
echo.
if %ERR% neq 0 (
  echo Tests FAILED with exit code %ERR%.
) else (
  echo Tests PASSED.
)
pause
exit /b %ERR%
