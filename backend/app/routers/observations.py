from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..dependencies import get_db

router = APIRouter()

@router.get("/", response_model=list[schemas.Observation])
def read_observations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    observations = db.query(models.Observation).offset(skip).limit(limit).all()
    return observations

@router.post("/", response_model=schemas.Observation)
def create_observation(observation: schemas.ObservationCreate, db: Session = Depends(get_db)):
    db_observation = models.Observation(**observation.dict())
    db.add(db_observation)
    db.commit()
    db.refresh(db_observation)
    return db_observation

@router.get("/{observation_id}", response_model=schemas.Observation)
def read_observation(observation_id: int, db: Session = Depends(get_db)):
    db_observation = db.query(models.Observation).filter(models.Observation.id == observation_id).first()
    if db_observation is None:
        raise HTTPException(status_code=404, detail="Observation not found")
    return db_observation

@router.put("/{observation_id}", response_model=schemas.Observation)
def update_observation(observation_id: int, observation: schemas.ObservationCreate, db: Session = Depends(get_db)):
    db_observation = db.query(models.Observation).filter(models.Observation.id == observation_id).first()
    if db_observation is None:
        raise HTTPException(status_code=404, detail="Observation not found")
    for key, value in observation.dict().items():
        setattr(db_observation, key, value)
    db.commit()
    db.refresh(db_observation)
    return db_observation

@router.delete("/{observation_id}")
def delete_observation(observation_id: int, db: Session = Depends(get_db)):
    db_observation = db.query(models.Observation).filter(models.Observation.id == observation_id).first()
    if db_observation is None:
        raise HTTPException(status_code=404, detail="Observation not found")
    db.delete(db_observation)
    db.commit()
    return {"message": "Observation deleted"}