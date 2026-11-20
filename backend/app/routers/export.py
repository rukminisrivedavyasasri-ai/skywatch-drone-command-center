import io
import csv
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.models import Alert, Detection
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/export", tags=["Data Export"])

@router.get("/incidents")
def export_incidents(
    format: str = Query("csv", pattern="^(csv|geojson)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Export all security incidents and flight alerts to CSV or standard GeoJSON.
    """
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Incident ID", "Drone ID", "Alert Type", "Severity",
            "Message", "Latitude", "Longitude", "Status",
            "Created At", "Resolved At", "Acknowledged By"
        ])
        for a in alerts:
            writer.writerow([
                a.id,
                a.drone_id or "N/A",
                a.alert_type,
                a.severity,
                a.message,
                a.latitude if a.latitude is not None else "",
                a.longitude if a.longitude is not None else "",
                a.status,
                a.created_at.isoformat() if a.created_at else "",
                a.resolved_at.isoformat() if a.resolved_at else "",
                a.acknowledged_by or ""
            ])
        csv_data = output.getvalue()
        filename = f"skywatch_incidents_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    elif format.lower() == "geojson":
        features = []
        for a in alerts:
            if a.latitude is not None and a.longitude is not None:
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [a.longitude, a.latitude]  # GeoJSON is [lon, lat]
                    },
                    "properties": {
                        "id": a.id,
                        "drone_id": a.drone_id,
                        "alert_type": a.alert_type,
                        "severity": a.severity,
                        "message": a.message,
                        "status": a.status,
                        "created_at": a.created_at.isoformat() if a.created_at else None,
                        "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
                        "acknowledged_by": a.acknowledged_by
                    }
                }
                features.append(feature)

        geojson_doc = {
            "type": "FeatureCollection",
            "features": features
        }
        filename = f"skywatch_incidents_{datetime.now().strftime('%Y%m%d_%H%M%S')}.geojson"
        return Response(
            content=json.dumps(geojson_doc, indent=2),
            media_type="application/geo+json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
