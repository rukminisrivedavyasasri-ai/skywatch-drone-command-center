import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.models import Mission, MissionWaypoint, Drone, User
from backend.app.schemas.schemas import (
    MissionPlanRequest,
    MissionPlanResponse,
    MissionAssignRequest,
    MissionResponse,
    MissionWaypointItem
)
from backend.app.routers.auth import get_current_user
from backend.app.services.mission_planner import generate_lawnmower_path
from backend.app.services.simulator import simulator

router = APIRouter(prefix="/missions", tags=["Mission Planning"])

@router.post("/plan", response_model=MissionPlanResponse)
def plan_survey_mission(
    req: MissionPlanRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate optimized autonomous lawnmower (boustrophedon) flight paths
    across arbitrary polygon search/patrol zones.
    """
    if len(req.polygon) < 3:
        raise HTTPException(status_code=400, detail="Polygon must contain at least 3 points.")
        
    try:
        plan = generate_lawnmower_path(
            polygon_coords=req.polygon,
            altitude=req.altitude,
            overlap_percentage=req.overlap_percentage
        )
        plan.name = req.name
        return plan
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Mission planning failed: {str(e)}")

@router.post("", response_model=MissionResponse, status_code=status.HTTP_201_CREATED)
def save_mission(
    plan: MissionPlanResponse,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a planned survey mission with waypoints into the database."""
    mission = Mission(
        name=plan.name,
        mission_type="survey_lawnmower",
        status="planned",
        target_altitude=plan.target_altitude,
        overlap_percentage=plan.overlap_percentage,
        estimated_distance_km=plan.estimated_distance_km,
        estimated_duration_minutes=plan.estimated_duration_minutes,
        estimated_battery_cost=plan.estimated_battery_cost,
        area_km2=plan.area_km2,
        boundary_polygon=json.dumps(plan.boundary_polygon)
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)

    for wp in plan.waypoints:
        db_wp = MissionWaypoint(
            mission_id=mission.id,
            sequence=wp.sequence,
            latitude=wp.latitude,
            longitude=wp.longitude,
            altitude=wp.altitude,
            action=wp.action,
            is_reached=False
        )
        db.add(db_wp)
    db.commit()
    db.refresh(mission)

    return MissionResponse(
        id=mission.id,
        name=mission.name,
        drone_id=mission.drone_id,
        mission_type=mission.mission_type,
        status=mission.status,
        target_altitude=mission.target_altitude,
        overlap_percentage=mission.overlap_percentage,
        estimated_distance_km=mission.estimated_distance_km,
        estimated_duration_minutes=mission.estimated_duration_minutes,
        estimated_battery_cost=mission.estimated_battery_cost,
        area_km2=mission.area_km2,
        boundary_polygon=plan.boundary_polygon,
        created_at=mission.created_at,
        waypoints=plan.waypoints
    )

@router.get("", response_model=list[MissionResponse])
def list_missions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all saved survey and patrol missions."""
    missions = db.query(Mission).order_by(Mission.created_at.desc()).all()
    results = []
    for m in missions:
        poly = json.loads(m.boundary_polygon) if isinstance(m.boundary_polygon, str) else m.boundary_polygon
        wps = [
            MissionWaypointItem(
                sequence=wp.sequence,
                latitude=wp.latitude,
                longitude=wp.longitude,
                altitude=wp.altitude,
                action=wp.action
            )
            for wp in m.waypoints
        ]
        results.append(
            MissionResponse(
                id=m.id,
                name=m.name,
                drone_id=m.drone_id,
                mission_type=m.mission_type,
                status=m.status,
                target_altitude=m.target_altitude,
                overlap_percentage=m.overlap_percentage,
                estimated_distance_km=m.estimated_distance_km,
                estimated_duration_minutes=m.estimated_duration_minutes,
                estimated_battery_cost=m.estimated_battery_cost,
                area_km2=m.area_km2,
                boundary_polygon=poly,
                created_at=m.created_at,
                waypoints=wps
            )
        )
    return results

@router.post("/{id}/assign")
def assign_mission(
    id: int,
    req: MissionAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign mission route waypoints to a fleet drone and launch autonomous execution."""
    mission = db.query(Mission).filter(Mission.id == id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
        
    drone = db.query(Drone).filter(Drone.id == req.drone_id).first()
    if not drone:
        raise HTTPException(status_code=404, detail=f"Drone '{req.drone_id}' not found")

    waypoints = [[wp.latitude, wp.longitude] for wp in mission.waypoints]
    if len(waypoints) < 2:
        raise HTTPException(status_code=400, detail="Mission has insufficient waypoints.")

    mission.drone_id = drone.id
    mission.status = "in_progress"
    mission.started_at = datetime.now(timezone.utc)
    drone.current_mission_id = mission.id
    
    # Assign to simulator
    simulator.command_assign_route(drone.id, waypoints, db)
    db.commit()

    return {
        "status": "success",
        "message": f"Mission '{mission.name}' assigned to {drone.name}. Drone navigating to waypoint 1.",
        "waypoints_count": len(waypoints)
    }
