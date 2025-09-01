from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from .. import models, schemas
from ..dependencies import get_db
from datetime import datetime
from typing import Optional, List

router = APIRouter()

@router.get("/", response_model=list[schemas.Wetland])
def read_wetlands(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search in name, location, or description"),
    wetland_type: Optional[str] = Query(None, description="Filter by wetland type"),
    min_size: Optional[float] = Query(None, description="Minimum wetland size"),
    max_size: Optional[float] = Query(None, description="Maximum wetland size"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Wetland)

    # Apply search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Wetland.name.ilike(search_filter),
                models.Wetland.location.ilike(search_filter),
                models.Wetland.description.ilike(search_filter)
            )
        )

    # Apply type filter
    if wetland_type:
        query = query.filter(models.Wetland.type == wetland_type)

    # Apply size filters
    if min_size is not None:
        query = query.filter(models.Wetland.size >= min_size)
    if max_size is not None:
        query = query.filter(models.Wetland.size <= max_size)

    wetlands = query.offset(skip).limit(limit).all()
    return wetlands

@router.get("/search", response_model=list[schemas.Wetland])
def search_wetlands(
    q: str = Query(..., description="Search query"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Advanced search endpoint for wetlands"""
    search_filter = f"%{q}%"
    wetlands = db.query(models.Wetland).filter(
        or_(
            models.Wetland.name.ilike(search_filter),
            models.Wetland.location.ilike(search_filter),
            models.Wetland.type.ilike(search_filter),
            models.Wetland.description.ilike(search_filter)
        )
    ).offset(skip).limit(limit).all()
    return wetlands

@router.get("/types", response_model=List[str])
def get_wetland_types(db: Session = Depends(get_db)):
    """Get all unique wetland types"""
    types = db.query(models.Wetland.type).distinct().all()
    return [t[0] for t in types]

@router.get("/stats")
def get_wetland_stats(db: Session = Depends(get_db)):
    """Get wetland statistics"""
    total_count = db.query(models.Wetland).count()
    total_area = db.query(db.func.sum(models.Wetland.size)).scalar() or 0
    types_count = db.query(models.Wetland.type, db.func.count(models.Wetland.id)).group_by(models.Wetland.type).all()

    return {
        "total_wetlands": total_count,
        "total_area_hectares": round(total_area, 2),
        "types_breakdown": {t[0]: t[1] for t in types_count}
    }

@router.post("/", response_model=schemas.Wetland)
def create_wetland(wetland: schemas.WetlandCreate, db: Session = Depends(get_db)):
    db_wetland = models.Wetland(**wetland.dict(), created_at=datetime.utcnow())
    db.add(db_wetland)
    db.commit()
    db.refresh(db_wetland)
    return db_wetland

@router.get("/{wetland_id}", response_model=schemas.Wetland)
def read_wetland(wetland_id: int, db: Session = Depends(get_db)):
    db_wetland = db.query(models.Wetland).filter(models.Wetland.id == wetland_id).first()
    if db_wetland is None:
        raise HTTPException(status_code=404, detail="Wetland not found")
    return db_wetland

@router.put("/{wetland_id}", response_model=schemas.Wetland)
def update_wetland(wetland_id: int, wetland: schemas.WetlandCreate, db: Session = Depends(get_db)):
    db_wetland = db.query(models.Wetland).filter(models.Wetland.id == wetland_id).first()
    if db_wetland is None:
        raise HTTPException(status_code=404, detail="Wetland not found")
    for key, value in wetland.dict().items():
        setattr(db_wetland, key, value)
    db.commit()
    db.refresh(db_wetland)
    return db_wetland

@router.delete("/{wetland_id}")
def delete_wetland(wetland_id: int, db: Session = Depends(get_db)):
    db_wetland = db.query(models.Wetland).filter(models.Wetland.id == wetland_id).first()
    if db_wetland is None:
        raise HTTPException(status_code=404, detail="Wetland not found")
    db.delete(db_wetland)
    db.commit()
    return {"message": "Wetland deleted"}