from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from .. import models
from ..dependencies import get_db
from datetime import datetime, timedelta
import json
import csv
from io import StringIO
from typing import Optional

router = APIRouter()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """System health check endpoint"""
    try:
        # Check database connection
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "timestamp": datetime.utcnow(),
        "services": {
            "database": db_status,
            "api": "healthy"
        }
    }

@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db)):
    """Get comprehensive system statistics"""
    # User statistics
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()
    admin_users = db.query(models.User).filter(models.User.role == "admin").count()

    # Wetland statistics
    total_wetlands = db.query(models.Wetland).count()
    total_wetland_area = db.query(func.sum(models.Wetland.size)).scalar() or 0

    # Observation statistics
    total_observations = db.query(models.Observation).count()
    recent_observations = db.query(models.Observation).filter(
        models.Observation.date >= datetime.utcnow() - timedelta(days=30)
    ).count()

    # Sensor statistics
    total_sensors = db.query(models.Sensor).count()
    active_sensors = db.query(models.Sensor).filter(models.Sensor.status == "active").count()

    # Sensor data statistics
    total_sensor_readings = db.query(models.SensorData).count()
    recent_readings = db.query(models.SensorData).filter(
        models.SensorData.timestamp >= datetime.utcnow() - timedelta(days=7)
    ).count()

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "admins": admin_users
        },
        "wetlands": {
            "total": total_wetlands,
            "total_area_hectares": round(total_wetland_area, 2)
        },
        "observations": {
            "total": total_observations,
            "recent_30_days": recent_observations
        },
        "sensors": {
            "total": total_sensors,
            "active": active_sensors
        },
        "sensor_data": {
            "total_readings": total_sensor_readings,
            "recent_7_days": recent_readings
        },
        "generated_at": datetime.utcnow()
    }

@router.get("/export/wetlands")
def export_wetlands(format: str = Query("json", description="Export format: json or csv"), db: Session = Depends(get_db)):
    """Export wetlands data"""
    wetlands = db.query(models.Wetland).all()

    if format.lower() == "csv":
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Name", "Location", "Size", "Type", "Description", "Created At"])

        for wetland in wetlands:
            writer.writerow([
                wetland.id,
                wetland.name,
                wetland.location,
                wetland.size,
                wetland.type,
                wetland.description,
                wetland.created_at
            ])

        return {
            "filename": f"wetlands_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
            "content": output.getvalue(),
            "content_type": "text/csv"
        }

    # Default to JSON
    wetlands_data = []
    for wetland in wetlands:
        wetlands_data.append({
            "id": wetland.id,
            "name": wetland.name,
            "location": wetland.location,
            "size": wetland.size,
            "type": wetland.type,
            "description": wetland.description,
            "created_at": wetland.created_at.isoformat()
        })

    return {
        "filename": f"wetlands_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json",
        "data": wetlands_data,
        "count": len(wetlands_data)
    }

@router.get("/export/observations")
def export_observations(
    format: str = Query("json", description="Export format: json or csv"),
    wetland_id: Optional[int] = Query(None, description="Filter by wetland ID"),
    days: Optional[int] = Query(None, description="Export last N days"),
    db: Session = Depends(get_db)
):
    """Export observations data"""
    query = db.query(models.Observation)

    if wetland_id:
        query = query.filter(models.Observation.wetland_id == wetland_id)

    if days:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(models.Observation.date >= start_date)

    observations = query.all()

    if format.lower() == "csv":
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Wetland ID", "Species", "Count", "Date", "Notes"])

        for obs in observations:
            writer.writerow([
                obs.id,
                obs.wetland_id,
                obs.species,
                obs.count,
                obs.date,
                obs.notes
            ])

        return {
            "filename": f"observations_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
            "content": output.getvalue(),
            "content_type": "text/csv"
        }

    # Default to JSON
    observations_data = []
    for obs in observations:
        observations_data.append({
            "id": obs.id,
            "wetland_id": obs.wetland_id,
            "species": obs.species,
            "count": obs.count,
            "date": obs.date.isoformat(),
            "notes": obs.notes
        })

    return {
        "filename": f"observations_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json",
        "data": observations_data,
        "count": len(observations_data)
    }

@router.get("/export/sensor-data")
def export_sensor_data(
    format: str = Query("json", description="Export format: json or csv"),
    sensor_id: Optional[str] = Query(None, description="Filter by sensor ID"),
    wetland_id: Optional[int] = Query(None, description="Filter by wetland ID"),
    days: Optional[int] = Query(None, description="Export last N days"),
    db: Session = Depends(get_db)
):
    """Export sensor data"""
    query = db.query(models.SensorData)

    if sensor_id:
        query = query.filter(models.SensorData.sensor_id == sensor_id)

    if wetland_id:
        query = query.filter(models.SensorData.wetland_id == wetland_id)

    if days:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(models.SensorData.timestamp >= start_date)

    sensor_data = query.order_by(desc(models.SensorData.timestamp)).all()

    if format.lower() == "csv":
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Sensor ID", "Wetland ID", "Timestamp", "Temperature", "pH", "Dissolved Oxygen", "Turbidity"])

        for data in sensor_data:
            writer.writerow([
                data.id,
                data.sensor_id,
                data.wetland_id,
                data.timestamp,
                data.temperature,
                data.ph,
                data.dissolved_oxygen,
                data.turbidity
            ])

        return {
            "filename": f"sensor_data_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
            "content": output.getvalue(),
            "content_type": "text/csv"
        }

    # Default to JSON
    sensor_data_list = []
    for data in sensor_data:
        sensor_data_list.append({
            "id": data.id,
            "sensor_id": data.sensor_id,
            "wetland_id": data.wetland_id,
            "timestamp": data.timestamp.isoformat(),
            "temperature": data.temperature,
            "ph": data.ph,
            "dissolved_oxygen": data.dissolved_oxygen,
            "turbidity": data.turbidity
        })

    return {
        "filename": f"sensor_data_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json",
        "data": sensor_data_list,
        "count": len(sensor_data_list)
    }