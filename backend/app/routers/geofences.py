import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.models import Geofence, User
from backend.app.schemas.schemas import GeofenceCreate, GeofenceResponse
from backend.app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/geofences", tags=["Geofencing"])

@router.get("", response_model=list[GeofenceResponse])
def list_geofences(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve all operational geofence polygons."""
    geofences = db.query(Geofence).all()
    results = []
    for gf in geofences:
        coords = json.loads(gf.coordinates) if isinstance(gf.coordinates, str) else gf.coordinates
        results.append(
            GeofenceResponse(
                id=gf.id,
                name=gf.name,
                zone_type=gf.zone_type,
                description=gf.description,
                coordinates=coords,
                min_altitude=gf.min_altitude,
                max_altitude=gf.max_altitude,
                is_active=gf.is_active,
                created_at=gf.created_at
            )
        )
    return results

@router.post("", response_model=GeofenceResponse, status_code=status.HTTP_201_CREATED)
def create_geofence(
    gf_in: GeofenceCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Create a new geofence perimeter polygon (ADMIN only)."""
    if len(gf_in.coordinates) < 3:
        raise HTTPException(status_code=400, detail="A polygon must contain at least 3 coordinate vertices.")
        
    gf = Geofence(
        name=gf_in.name,
        zone_type=gf_in.zone_type,
        description=gf_in.description or "",
        coordinates=json.dumps(gf_in.coordinates),
        min_altitude=gf_in.min_altitude,
        max_altitude=gf_in.max_altitude,
        is_active=gf_in.is_active
    )
    db.add(gf)
    db.commit()
    db.refresh(gf)

    return GeofenceResponse(
        id=gf.id,
        name=gf.name,
        zone_type=gf.zone_type,
        description=gf.description,
        coordinates=gf_in.coordinates,
        min_altitude=gf.min_altitude,
        max_altitude=gf.max_altitude,
        is_active=gf.is_active,
        created_at=gf.created_at
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_geofence(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Remove a geofence zone from the system (ADMIN only)."""
    gf = db.query(Geofence).filter(Geofence.id == id).first()
    if not gf:
        raise HTTPException(status_code=404, detail="Geofence not found")
        
    db.delete(gf)
    db.commit()
    return None
