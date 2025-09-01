from app.database import SessionLocal
from app import models

db = SessionLocal()
users = db.query(models.User).all()
print(f"Users in database: {len(users)}")
for user in users:
    print(f"  {user.username}: {user.email} - Role: {user.role}")
db.close()