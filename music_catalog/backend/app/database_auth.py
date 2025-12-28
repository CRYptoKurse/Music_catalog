from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import pymysql

# MySQL connection string для базы аутентификации
AUTH_DATABASE_URL = "mysql+pymysql://root:@localhost:3306/music_auth"

auth_engine = create_engine(
    AUTH_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"charset": "utf8mb4"}
)

AuthSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=auth_engine)
AuthBase = declarative_base()

def get_auth_db():
    db = AuthSessionLocal()
    try:
        yield db
    finally:
        db.close()