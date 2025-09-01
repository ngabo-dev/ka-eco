from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..dependencies import get_db
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/", response_model=list[schemas.Sensor])
def read_sensors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sensors = db.query(models.Sensor).offset(skip).limit(limit).all()
    return sensors

@router.post("/", response_model=schemas.Sensor)
def create_sensor(sensor: schemas.SensorCreate, db: Session = Depends(get_db)):
    # Check if sensor_id already exists
    db_sensor = db.query(models.Sensor).filter(models.Sensor.sensor_id == sensor.sensor_id).first()
    if db_sensor:
        raise HTTPException(status_code=400, detail="Sensor ID already registered")

    db_sensor = models.Sensor(**sensor.dict())
    db.add(db_sensor)
    db.commit()
    db.refresh(db_sensor)
    return db_sensor

@router.get("/{sensor_id}", response_model=schemas.Sensor)
def read_sensor(sensor_id: str, db: Session = Depends(get_db)):
    db_sensor = db.query(models.Sensor).filter(models.Sensor.sensor_id == sensor_id).first()
    if db_sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return db_sensor

@router.put("/{sensor_id}", response_model=schemas.Sensor)
def update_sensor(sensor_id: str, sensor: schemas.SensorCreate, db: Session = Depends(get_db)):
    db_sensor = db.query(models.Sensor).filter(models.Sensor.sensor_id == sensor_id).first()
    if db_sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")

    for key, value in sensor.dict().items():
        setattr(db_sensor, key, value)

    db.commit()
    db.refresh(db_sensor)
    return db_sensor

@router.delete("/{sensor_id}")
def delete_sensor(sensor_id: str, db: Session = Depends(get_db)):
    db_sensor = db.query(models.Sensor).filter(models.Sensor.sensor_id == sensor_id).first()
    if db_sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")

    db.delete(db_sensor)
    db.commit()
    return {"message": "Sensor deleted"}

@router.post("/data", response_model=schemas.SensorData)
def ingest_sensor_data(sensor_data: schemas.SensorDataCreate, db: Session = Depends(get_db)):
    """Endpoint for sensors to send data"""
    # Validate sensor exists if sensor_id is provided
    if sensor_data.sensor_id:
        sensor = db.query(models.Sensor).filter(models.Sensor.id == sensor_data.sensor_id).first()
        if sensor:
            # Update sensor last_seen
            sensor.last_seen = datetime.utcnow()
            db.commit()

    db_sensor_data = models.SensorData(**sensor_data.dict())
    db.add(db_sensor_data)
    db.commit()
    db.refresh(db_sensor_data)

    # TODO: Broadcast real-time update (removed due to circular import)
    # Will be re-implemented after fixing circular import issue

    return db_sensor_data

@router.get("/wetland/{wetland_id}", response_model=list[schemas.Sensor])
def get_sensors_by_wetland(wetland_id: int, db: Session = Depends(get_db)):
    sensors = db.query(models.Sensor).filter(models.Sensor.wetland_id == wetland_id).all()
    return sensors

@router.post("/{sensor_id}/heartbeat")
def sensor_heartbeat(sensor_id: str, db: Session = Depends(get_db)):
    """Endpoint for sensors to send heartbeat signals"""
    sensor = db.query(models.Sensor).filter(models.Sensor.sensor_id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    sensor.last_seen = datetime.utcnow()
    db.commit()
    return {"status": "ok", "timestamp": sensor.last_seen}

@router.post("/bulk-data")
def ingest_bulk_sensor_data(sensor_data_list: list[schemas.SensorDataCreate], db: Session = Depends(get_db)):
    """Endpoint for bulk sensor data ingestion"""
    created_records = []

    for sensor_data in sensor_data_list:
        # Validate sensor exists if sensor_id is provided
        if sensor_data.sensor_id:
            sensor = db.query(models.Sensor).filter(models.Sensor.id == sensor_data.sensor_id).first()
            if sensor:
                # Update sensor last_seen
                sensor.last_seen = datetime.utcnow()

        db_sensor_data = models.SensorData(**sensor_data.dict())
        db.add(db_sensor_data)
        created_records.append(db_sensor_data)

    db.commit()

    # Refresh all records to get IDs
    for record in created_records:
        db.refresh(record)

    return {
        "message": f"Successfully ingested {len(created_records)} sensor data records",
        "records": [{"id": record.id, "sensor_id": record.sensor_id} for record in created_records]
    }

@router.get("/status/{sensor_id}")
def get_sensor_status(sensor_id: str, db: Session = Depends(get_db)):
    """Get detailed status information for a sensor"""
    sensor = db.query(models.Sensor).filter(models.Sensor.sensor_id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    # Get recent data points
    recent_data = db.query(models.SensorData).filter(
        models.SensorData.sensor_id == sensor.id
    ).order_by(models.SensorData.timestamp.desc()).limit(10).all()

    # Calculate status based on last_seen and battery level
    now = datetime.utcnow()
    time_since_last_seen = (now - sensor.last_seen).total_seconds() if sensor.last_seen else None

    status = "active"
    if time_since_last_seen and time_since_last_seen > 3600:  # 1 hour
        status = "offline"
    elif sensor.battery_level and sensor.battery_level < 20:
        status = "low_battery"

    return {
        "sensor_id": sensor.sensor_id,
        "status": status,
        "last_seen": sensor.last_seen,
        "battery_level": sensor.battery_level,
        "firmware_version": sensor.firmware_version,
        "recent_data_count": len(recent_data),
        "latest_reading": recent_data[0] if recent_data else None
    }

@router.get("/alerts")
def get_sensor_alerts(db: Session = Depends(get_db)):
    """Get sensors that need attention (offline, low battery, etc.)"""
    now = datetime.utcnow()

    # Find offline sensors (no heartbeat in last hour)
    offline_sensors = db.query(models.Sensor).filter(
        models.Sensor.last_seen < (now - timedelta(hours=1))
    ).all()

    # Find sensors with low battery
    low_battery_sensors = db.query(models.Sensor).filter(
        models.Sensor.battery_level < 20
    ).all()

    alerts = []

    for sensor in offline_sensors:
        alerts.append({
            "type": "offline",
            "sensor_id": sensor.sensor_id,
            "message": f"Sensor {sensor.sensor_id} has not sent heartbeat in over an hour",
            "severity": "high",
            "last_seen": sensor.last_seen
        })

    for sensor in low_battery_sensors:
        if sensor not in offline_sensors:  # Avoid duplicate alerts
            alerts.append({
                "type": "low_battery",
                "sensor_id": sensor.sensor_id,
                "message": f"Sensor {sensor.sensor_id} has low battery ({sensor.battery_level}%)",
                "severity": "medium",
                "battery_level": sensor.battery_level
            })

    return {"alerts": alerts, "total": len(alerts)}

@router.put("/{sensor_id}/config")
def update_sensor_config(sensor_id: str, config: dict, db: Session = Depends(get_db)):
    """Update sensor configuration"""
    sensor = db.query(models.Sensor).filter(models.Sensor.sensor_id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    # Update configuration fields
    allowed_fields = ["name", "status", "battery_level", "firmware_version"]
    for key, value in config.items():
        if key in allowed_fields:
            setattr(sensor, key, value)

    sensor.last_seen = datetime.utcnow()
    db.commit()
    db.refresh(sensor)

    return {"message": "Sensor configuration updated", "sensor": sensor}