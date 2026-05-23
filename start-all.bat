@echo off
title Capstone - Start All Services

echo ===================================================
echo  Capstone Project - Auto Start All Services
echo ===================================================
echo.

REM ===================================
REM Path settings (modify if needed)
REM ===================================
set DOCKER_PATH=C:\dev\data_pipeline_ai-main
set SPRING_PATH=C:\dev\energy-api
set AI_PATH=C:\dev\data_pipeline_ai-main\ai-data-pipeline
set RN_PATH=C:\dev\MyApp

REM Metro port (8081 often conflicts, use 8082)
set METRO_PORT=8082

REM ===================================
REM Check paths exist
REM ===================================
echo [Checking paths]
if not exist "%DOCKER_PATH%" (
    echo [ERROR] DOCKER_PATH not found: %DOCKER_PATH%
    pause
    exit /b 1
)
echo   - DOCKER_PATH: OK

if not exist "%SPRING_PATH%" (
    echo [ERROR] SPRING_PATH not found: %SPRING_PATH%
    pause
    exit /b 1
)
echo   - SPRING_PATH: OK

if not exist "%AI_PATH%" (
    echo [ERROR] AI_PATH not found: %AI_PATH%
    pause
    exit /b 1
)
echo   - AI_PATH: OK

if not exist "%RN_PATH%" (
    echo [ERROR] RN_PATH not found: %RN_PATH%
    pause
    exit /b 1
)
echo   - RN_PATH: OK
echo.

REM ===================================
REM Phase 1: Docker
REM ===================================
echo [1/7] Starting Docker containers...
cd /d "%DOCKER_PATH%"
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Docker failed. Make sure Docker Desktop is running.
    pause
    exit /b 1
)
echo Waiting 15 seconds for Docker to be ready...
timeout /t 15 /nobreak > nul
echo.

REM ===================================
REM Phase 2: Spring Boot
REM ===================================
echo [2/7] Starting Spring Boot...
start "Spring Boot" cmd /k "cd /d %SPRING_PATH% && gradlew.bat bootRun"
echo Waiting 20 seconds for Spring Boot...
timeout /t 20 /nobreak > nul
echo.

REM ===================================
REM Phase 3: FastAPI
REM ===================================
echo [3/7] Starting FastAPI...
start "FastAPI" cmd /k "cd /d %AI_PATH% && python -m uvicorn api_serving.main:app --host 0.0.0.0 --port 8000"
timeout /t 5 /nobreak > nul
echo.

REM ===================================
REM Phase 4: Virtual Sensor first
REM ===================================
echo [4/7] Starting Virtual ESP32 Sensor...
start "ESP32 Sensor" cmd /k "cd /d %AI_PATH%\simulators && python virtual_esp32_sensor.py"
echo Waiting 5 seconds for sensor to publish data...
timeout /t 5 /nobreak > nul
echo.

REM ===================================
REM Phase 5: Ingestion Worker
REM ===================================
echo [5/7] Starting Kafka Ingestion Worker...
start "Ingestion Worker" cmd /k "cd /d %AI_PATH%\workers && python ingestion_api.py"
timeout /t 3 /nobreak > nul
echo.

REM ===================================
REM Phase 6: Metro Bundler (port 8082)
REM ===================================
echo [6/7] Starting React Native Metro on port %METRO_PORT%...
start "RN Metro" cmd /k "cd /d %RN_PATH% && npx react-native start --port %METRO_PORT%"
echo Waiting 10 seconds for Metro...
timeout /t 10 /nobreak > nul
echo.

REM ===================================
REM Phase 7: Android Build (port 8082)
REM ===================================
echo [7/7] Building React Native Android App on port %METRO_PORT%...
echo (Make sure the emulator is already running!)
start "RN Android" cmd /k "cd /d %RN_PATH% && npx react-native run-android --port %METRO_PORT%"
echo.

echo ===================================================
echo  All services started!
echo ===================================================
echo.
echo Status check:
echo   - Kafka UI: http://localhost:8090
echo   - FastAPI: http://localhost:8000/docs
echo   - Spring Boot: http://localhost:8085
echo   - Metro: http://localhost:%METRO_PORT%
echo.
echo To stop: run stop-all.bat
echo.
pause