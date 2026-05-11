@echo off
title Hospedaje Digital
cd /d "%~dp0"

echo Iniciando Backend (puerto 3000)...
start "BACKEND - Hospedaje Digital" cmd /k "cd /d "%~dp0BACKEND" && node src/server.js"

timeout /t 2 /nobreak >nul

echo Iniciando Frontend (puerto 8080)...
start "FRONTEND - Hospedaje Digital" cmd /k "cd /d "%~dp0" && node serve-frontend.js"

echo.
echo Servidores iniciados.
echo   Frontend: http://localhost:8080
echo   Backend:  http://localhost:3000
echo.
pause
