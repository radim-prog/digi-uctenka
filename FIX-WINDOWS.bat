@echo off
echo ========================================
echo  OPRAVA PRO WINDOWS
echo ========================================
echo.
echo Mazu node_modules a reinstaluju...
cd /d "%~dp0"

rmdir /s /q node_modules
rmdir /s /q .next

echo.
echo Instaluji znovu s --force...
call npm install --force

echo.
echo Zkousim build znovu...
call npm run build

echo.
echo ========================================
echo  HOTOVO! Zkuste spustit START.bat
echo ========================================
pause
