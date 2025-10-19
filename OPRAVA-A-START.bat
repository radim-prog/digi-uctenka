@echo off
echo ========================================
echo  OPRAVA A SPUSTENI
echo ========================================
echo.
cd /d "%~dp0"

echo Mazu problematicky soubor...
del /f /q lib\firebase-admin.ts 2>nul

echo.
echo Builduji aplikaci...
call npm run build

if errorlevel 1 (
    echo.
    echo Build selhal! Zkontrolujte chyby vyse.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  SPOUSTIM SERVER...
echo ========================================
echo.
call npm start
