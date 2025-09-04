from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas
from ..dependencies import get_db
from ..routers.auth import get_current_user
from typing import List, Optional
from datetime import datetime

router = APIRouter()

@router.get("/user", response_model=List[schemas.UserSetting])
def get_user_settings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all settings for the current user"""
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).all()
    return settings

@router.get("/user/{key}")
def get_user_setting(
    key: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific setting for the current user"""
    setting = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id,
        models.UserSettings.setting_key == key
    ).first()

    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    return {"key": setting.setting_key, "value": setting.setting_value}

@router.post("/user")
def create_or_update_setting(
    setting: schemas.UserSettingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a user setting"""
    # Check if setting already exists
    existing_setting = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id,
        models.UserSettings.setting_key == setting.key
    ).first()

    if existing_setting:
        # Update existing setting
        existing_setting.setting_value = setting.value
        existing_setting.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_setting)
        return existing_setting
    else:
        # Create new setting
        new_setting = models.UserSettings(
            user_id=current_user.id,
            setting_key=setting.key,
            setting_value=setting.value
        )
        db.add(new_setting)
        db.commit()
        db.refresh(new_setting)
        return new_setting

@router.put("/user/bulk")
def bulk_update_settings(
    settings: List[schemas.UserSettingCreate],
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk update multiple user settings"""
    updated_settings = []

    for setting in settings:
        # Check if setting already exists
        existing_setting = db.query(models.UserSettings).filter(
            models.UserSettings.user_id == current_user.id,
            models.UserSettings.setting_key == setting.key
        ).first()

        if existing_setting:
            # Update existing setting
            existing_setting.setting_value = setting.value
            existing_setting.updated_at = datetime.utcnow()
        else:
            # Create new setting
            existing_setting = models.UserSettings(
                user_id=current_user.id,
                setting_key=setting.key,
                setting_value=setting.value
            )
            db.add(existing_setting)

        updated_settings.append(existing_setting)

    db.commit()

    # Refresh all settings
    for setting in updated_settings:
        db.refresh(setting)

    return {"message": f"Updated {len(updated_settings)} settings", "settings": updated_settings}

@router.delete("/user/{key}")
def delete_user_setting(
    key: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user setting"""
    setting = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id,
        models.UserSettings.setting_key == key
    ).first()

    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    db.delete(setting)
    db.commit()

    return {"message": "Setting deleted successfully"}

@router.post("/export")
def export_user_data(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export all user data including settings"""
    # Get user settings
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).all()

    # Get user wetlands (if user has access)
    wetlands = []
    if current_user.role in ['admin', 'researcher', 'government_official']:
        wetlands = db.query(models.Wetland).all()

    # Get user observations
    observations = db.query(models.Observation).filter(
        models.Observation.wetland_id.in_([w.id for w in wetlands]) if wetlands else False
    ).all()

    export_data = {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "full_name": current_user.full_name,
            "organization": current_user.organization,
            "phone": current_user.phone,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        },
        "settings": [
            {
                "key": setting.setting_key,
                "value": setting.setting_value,
                "created_at": setting.created_at.isoformat() if setting.created_at else None,
                "updated_at": setting.updated_at.isoformat() if setting.updated_at else None
            }
            for setting in settings
        ],
        "wetlands": [
            {
                "id": wetland.id,
                "name": wetland.name,
                "location": wetland.location,
                "size": wetland.size,
                "type": wetland.type,
                "description": wetland.description,
                "created_at": wetland.created_at.isoformat() if wetland.created_at else None
            }
            for wetland in wetlands
        ] if wetlands else [],
        "observations": [
            {
                "id": obs.id,
                "wetland_id": obs.wetland_id,
                "species": obs.species,
                "count": obs.count,
                "date": obs.date.isoformat() if obs.date else None,
                "notes": obs.notes
            }
            for obs in observations
        ] if observations else [],
        "export_date": datetime.utcnow().isoformat()
    }

    return export_data