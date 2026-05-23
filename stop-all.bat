@echo off
title Capstone - Stop All Services

echo ===================================================
echo  Capstone Project - Stop All Services
echo ===================================================
echo.

echo [1/4] Stopping Spring Boot (Java)...
taskkill /F /IM java.exe 2>nul
echo.

echo [2/4] Stopping Python processes...
taskkill /F /IM python.exe 2>nul
echo.

echo [3/4] Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul
echo.

echo [4/4] Stopping Docker containers...
cd /d C:\dev\data_pipeline_ai-main
docker-compose down
echo.

echo ===================================================
echo  All services stopped!
echo ===================================================
echo.
pause
