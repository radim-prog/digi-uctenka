@echo off
echo ========================================
echo  INSTALACE DIGI-UCTENKA
echo ========================================
echo.
echo Instaluji zavislosti...
cd /d "%~dp0"
call npm install
echo.
echo ========================================
echo  HOTOVO!
echo ========================================
echo.
echo Nyní spustte START.bat pro spusteni aplikace
echo.
pause
