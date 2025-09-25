from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from .. import models, schemas
from ..dependencies import get_db
from ..auth import get_password_hash, verify_password, create_access_token, create_refresh_token, verify_token
from jose import JWTError, jwt
from ..auth import SECRET_KEY, ALGORITHM
from datetime import datetime, timedelta
from typing import Optional, List

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username already exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Check if email already exists
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate role
    valid_roles = ["researcher", "government_official", "community_member", "admin"]
    role = user.role if user.role and user.role in valid_roles else "researcher"

    # Validate password strength
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=role,
        full_name=user.full_name,
        organization=user.organization,
        phone=user.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Return consistent response format
    return {
        "message": f"Account created successfully! Welcome to Ka-Eco, {user.username}!",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email,
            "role": db_user.role,
            "full_name": db_user.full_name,
            "organization": db_user.organization,
            "phone": db_user.phone,
            "is_active": db_user.is_active,
            "created_at": db_user.created_at
        }
    }

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found. Please check your username.")
    
    # Check if user is active
    if not user.is_active:
        if user.approval_status == "pending":
            raise HTTPException(status_code=400, detail="Your account is pending approval by an administrator. Please wait for approval.")
        elif user.approval_status == "rejected":
            raise HTTPException(status_code=400, detail="Your account has been rejected. Please contact support for more information.")
        else:
            raise HTTPException(status_code=400, detail="Account is deactivated. Please contact support.")
    
    # Verify password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password. Please try again.")

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    return {
        "message": f"Welcome back, {user.full_name or user.username}!",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=schemas.Token)
def refresh_token_endpoint(refresh_token: str, db: Session = Depends(get_db)):
    payload = verify_token(refresh_token, "refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    username = payload.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Generate new tokens
    access_token = create_access_token(data={"sub": user.username})
    new_refresh_token = create_refresh_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

@router.put("/users/me", response_model=schemas.User)
def update_user_profile(user_update: schemas.UserUpdate, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    for key, value in user_update.dict(exclude_unset=True).items():
        if key != "role" or current_user.role == "admin":  # Only admin can change roles
            setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/users", response_model=list[schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search in username, email, or full name"),
    role: Optional[str] = Query(None, description="Filter by role"),
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view users")

    query = db.query(models.User)

    # Apply search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.User.username.ilike(search_filter),
                models.User.email.ilike(search_filter),
                models.User.full_name.ilike(search_filter)
            )
        )

    # Apply role filter
    if role:
        query = query.filter(models.User.role == role)

    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/users/count")
def get_users_count(db: Session = Depends(get_db)):
    """Get total user count (public endpoint)"""
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()

    return {
        "total_users": total_users,
        "active_users": active_users
    }

@router.get("/users/stats")
def get_users_stats(current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get detailed user statistics (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view user statistics")

    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()
    admin_users = db.query(models.User).filter(models.User.role == "admin").count()
    researcher_users = db.query(models.User).filter(models.User.role == "researcher").count()

    # Recent registrations (last 30 days)
    thirty_days_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30)
    recent_users = db.query(models.User).filter(models.User.created_at >= thirty_days_ago).count()

    # Recent logins (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_logins = db.query(models.User).filter(models.User.last_login >= seven_days_ago).count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "admin_users": admin_users,
        "researcher_users": researcher_users,
        "recent_registrations_30_days": recent_users,
        "recent_logins_7_days": recent_logins,
        "generated_at": datetime.utcnow()
    }

@router.get("/users/search")
def search_users(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Maximum results to return"),
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search users by username, email, or full name (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to search users")

    search_filter = f"%{q}%"
    users = db.query(models.User).filter(
        or_(
            models.User.username.ilike(search_filter),
            models.User.email.ilike(search_filter),
            models.User.full_name.ilike(search_filter)
        )
    ).limit(limit).all()

    # Return basic user info without sensitive data
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at
        })

    return {"users": result, "count": len(result), "query": q}

@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update users")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete users")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    db.commit()
    return {"message": "User deleted"}

@router.post("/logout")
def logout(current_user: schemas.User = Depends(get_current_user)):
    # In a stateless JWT system, logout is handled client-side
    # The client should remove tokens from storage
    return {"message": "Successfully logged out"}

@router.post("/change-password")
def change_password(password_data: schemas.PasswordChange, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")

    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.password_changed_at = datetime.utcnow()
    db.commit()

    return {"message": "Password changed successfully"}

@router.post("/logout")
def logout(current_user: schemas.User = Depends(get_current_user)):
    # In a stateless JWT system, logout is typically handled client-side
    # by removing the token from storage. This endpoint can be used for
    # server-side token blacklisting if implemented.
    return {"message": "Logged out successfully"}

@router.post("/validate-token")
def validate_token(current_user: schemas.User = Depends(get_current_user)):
    return {"valid": True, "user": current_user}

@router.post("/reset-password-request")
def reset_password_request(email_data: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email_data.email).first()
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a reset link has been sent"}

    # In a real application, you would:
    # 1. Generate a reset token
    # 2. Store it in the database with expiration
    # 3. Send an email with the reset link
    # For now, we'll just return a success message
    return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
def reset_password(reset_data: schemas.PasswordReset, db: Session = Depends(get_db)):
    # In a real application, you would validate the reset token
    # For now, we'll just update the password if the user exists
    user = db.query(models.User).filter(models.User.email == reset_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if reset_data.new_password != reset_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    user.hashed_password = get_password_hash(reset_data.new_password)
    user.password_changed_at = datetime.utcnow()
    db.commit()

    return {"message": "Password reset successfully"}

# USER APPROVAL WORKFLOW ENDPOINTS

@router.get("/users/pending", response_model=list[schemas.User])
def get_pending_users(current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all users pending approval (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view pending users")

    pending_users = db.query(models.User).filter(
        models.User.approval_status == "pending"
    ).order_by(models.User.created_at.desc()).all()

    return pending_users

@router.post("/users/{user_id}/approve")
def approve_user(user_id: int, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Approve a pending user (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to approve users")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.approval_status != "pending":
        raise HTTPException(status_code=400, detail="User is not pending approval")

    # Approve the user
    user.approval_status = "approved"
    user.is_active = 1
    user.approved_by = current_user.id
    user.approved_at = datetime.utcnow()
    
    db.commit()

    # TODO: Send approval email notification to user
    
    return {"message": f"User {user.username} approved successfully"}

@router.post("/users/{user_id}/reject")
def reject_user(user_id: int, rejection_data: schemas.UserRejection, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Reject a pending user (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to reject users")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.approval_status != "pending":
        raise HTTPException(status_code=400, detail="User is not pending approval")

    # Reject the user
    user.approval_status = "rejected"
    user.is_active = 0
    user.approved_by = current_user.id
    user.approved_at = datetime.utcnow()
    user.rejection_reason = rejection_data.reason
    
    db.commit()

    # TODO: Send rejection email notification to user
    
    return {"message": f"User {user.username} rejected successfully"}

@router.get("/users/approval-stats")
def get_approval_stats(current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user approval statistics (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view approval statistics")

    pending_count = db.query(models.User).filter(models.User.approval_status == "pending").count()
    approved_count = db.query(models.User).filter(models.User.approval_status == "approved").count()
    rejected_count = db.query(models.User).filter(models.User.approval_status == "rejected").count()
    
    return {
        "pending": pending_count,
        "approved": approved_count,
        "rejected": rejected_count,
        "total_requests": pending_count + approved_count + rejected_count
    }