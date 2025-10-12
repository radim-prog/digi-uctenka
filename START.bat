@echo off
echo ========================================
echo  SPOUSTIM DIGI-UCTENKA
echo ========================================
echo.
cd /d "%~dp0"

echo Builduji aplikaci (prvni spusteni muze trvat par minut)...
call npm run build

echo.
echo ========================================
echo  SPOUSTIM SERVER...
echo ========================================
echo.
call npm start

pause
