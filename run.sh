#!/usr/bin/env bash
set -e

echo "================================================================"
echo "   SKYWATCH - Drone Surveillance & Geospatial Command Center"
echo "   CipherCop Hackathon 2026 Production Startup"
echo "================================================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# 1. Virtual environment setup
if [ ! -d "venv" ]; then
    echo "[*] Creating Python virtual environment..."
    python3 -m venv venv
    echo "[*] Installing backend dependencies..."
    ./venv/bin/pip install --upgrade pip
    ./venv/bin/pip install fastapi uvicorn "websockets>=12.0" sqlalchemy pydantic python-multipart pytest httpx pillow shapely pyjwt cryptography bcrypt opencv-python ultralytics
fi

# 2. Seed database
echo "[*] Initializing database and demo telemetry..."
export PYTHONPATH=.
./venv/bin/python -m backend.app.db.seed

# 3. Frontend setup
if [ ! -d "frontend/node_modules" ]; then
    echo "[*] Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "================================================================"
echo "[OK] Launching SkyWatch Mission Control Servers:"
echo "     Backend API:   http://localhost:8000 (Swagger: /docs)"
echo "     Frontend UI:   http://localhost:5173"
echo "     Judge Admin:   admin / Admin@SkyWatch2026"
echo "     Operator:      operator / Operator@SkyWatch2026"
echo "================================================================"

# Trap SIGINT to kill background processes cleanly
trap 'kill 0' EXIT

export PYTHONPATH=.
./venv/bin/python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &
cd frontend && npm run dev &

wait
