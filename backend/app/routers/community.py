from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from .. import models, schemas
from ..dependencies import get_db
from ..auth import get_current_user
from typing import List, Optional
from datetime import datetime
import json
import os

router = APIRouter()

@router.post("/", response_model=schemas.CommunityReport)
async def create_community_report(
    reporter_name: str = Form(...),
    reporter_email: Optional[str] = Form(None),
    reporter_phone: Optional[str] = Form(None),
    report_type: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_description: Optional[str] = Form(None),
    wetland_id: Optional[int] = Form(None),
    severity: str = Form("medium"),
    images: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new community report"""

    # Validate report type
    valid_types = ['pollution', 'encroachment', 'illegal_dumping', 'habitat_destruction', 'other']
    if report_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid report type")

    # Validate severity
    valid_severities = ['low', 'medium', 'high', 'critical']
    if severity not in valid_severities:
        raise HTTPException(status_code=400, detail="Invalid severity level")

    # Handle image uploads
    image_urls = []
    if images:
        for image in images:
            if image.filename:
                # Create uploads directory if it doesn't exist
                upload_dir = "uploads/community_reports"
                os.makedirs(upload_dir, exist_ok=True)

                # Generate unique filename
                file_extension = os.path.splitext(image.filename)[1]
                unique_filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{image.filename}"

                file_path = os.path.join(upload_dir, unique_filename)

                # Save file
                with open(file_path, "wb") as buffer:
                    content = await image.read()
                    buffer.write(content)

                image_urls.append(f"/uploads/community_reports/{unique_filename}")

    # Create report
    db_report = models.CommunityReport(
        reporter_name=reporter_name,
        reporter_email=reporter_email,
        reporter_phone=reporter_phone,
        report_type=report_type,
        title=title,
        description=description,
        latitude=latitude,
        longitude=longitude,
        location_description=location_description,
        wetland_id=wetland_id,
        severity=severity,
        images=json.dumps(image_urls) if image_urls else None
    )

    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    return db_report

@router.get("/", response_model=List[schemas.CommunityReport])
def get_community_reports(
    skip: int = 0,
    limit: int = 100,
    report_type: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    wetland_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all community reports with optional filtering"""
    query = db.query(models.CommunityReport)

    if report_type:
        query = query.filter(models.CommunityReport.report_type == report_type)
    if status:
        query = query.filter(models.CommunityReport.status == status)
    if severity:
        query = query.filter(models.CommunityReport.severity == severity)
    if wetland_id:
        query = query.filter(models.CommunityReport.wetland_id == wetland_id)

    # Role-based access control
    if current_user.role == 'community_member':
        # Community members can only see their own reports
        query = query.filter(models.CommunityReport.reporter_email == current_user.email)

    reports = query.order_by(models.CommunityReport.created_at.desc()).offset(skip).limit(limit).all()
    return reports

@router.get("/{report_id}", response_model=schemas.CommunityReport)
def get_community_report(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific community report by ID"""
    report = db.query(models.CommunityReport).filter(models.CommunityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check permissions
    if current_user.role == 'community_member' and report.reporter_email != current_user.email:
        raise HTTPException(status_code=403, detail="Access denied")

    return report

@router.put("/{report_id}", response_model=schemas.CommunityReport)
def update_community_report(
    report_id: int,
    report_update: schemas.CommunityReportUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a community report"""
    report = db.query(models.CommunityReport).filter(models.CommunityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check permissions - only assigned user or admin can update
    if current_user.role not in ['admin', 'researcher', 'government_official']:
        if report.reporter_email != current_user.email:
            raise HTTPException(status_code=403, detail="Access denied")

    # Update fields
    update_data = report_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(report, field, value)

    report.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(report)
    return report

@router.put("/{report_id}/assign", response_model=schemas.CommunityReport)
def assign_community_report(
    report_id: int,
    assigned_to: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign a community report to a user"""
    if current_user.role not in ['admin', 'researcher', 'government_official']:
        raise HTTPException(status_code=403, detail="Access denied")

    report = db.query(models.CommunityReport).filter(models.CommunityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Verify assigned user exists and has appropriate role
    assigned_user = db.query(models.User).filter(models.User.id == assigned_to).first()
    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")

    if assigned_user.role not in ['admin', 'researcher', 'government_official']:
        raise HTTPException(status_code=400, detail="Can only assign to authorized personnel")

    report.assigned_to = assigned_to
    report.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(report)
    return report

@router.put("/{report_id}/status", response_model=schemas.CommunityReport)
def update_report_status(
    report_id: int,
    status: str,
    resolution_notes: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the status of a community report"""
    if current_user.role not in ['admin', 'researcher', 'government_official']:
        raise HTTPException(status_code=403, detail="Access denied")

    valid_statuses = ['pending', 'investigating', 'resolved', 'closed']
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    report = db.query(models.CommunityReport).filter(models.CommunityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = status
    if resolution_notes:
        report.resolution_notes = resolution_notes
    report.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(report)
    return report

@router.delete("/{report_id}")
def delete_community_report(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a community report"""
    report = db.query(models.CommunityReport).filter(models.CommunityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check permissions
    if current_user.role not in ['admin']:
        raise HTTPException(status_code=403, detail="Only administrators can delete reports")

    # Delete associated files
    if report.images:
        try:
            images = json.loads(report.images)
            for image_url in images:
                # Remove '/uploads/' prefix to get file path
                file_path = image_url.replace('/uploads/', 'uploads/')
                if os.path.exists(file_path):
                    os.remove(file_path)
        except:
            pass  # Ignore file deletion errors

    db.delete(report)
    db.commit()

    return {"message": "Report deleted successfully"}

@router.get("/stats/summary")
def get_community_reports_summary(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get community reports summary statistics"""
    total_reports = db.query(models.CommunityReport).count()
    pending_reports = db.query(models.CommunityReport).filter(models.CommunityReport.status == 'pending').count()
    investigating_reports = db.query(models.CommunityReport).filter(models.CommunityReport.status == 'investigating').count()
    resolved_reports = db.query(models.CommunityReport).filter(models.CommunityReport.status == 'resolved').count()

    # Recent reports (last 30 days)
    thirty_days_ago = datetime.utcnow().replace(day=datetime.utcnow().day - 30)
    recent_reports = db.query(models.CommunityReport).filter(
        models.CommunityReport.created_at >= thirty_days_ago
    ).count()

    # Reports by type
    reports_by_type = {}
    for report_type in ['pollution', 'encroachment', 'illegal_dumping', 'habitat_destruction', 'other']:
        count = db.query(models.CommunityReport).filter(models.CommunityReport.report_type == report_type).count()
        reports_by_type[report_type] = count

    return {
        "total_reports": total_reports,
        "pending_reports": pending_reports,
        "investigating_reports": investigating_reports,
        "resolved_reports": resolved_reports,
        "recent_reports": recent_reports,
        "reports_by_type": reports_by_type,
        "generated_at": datetime.utcnow()
    }