from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: str
    role: Optional[str] = "researcher"
    full_name: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    approval_status: Optional[str] = "pending"
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

class UserRejection(BaseModel):
    reason: str

# Wetland schemas
class WetlandBase(BaseModel):
    name: str
    location: str
    size: float
    type: str
    description: Optional[str] = None

class WetlandCreate(WetlandBase):
    pass

class Wetland(WetlandBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Observation schemas
class ObservationBase(BaseModel):
    wetland_id: int
    species: str
    count: int
    date: datetime
    notes: Optional[str] = None

class ObservationCreate(ObservationBase):
    pass

class Observation(ObservationBase):
    id: int

    class Config:
        from_attributes = True

# Sensor schemas
class SensorBase(BaseModel):
    wetland_id: int
    sensor_id: str
    name: str
    type: str
    status: Optional[str] = "active"
    battery_level: Optional[float] = None
    firmware_version: Optional[str] = None

class SensorCreate(SensorBase):
    pass

class Sensor(SensorBase):
    id: int
    last_seen: Optional[datetime] = None
    installed_at: datetime

    class Config:
        from_attributes = True

# SensorData schemas
class SensorDataBase(BaseModel):
    sensor_id: Optional[int] = None
    wetland_id: int
    timestamp: datetime
    temperature: Optional[float] = None
    ph: Optional[float] = None
    dissolved_oxygen: Optional[float] = None
    turbidity: Optional[float] = None

class SensorDataCreate(SensorDataBase):
    pass

class SensorData(SensorDataBase):
    id: int

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Password management schemas
class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordReset(BaseModel):
    email: str
    new_password: str
    confirm_password: str

# User Settings schemas
class UserSettingBase(BaseModel):
    setting_key: str
    setting_value: Optional[str] = None

class UserSettingCreate(UserSettingBase):
    pass

class UserSetting(UserSettingBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Alert schemas
class AlertBase(BaseModel):
    title: str
    message: str
    alert_type: str
    severity: Optional[str] = "medium"
    wetland_id: Optional[int] = None
    sensor_id: Optional[int] = None
    threshold_value: Optional[float] = None
    actual_value: Optional[float] = None

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: int
    is_active: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Notification schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: str

class NotificationCreate(NotificationBase):
    user_id: int
    alert_id: Optional[int] = None

class Notification(NotificationBase):
    id: int
    user_id: int
    alert_id: Optional[int] = None
    is_read: bool
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Community Report schemas
class CommunityReportBase(BaseModel):
    reporter_name: str
    reporter_email: Optional[str] = None
    reporter_phone: Optional[str] = None
    report_type: str
    title: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_description: Optional[str] = None
    wetland_id: Optional[int] = None
    severity: Optional[str] = "medium"
    status: Optional[str] = "pending"
    priority: Optional[str] = "normal"
    assigned_to: Optional[int] = None
    images: Optional[str] = None  # JSON string
    evidence_files: Optional[str] = None  # JSON string
    follow_up_required: Optional[bool] = False
    follow_up_date: Optional[datetime] = None
    resolution_notes: Optional[str] = None

class CommunityReportCreate(CommunityReportBase):
    pass

class CommunityReportUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[datetime] = None
    resolution_notes: Optional[str] = None

class CommunityReport(CommunityReportBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True