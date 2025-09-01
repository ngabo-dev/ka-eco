from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..dependencies import get_db
from typing import List
from datetime import datetime

router = APIRouter()

@router.get("/sensor-data", response_model=List[schemas.SensorData])
def get_sensor_data(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sensor_data = db.query(models.SensorData).offset(skip).limit(limit).all()
    return sensor_data

@router.post("/sensor-data", response_model=schemas.SensorData)
def create_sensor_data(sensor_data: schemas.SensorDataCreate, db: Session = Depends(get_db)):
    db_sensor_data = models.SensorData(**sensor_data.dict())
    db.add(db_sensor_data)
    db.commit()
    db.refresh(db_sensor_data)
    return db_sensor_data

@router.get("/sensor-data/{wetland_id}", response_model=List[schemas.SensorData])
def get_sensor_data_by_wetland(wetland_id: int, db: Session = Depends(get_db)):
    sensor_data = db.query(models.SensorData).filter(models.SensorData.wetland_id == wetland_id).all()
    return sensor_data

@router.get("/observations-chart")
def get_observations_chart(db: Session = Depends(get_db)):
    # Aggregate observations by species
    result = db.query(models.Observation.species, func.count(models.Observation.id)).group_by(models.Observation.species).all()
    return [{"species": species, "count": count} for species, count in result]

@router.get("/sensor-averages/{wetland_id}")
def get_sensor_averages(wetland_id: int, db: Session = Depends(get_db)):
    # Average sensor readings for a wetland
    result = db.query(
        func.avg(models.SensorData.temperature),
        func.avg(models.SensorData.ph),
        func.avg(models.SensorData.dissolved_oxygen),
        func.avg(models.SensorData.turbidity)
    ).filter(models.SensorData.wetland_id == wetland_id).first()
    return {
        "temperature": result[0],
        "ph": result[1],
        "dissolved_oxygen": result[2],
        "turbidity": result[3]
    }