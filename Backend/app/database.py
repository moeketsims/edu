"""
Database configuration and setup for the Student Module Checker
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database configuration
DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite")  # Force SQLite for current dataset
DATABASE_URL = os.getenv("DATABASE_URL")

def create_database_engine():
    """Create database engine with automatic fallback from PostgreSQL to SQLite"""
    
    # Try PostgreSQL first if auto or explicitly requested
    if DATABASE_TYPE in ["auto", "postgresql"]:
        try:
            # Force SQLite by disabling PostgreSQL import
            raise ImportError("Using SQLite for this system")
            
            # Use PostgreSQL
            if not DATABASE_URL:
                # For development: use SQLite. For production: use postgres hostname
                pg_url = "postgresql://edu_user:edu_password@nonexistent:5432/edu_database"  # Change to 'postgres' for production
            else:
                pg_url = DATABASE_URL
            
            print(f"🐘 Trying PostgreSQL connection: {pg_url.split('@')[-1]}")
            
            # Test connection
            engine = create_engine(
                pg_url,
                pool_size=20,
                max_overflow=30,
                pool_pre_ping=True,
                pool_recycle=300,
                echo=False
            )
            
            # Test the connection
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("SELECT 1"))
            
            print("✅ PostgreSQL connected successfully!")
            return engine, "postgresql"
            
        except ImportError:
            print("⚠️  psycopg2 not available - falling back to SQLite")
        except Exception as e:
            print(f"⚠️  PostgreSQL connection failed: {str(e)} - falling back to SQLite")
    
    # Fallback to SQLite
    if not DATABASE_URL or "postgresql" in DATABASE_URL:
        sqlite_url = "sqlite:///./student_module_checker.db"
    else:
        sqlite_url = DATABASE_URL
    
    print(f"🗃️  Using SQLite: {sqlite_url}")
    
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False},
        echo=False
    )
    
    return engine, "sqlite"

# Create the engine
engine, database_type = create_database_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)

def get_database_info():
    """Get current database information"""
    return {
        "database_type": database_type,
        "database_url": str(engine.url),
        "is_postgresql": database_type == "postgresql",
        "supports_bulk_operations": database_type == "postgresql"
    } 