import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.db.session import init_db
from backend.app.db.seed import seed_database
from backend.app.services.simulator import simulator
from backend.app.routers import (
    auth,
    drones,
    geofences,
    alerts,
    detections,
    missions,
    analytics,
    export,
    websocket
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Seed demo data
    print("[INIT] Initializing database tables and seeding demo telemetry...")
    init_db()
    seed_database()
    
    # Ensure sample data storage folders exist
    for sub in ["aerial_images", "uploads", "annotated"]:
        os.makedirs(os.path.join(settings.STORAGE_DIR, sub), exist_ok=True)
        
    # Start the 1Hz Fleet Simulator
    simulator.start()
    yield
    # Shutdown: Stop simulator
    simulator.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SkyWatch: Drone Surveillance & Geospatial Mapping Command Center API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for sample images & annotated detections
sample_data_path = os.path.abspath(settings.STORAGE_DIR)
os.makedirs(sample_data_path, exist_ok=True)
app.mount("/sample_data", StaticFiles(directory=sample_data_path), name="sample_data")

# Register REST Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(drones.router, prefix=settings.API_PREFIX)
app.include_router(geofences.router, prefix=settings.API_PREFIX)
app.include_router(alerts.router, prefix=settings.API_PREFIX)
app.include_router(detections.router, prefix=settings.API_PREFIX)
app.include_router(missions.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(export.router, prefix=settings.API_PREFIX)

# Register WebSocket Endpoint
app.include_router(websocket.router)

@app.get("/api/health")
def health_check():
    """System health check & simulator status."""
    return {
        "status": "healthy",
        "system": "SkyWatch Mission Control",
        "simulator_active": simulator.is_running,
        "version": settings.VERSION
    }
