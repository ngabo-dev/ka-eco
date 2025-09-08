from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../../.env.development")

# Database configuration - MySQL (Aiven Cloud)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,  # Set to True for development debugging
    connect_args={
        "ssl": {
            "ssl_mode": "VERIFY_IDENTITY"
        }
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()