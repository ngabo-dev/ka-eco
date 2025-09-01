from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Integer, default=1)
    role = Column(String, default="researcher")  # admin, researcher, government_official, community_member
    full_name = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, nullable=True)

    settings = relationship("UserSettings", back_populates="user")

class Wetland(Base):
    __tablename__ = "wetlands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    size = Column(Float)
    type = Column(String)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime)

    observations = relationship("Observation", back_populates="wetland")
    sensors = relationship("Sensor", back_populates="wetland")
    sensor_data = relationship("SensorData", back_populates="wetland")

class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    wetland_id = Column(Integer, ForeignKey("wetlands.id"))
    species = Column(String)
    count = Column(Integer)
    date = Column(DateTime)
    notes = Column(Text, nullable=True)

    wetland = relationship("Wetland", back_populates="observations")

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    wetland_id = Column(Integer, ForeignKey("wetlands.id"))
    sensor_id = Column(String, unique=True, index=True)  # Unique identifier for the physical sensor
    name = Column(String)
    type = Column(String)  # temperature, ph, dissolved_oxygen, turbidity, multi-parameter
    status = Column(String, default="active")  # active, inactive, maintenance, error
    last_seen = Column(DateTime, nullable=True)
    installed_at = Column(DateTime, default=datetime.utcnow)
    battery_level = Column(Float, nullable=True)
    firmware_version = Column(String, nullable=True)

    wetland = relationship("Wetland", back_populates="sensors")
    sensor_data = relationship("SensorData", back_populates="sensor")

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=True)
    wetland_id = Column(Integer, ForeignKey("wetlands.id"))
    timestamp = Column(DateTime)
    temperature = Column(Float, nullable=True)
    ph = Column(Float, nullable=True)
    dissolved_oxygen = Column(Float, nullable=True)
    turbidity = Column(Float, nullable=True)

    sensor = relationship("Sensor", back_populates="sensor_data")
    wetland = relationship("Wetland", back_populates="sensor_data")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    setting_key = Column(String(100), nullable=False)
    setting_value = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="settings")

    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_unicode_ci'},
    )

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    alert_type = Column(String(50), nullable=False)  # critical, warning, info
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    is_active = Column(Integer, default=1)
    wetland_id = Column(Integer, ForeignKey("wetlands.id"), nullable=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=True)
    threshold_value = Column(Float, nullable=True)
    actual_value = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)

    wetland = relationship("Wetland")
    sensor = relationship("Sensor")
    acknowledger = relationship("User", foreign_keys=[acknowledged_by])

    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_unicode_ci'},
    )

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # email, sms, push, in_app
    is_read = Column(Integer, default=0)
    sent_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    alert = relationship("Alert")

    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_unicode_ci'},
    )

class CommunityReport(Base):
    __tablename__ = "community_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_name = Column(String(100), nullable=False)
    reporter_email = Column(String(100), nullable=True)
    reporter_phone = Column(String(20), nullable=True)
    report_type = Column(String(50), nullable=False)  # pollution, encroachment, illegal_dumping, habitat_destruction, other
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_description = Column(Text, nullable=True)
    wetland_id = Column(Integer, ForeignKey("wetlands.id"), nullable=True)
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    status = Column(String(20), default="pending")  # pending, investigating, resolved, closed
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    images = Column(Text, nullable=True)  # JSON array of image URLs
    evidence_files = Column(Text, nullable=True)  # JSON array of file URLs
    follow_up_required = Column(Integer, default=0)
    follow_up_date = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    wetland = relationship("Wetland")
    assigned_user = relationship("User", foreign_keys=[assigned_to])

    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_unicode_ci'},
    )

class ConservationProject(Base):
    __tablename__ = "conservation_projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    project_type = Column(String(50), nullable=False)  # restoration, monitoring, education, research, other
    status = Column(String(20), default="planning")  # planning, active, completed, cancelled, on_hold
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    budget = Column(Float, nullable=True)
    funding_source = Column(String(100), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    completion_percentage = Column(Integer, default=0)
    wetland_id = Column(Integer, ForeignKey("wetlands.id"), nullable=True)
    lead_organization = Column(String(100), nullable=True)
    partners = Column(Text, nullable=True)  # JSON array of partner organizations
    objectives = Column(Text, nullable=True)  # JSON array of project objectives
    expected_outcomes = Column(Text, nullable=True)  # JSON array of expected outcomes
    actual_outcomes = Column(Text, nullable=True)  # JSON array of actual outcomes
    challenges = Column(Text, nullable=True)
    lessons_learned = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    wetland = relationship("Wetland")
    creator = relationship("User", foreign_keys=[created_by])
    assignee = relationship("User", foreign_keys=[assigned_to])

    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_unicode_ci'},
    )

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    resource_type = Column(String(50), nullable=False)  # document, research_paper, guideline, video, image, other
    category = Column(String(50), nullable=True)  # conservation, research, education, policy, technical
    file_path = Column(String(500), nullable=True)
    file_url = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    tags = Column(Text, nullable=True)  # JSON array of tags
    is_public = Column(Integer, default=1)
    download_count = Column(Integer, default=0)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    uploader = relationship("User", foreign_keys=[uploaded_by])
    approver = relationship("User", foreign_keys=[approved_by])

    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_unicode_ci'},
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    resource_type = Column(String(50), nullable=False)  # user, wetland, sensor, alert, etc.
    resource_id = Column(Integer, nullable=True)
    old_values = Column(Text, nullable=True)  # JSON of old values
    new_values = Column(Text, nullable=True)  # JSON of new values
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_unicode_ci'},
    )