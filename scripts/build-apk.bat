@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo.
echo ========================================
echo   Kelajak Markazi — Android APK
echo   API: https://kelajak-api.onrender.com/api
echo ========================================
echo.
echo 1-qadam: Expo ga kiring (birinchi marta)
echo   cd mobile
echo   npx eas-cli login
echo   npx eas-cli init
echo.
echo 2-qadam: APK yig'ish
echo   npm run build:apk
echo.
set /p GO="Expo ga kirgansizmi? (y/n): "
if /i not "%GO%"=="y" (
  echo Avval: cd mobile ^&^& npx eas-cli login
  pause
  exit /b 0
)
call npm run build:apk -- --url https://kelajak-api.onrender.com/api
pause
