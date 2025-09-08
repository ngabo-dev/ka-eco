from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../../.env.development")

# Database configuration - MySQL (Aiven Cloud)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://avnadmin:AVNS_WITWvsvc9gFo-mvSuAB@ka-eco-ka-eco.d.aivencloud.com:13837/ka-eco")
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,  # Set to True for development debugging
    pool_pre_ping=True,  # Test connections before using them
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args={
        "ssl": {
            "ssl_mode": "VERIFY_IDENTITY"
        }
    } if "mysql" in SQLALCHEMY_DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()