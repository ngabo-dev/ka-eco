from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from .. import models, schemas
from ..dependencies import get_db
from ..routers.auth import get_current_user
from typing import List, Optional
from datetime import datetime, timedelta
import json

router = APIRouter()

@router.get("/", response_model=List[schemas.Alert])
def get_alerts(
    skip: int = 0,
    limit: int = 100,
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    is_active: Optional[bool] = None,
    wetland_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all alerts with optional filtering"""
    query = db.query(models.Alert)

    if alert_type:
        query = query.filter(models.Alert.alert_type == alert_type)
    if severity:
        query = query.filter(models.Alert.severity == severity)
    if is_active is not None:
        query = query.filter(models.Alert.is_active == is_active)
    if wetland_id:
        query = query.filter(models.Alert.wetland_id == wetland_id)

    # Role-based access control
    if current_user.role not in ['admin', 'researcher', 'government_official']:
        # Community members can only see public alerts
        query = query.filter(models.Alert.alert_type.in_(['info', 'warning']))

    alerts = query.order_by(models.Alert.created_at.desc()).offset(skip).limit(limit).all()
    return alerts

@router.get("/{alert_id}", response_model=schemas.Alert)
def get_alert(
    alert_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific alert by ID"""
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Check permissions
    if current_user.role not in ['admin', 'researcher', 'government_official']:
        if alert.alert_type not in ['info', 'warning']:
            raise HTTPException(status_code=403, detail="Access denied")

    return alert

@router.post("/", response_model=schemas.Alert)
def create_alert(
    alert: schemas.AlertCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new alert"""
    if current_user.role not in ['admin', 'researcher', 'government_official']:
        raise HTTPException(status_code=403, detail="Only authorized personnel can create alerts")

    db_alert = models.Alert(
        title=alert.title,
        message=alert.message,
        alert_type=alert.alert_type,
        severity=alert.severity or "medium",
        wetland_id=alert.wetland_id,
        sensor_id=alert.sensor_id,
        threshold_value=alert.threshold_value,
        actual_value=alert.actual_value
    )

    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)

    # Create notifications for relevant users
    background_tasks.add_task(create_notifications_for_alert, db_alert.id, db)

    return db_alert

@router.put("/{alert_id}/acknowledge", response_model=schemas.Alert)
def acknowledge_alert(
    alert_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Acknowledge an alert"""
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if current_user.role not in ['admin', 'researcher', 'government_official']:
        raise HTTPException(status_code=403, detail="Access denied")

    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()

    db.commit()
    db.refresh(alert)
    return alert

@router.put("/{alert_id}/resolve", response_model=schemas.Alert)
def resolve_alert(
    alert_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resolve an alert"""
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if current_user.role not in ['admin', 'researcher', 'government_official']:
        raise HTTPException(status_code=403, detail="Access denied")

    alert.is_active = False
    alert.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(alert)
    return alert

@router.get("/notifications/", response_model=List[schemas.Notification])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    is_read: Optional[bool] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for the current user"""
    query = db.query(models.Notification).filter(models.Notification.user_id == current_user.id)

    if is_read is not None:
        query = query.filter(models.Notification.is_read == is_read)

    notifications = query.order_by(models.Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.put("/notifications/{notification_id}/read", response_model=schemas.Notification)
def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    notification.read_at = datetime.utcnow()

    db.commit()
    db.refresh(notification)
    return notification

@router.post("/check-thresholds")
def check_sensor_thresholds(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Check sensor data against thresholds and create alerts if needed"""
    # Get recent sensor data (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_data = db.query(models.SensorData).filter(
        models.SensorData.timestamp >= yesterday
    ).all()

    alerts_created = 0

    for data in recent_data:
        # Check temperature thresholds
        if data.temperature is not None:
            if data.temperature > 35:  # High temperature alert
                create_threshold_alert(
                    db, "High Temperature", f"Temperature: {data.temperature}°C",
                    "critical", "high", data.wetland_id, data.sensor_id, 35, data.temperature
                )
                alerts_created += 1
            elif data.temperature < 10:  # Low temperature alert
                create_threshold_alert(
                    db, "Low Temperature", f"Temperature: {data.temperature}°C",
                    "warning", "medium", data.wetland_id, data.sensor_id, 10, data.temperature
                )
                alerts_created += 1

        # Check pH thresholds
        if data.ph is not None:
            if data.ph < 6.0 or data.ph > 8.5:  # pH out of range
                create_threshold_alert(
                    db, "pH Out of Range", f"pH Level: {data.ph}",
                    "warning", "medium", data.wetland_id, data.sensor_id, 7.0, data.ph
                )
                alerts_created += 1

        # Check turbidity thresholds
        if data.turbidity is not None:
            if data.turbidity > 50:  # High turbidity (pollution)
                create_threshold_alert(
                    db, "High Turbidity", f"Turbidity: {data.turbidity} NTU",
                    "critical", "high", data.wetland_id, data.sensor_id, 50, data.turbidity
                )
                alerts_created += 1

    if alerts_created > 0:
        # Create notifications for alerts
        background_tasks.add_task(create_notifications_for_all_alerts, db)

    return {"message": f"Checked thresholds, created {alerts_created} alerts"}

def create_threshold_alert(db: Session, title: str, message: str, alert_type: str,
                          severity: str, wetland_id: int, sensor_id: int,
                          threshold: float, actual: float):
    """Helper function to create threshold-based alerts"""
    # Check if similar alert already exists (avoid duplicates)
    existing_alert = db.query(models.Alert).filter(
        models.Alert.wetland_id == wetland_id,
        models.Alert.alert_type == alert_type,
        models.Alert.is_active == True,
        models.Alert.created_at >= datetime.utcnow() - timedelta(hours=1)  # Within last hour
    ).first()

    if not existing_alert:
        alert = models.Alert(
            title=title,
            message=message,
            alert_type=alert_type,
            severity=severity,
            wetland_id=wetland_id,
            sensor_id=sensor_id,
            threshold_value=threshold,
            actual_value=actual
        )
        db.add(alert)
        db.commit()

def create_notifications_for_alert(alert_id: int, db: Session):
    """Create notifications for an alert"""
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        return

    # Get users who should receive notifications
    users = db.query(models.User).filter(
        models.User.role.in_(['admin', 'researcher', 'government_official'])
    ).all()

    for user in users:
        notification = models.Notification(
            user_id=user.id,
            alert_id=alert.id,
            title=alert.title,
            message=alert.message,
            notification_type="in_app"
        )
        db.add(notification)

    db.commit()

def create_notifications_for_all_alerts(db: Session):
    """Create notifications for all active alerts without notifications"""
    alerts = db.query(models.Alert).filter(
        models.Alert.is_active == True,
        models.Alert.created_at >= datetime.utcnow() - timedelta(hours=1)
    ).all()

    for alert in alerts:
        create_notifications_for_alert(alert.id, db)

@router.get("/stats/summary")
def get_alerts_summary(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get alerts summary statistics"""
    total_alerts = db.query(models.Alert).count()
    active_alerts = db.query(models.Alert).filter(models.Alert.is_active == True).count()
    critical_alerts = db.query(models.Alert).filter(
        models.Alert.is_active == True,
        models.Alert.severity == "critical"
    ).count()

    # Recent alerts (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_alerts = db.query(models.Alert).filter(
        models.Alert.created_at >= yesterday
    ).count()

    return {
        "total_alerts": total_alerts,
        "active_alerts": active_alerts,
        "critical_alerts": critical_alerts,
        "recent_alerts": recent_alerts,
        "generated_at": datetime.utcnow()
    }