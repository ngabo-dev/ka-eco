from app.database import SessionLocal
from app import models

db = SessionLocal()
wetlands = db.query(models.Wetland).all()
print(f"Wetlands in database: {len(wetlands)}")
for wetland in wetlands:
    print(f"  ID: {wetland.id}, Name: {wetland.name}, Location: {wetland.location}, Size: {wetland.size}, Type: {wetland.type}")
db.close()