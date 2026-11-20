from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.models import Drone, TelemetrySample, User
from backend.app.schemas.schemas import DroneResponse, DroneCreate, DroneUpdate, DroneCommand, TelemetryResponse
from backend.app.routers.auth import get_current_user, require_admin
from backend.app.services.simulator import simulator

router = APIRouter(prefix="/drones", tags=["Fleet Management"])

@router.get("", response_model=list[DroneResponse])
def list_drones(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all deployed fleet drones with real-time state."""
    drones = db.query(Drone).all()
    return drones

@router.get("/{id}")
def get_drone(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get single drone state along with historical telemetry samples."""
    drone = db.query(Drone).filter(Drone.id == id).first()
    if not drone:
        raise HTTPException(status_code=404, detail=f"Drone {id} not found")
        
    history = (
        db.query(TelemetrySample)
        .filter(TelemetrySample.drone_id == id)
        .order_by(TelemetrySample.timestamp.desc())
        .limit(30)
        .all()
    )
    # Reverse to chronological order
    history.reverse()

    return {
        "drone": DroneResponse.from_orm(drone),
        "history": [TelemetryResponse.from_orm(h) for h in history]
    }

@router.post("", response_model=DroneResponse, status_code=status.HTTP_201_CREATED)
def create_drone(
    drone_in: DroneCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Register a new drone in the fleet (ADMIN only)."""
    existing = db.query(Drone).filter(Drone.id == drone_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Drone with this ID already exists.")
        
    drone = Drone(
        id=drone_in.id,
        name=drone_in.name,
        model=drone_in.model,
        serial_number=drone_in.serial_number,
        latitude=drone_in.latitude,
        longitude=drone_in.longitude,
        altitude=drone_in.altitude,
        speed=10.0,
        heading=0.0,
        battery=100.0,
        signal_strength=98,
        status="active"
    )
    db.add(drone)
    db.commit()
    db.refresh(drone)
    return drone

@router.patch("/{id}", response_model=DroneResponse)
def update_drone(
    id: str,
    drone_update: DroneUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Modify drone attributes (ADMIN only)."""
    drone = db.query(Drone).filter(Drone.id == id).first()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")
        
    if drone_update.name is not None:
        drone.name = drone_update.name
    if drone_update.status is not None:
        drone.status = drone_update.status
    if drone_update.speed is not None:
        drone.speed = drone_update.speed
    if drone_update.altitude is not None:
        drone.altitude = drone_update.altitude
        
    db.commit()
    db.refresh(drone)
    return drone

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_drone(
    id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Decommission drone from fleet (ADMIN only)."""
    drone = db.query(Drone).filter(Drone.id == id).first()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")
        
    db.delete(drone)
    db.commit()
    return None

@router.post("/{id}/command")
def execute_drone_command(
    id: str,
    cmd: DroneCommand,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send tactical command to a drone."""
    drone = db.query(Drone).filter(Drone.id == id).first()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")

    action = cmd.command.lower()
    if action == "return_to_base":
        simulator.command_return_to_base(id, db)
        return {"status": "success", "message": f"{drone.name} returning to base."}
    elif action == "pause":
        simulator.command_pause(id, db)
        return {"status": "success", "message": f"{drone.name} holding position (hover)."}
    elif action == "resume":
        simulator.command_resume(id, db)
        return {"status": "success", "message": f"{drone.name} resumed mission patrol."}
    elif action == "goto":
        if cmd.target_latitude is None or cmd.target_longitude is None:
            raise HTTPException(status_code=400, detail="Goto command requires target_latitude and target_longitude.")
        simulator.command_goto(id, cmd.target_latitude, cmd.target_longitude, db)
        return {"status": "success", "message": f"{drone.name} routed to waypoint [{cmd.target_latitude}, {cmd.target_longitude}]."}
    elif action == "assign_route":
        if not cmd.route or len(cmd.route) < 2:
            raise HTTPException(status_code=400, detail="Assign route requires at least 2 waypoints.")
        simulator.command_assign_route(id, cmd.route, db)
        return {"status": "success", "message": f"Assigned {len(cmd.route)} waypoints to {drone.name}."}
    else:
        raise HTTPException(status_code=400, detail=f"Unknown command '{cmd.command}'.")
