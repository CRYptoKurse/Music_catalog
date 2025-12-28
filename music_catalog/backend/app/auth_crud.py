from sqlalchemy.orm import Session
from auth_models import AuthUser, Session as AuthSession
from auth_schemas import UserRegister
from passlib.context import CryptContext
from datetime import datetime, timedelta
import secrets
from fastapi import HTTPException

# Используем PBKDF2 вместо bcrypt (более стабильно)
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    default="pbkdf2_sha256",
    pbkdf2_sha256__default_rounds=30000
)


def get_user_by_username(db: Session, username: str):
    return db.query(AuthUser).filter(AuthUser.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(AuthUser).filter(AuthUser.email == email).first()


def create_user(db: Session, user: UserRegister):
    if get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already registered")

    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    db_user = AuthUser(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role='user'
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_session(db: Session, user_id: int):
    token = secrets.token_hex(32)
    expires_at = datetime.now() + timedelta(days=7)

    session = AuthSession(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return token, expires_at


def get_session_by_token(db: Session, token: str):
    return db.query(AuthSession).filter(
        AuthSession.token == token,
        AuthSession.expires_at > datetime.now()
    ).first()


def delete_session(db: Session, token: str):
    session = db.query(AuthSession).filter(AuthSession.token == token).first()
    if session:
        db.delete(session)
        db.commit()
    return True


def get_user_by_id(db: Session, user_id: int):
    return db.query(AuthUser).filter(AuthUser.id == user_id).first()