from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.models import Alert, User
from backend.app.schemas.schemas import AlertResponse, AlertAckRequest
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts & Incidents"])

@router.get("", response_model=list[AlertResponse])
def list_alerts(
    drone_id: Optional[str] = None,
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    alert_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve filtered alert history."""
    query = db.query(Alert)
    if drone_id:
        query = query.filter(Alert.drone_id == drone_id)
    if severity:
        query = query.filter(Alert.severity == severity.lower())
    if status_filter:
        query = query.filter(Alert.status == status_filter.lower())
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
        
    alerts = query.order_by(Alert.created_at.desc()).offset(offset).limit(limit).all()
    return alerts

@router.patch("/{id}/ack", response_model=AlertResponse)
def acknowledge_alert(
    id: int,
    ack_req: AlertAckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark an active alert as acknowledged."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = "acknowledged"
    alert.acknowledged_by = current_user.full_name or ack_req.acknowledged_by
    db.commit()
    db.refresh(alert)
    return alert

@router.patch("/{id}/resolve", response_model=AlertResponse)
def resolve_alert(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark an alert as resolved."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = "resolved"
    alert.resolved_at = datetime.now(timezone.utc)
    if not alert.acknowledged_by:
        alert.acknowledged_by = current_user.full_name
    db.commit()
    db.refresh(alert)
    return alert
