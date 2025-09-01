from app.database import SessionLocal
from app import models
from app.auth import get_password_hash
from datetime import datetime

db = SessionLocal()

# No demo users - users will register themselves

# Create sample wetlands
wetland1 = models.Wetland(name="Urban Wetland 1", location="City Center", size=10.5, type="Natural", description="Main urban wetland", created_at=datetime.utcnow())
wetland2 = models.Wetland(name="Urban Wetland 2", location="Suburb", size=5.2, type="Constructed", description="Restored wetland", created_at=datetime.utcnow())
db.add(wetland1)
db.add(wetland2)
db.commit()

# Create sample observations
obs1 = models.Observation(wetland_id=1, species="Duck", count=5, date=datetime.utcnow(), notes="Healthy population")
obs2 = models.Observation(wetland_id=1, species="Frog", count=10, date=datetime.utcnow())
obs3 = models.Observation(wetland_id=2, species="Heron", count=2, date=datetime.utcnow())
db.add(obs1)
db.add(obs2)
db.add(obs3)
db.commit()

# Create sample sensors
sensor_device1 = models.Sensor(
    wetland_id=1,
    sensor_id="TEMP_PH_DO_001",
    name="Multi-Parameter Sensor 1",
    type="multi-parameter",
    status="active",
    battery_level=85.5,
    firmware_version="1.2.3",
    last_seen=datetime.utcnow()
)
sensor_device2 = models.Sensor(
    wetland_id=2,
    sensor_id="TURBIDITY_002",
    name="Turbidity Sensor 2",
    type="turbidity",
    status="active",
    battery_level=92.0,
    firmware_version="1.1.0",
    last_seen=datetime.utcnow()
)
db.add(sensor_device1)
db.add(sensor_device2)
db.commit()

# Create sample sensor data
sensor1 = models.SensorData(sensor_id=1, wetland_id=1, timestamp=datetime.utcnow(), temperature=22.5, ph=7.2, dissolved_oxygen=8.5, turbidity=5.0)
sensor2 = models.SensorData(sensor_id=2, wetland_id=2, timestamp=datetime.utcnow(), temperature=21.0, ph=7.0, dissolved_oxygen=9.0, turbidity=3.0)
sensor3 = models.SensorData(sensor_id=1, wetland_id=1, timestamp=datetime.utcnow(), temperature=23.0, ph=7.1, dissolved_oxygen=8.0, turbidity=4.5)
db.add(sensor1)
db.add(sensor2)
db.add(sensor3)
db.commit()

db.close()

print("Database seeded successfully")