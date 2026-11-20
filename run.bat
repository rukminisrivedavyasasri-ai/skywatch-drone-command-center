@echo off
echo ================================================================
echo    SKYWATCH - Drone Surveillance & Geospatial Command Center
echo    CipherCop Hackathon 2026 Production Startup
echo ================================================================

cd /d "%~dp0"

:: 1. Python virtual environment check
if not exist "venv\Scripts\python.exe" (
    echo [*] Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to initialize Python virtual environment.
        pause
        exit /b 1
    )
    echo [*] Installing backend dependencies...
    venv\Scripts\pip install fastapi uvicorn "websockets>=12.0" sqlalchemy pydantic python-multipart pytest httpx pillow shapely pyjwt cryptography bcrypt opencv-python ultralytics
)

:: 2. Initialize and Seed Database
echo [*] Initializing database and demo telemetry...
set PYTHONPATH=.
venv\Scripts\python -m backend.app.db.seed

:: 3. Frontend dependency check
if not exist "frontend\node_modules" (
    echo [*] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo ================================================================
echo [OK] Launching SkyWatch Mission Control Servers:
echo      Backend API:   http://localhost:8000 (Swagger: /docs)
echo      Frontend UI:   http://localhost:5173
echo      Judge Admin:   admin / Admin@SkyWatch2026
echo      Operator:      operator / Operator@SkyWatch2026
echo ================================================================

:: Start Backend server in new window
start "SkyWatch Backend Engine" cmd /k "set PYTHONPATH=. && venv\Scripts\python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Start Frontend dev server in new window
start "SkyWatch Frontend UI" cmd /k "cd frontend && npm run dev"

echo [SUCCESS] Both servers launched. Opening browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:5173
