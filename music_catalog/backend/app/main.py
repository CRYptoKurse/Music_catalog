from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
import crud, models, schemas, recommendations
from database import SessionLocal, engine, get_db
from database_auth import get_auth_db
from auth_crud import get_user_by_username, verify_password, create_session, get_session_by_token, delete_session, \
    get_user_by_id
from auth_schemas import UserLogin, UserRegister, Token, UserResponse
from auth_models import AuthUser, Session as AuthSession
from typing import List
from datetime import datetime, timedelta

# Создание таблиц основной базы
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Music Catalog API",
    description="API для системы каталогизации музыкальных композиций",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# Dependency для получения текущего пользователя
async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Security(security),
        auth_db: Session = Depends(get_auth_db)
):
    token = credentials.credentials
    session = get_session_by_token(auth_db, token)

    if not session:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = auth_db.query(AuthUser).filter(AuthUser.id == session.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="User not found or inactive")

    return user


# Dependency для проверки роли админа
async def get_current_admin(current_user: AuthUser = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# Эндпоинты аутентификации
@app.post("/register", response_model=UserResponse)
def register(user: UserRegister, db: Session = Depends(get_auth_db)):
    from auth_crud import create_user
    return create_user(db, user)


@app.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_auth_db)):
    user = get_user_by_username(db, user_data.username)
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="User inactive")

    token, expires_at = create_session(db, user.id)

    return Token(
        access_token=token,
        token_type="bearer",
        user=user
    )


@app.post("/logout")
def logout(
        current_user: AuthUser = Depends(get_current_user),
        db: Session = Depends(get_auth_db)
):
    # Получаем токен из заголовка
    # В реальном приложении токен должен передаваться в теле запроса или через заголовки
    # Для простоты удаляем все сессии пользователя
    sessions = db.query(AuthSession).filter(AuthSession.user_id == current_user.id).all()
    for session in sessions:
        db.delete(session)
    db.commit()
    return {"message": "Logged out successfully"}


@app.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: AuthUser = Depends(get_current_user)):
    return current_user


# Health check endpoint
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


# Genre endpoints
@app.get("/genres/", response_model=List[schemas.Genre])
def read_genres(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    genres = crud.get_genres(db, skip=skip, limit=limit)
    return genres


# Artist endpoints
@app.get("/artists/", response_model=List[schemas.Artist])
def read_artists(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    artists = crud.get_artists(db, skip=skip, limit=limit)
    return artists


@app.get("/artists/search/", response_model=List[schemas.Artist])
def search_artists(query: str, db: Session = Depends(get_db)):
    if len(query) < 2:
        return []
    artists = crud.search_artists(db, query=query)
    return artists


# Album endpoints
@app.get("/albums/", response_model=List[schemas.Album])
def read_albums(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    albums = crud.get_albums(db, skip=skip, limit=limit)
    return albums


@app.get("/albums/search/", response_model=List[schemas.Album])
def search_albums(query: str, db: Session = Depends(get_db)):
    if len(query) < 2:
        return []
    albums = crud.search_albums(db, query=query)
    return albums


# Track endpoints
@app.get("/tracks/", response_model=List[schemas.Track])
def read_tracks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tracks = crud.get_tracks(db, skip=skip, limit=limit)
    return tracks


@app.get("/tracks/search/", response_model=List[schemas.Track])
def search_tracks(query: str, db: Session = Depends(get_db)):
    if len(query) < 2:
        return []
    tracks = crud.search_tracks(db, query=query)
    return tracks


@app.get("/tracks/genre/{genre_id}", response_model=List[schemas.Track])
def get_tracks_by_genre(genre_id: int, limit: int = 50, db: Session = Depends(get_db)):
    tracks = crud.get_tracks_by_genre(db, genre_id=genre_id, limit=limit)
    return tracks


# Playlist endpoints (требуют аутентификации)
@app.get("/users/playlists/", response_model=List[schemas.PlaylistSimple])
def read_user_playlists(
        current_user: AuthUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    playlists = crud.get_user_playlists(db, user_id=current_user.id)
    return playlists


@app.post("/users/playlists/", response_model=schemas.Playlist)
def create_playlist_for_user(
        playlist: schemas.PlaylistCreate,
        current_user: AuthUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    return crud.create_playlist(db=db, playlist=playlist, user_id=current_user.id)


@app.get("/playlists/{playlist_id}/tracks/", response_model=List[schemas.Track])
def get_playlist_tracks(
        playlist_id: int,
        current_user: AuthUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Проверяем, что плейлист принадлежит пользователю или является публичным
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    if playlist.user_id != current_user.id and not playlist.is_public:
        raise HTTPException(status_code=403, detail="Access denied")

    tracks = crud.get_tracks_in_playlist(db, playlist_id=playlist_id)
    return tracks


@app.post("/playlists/{playlist_id}/tracks/{track_id}")
def add_track_to_playlist(
        playlist_id: int,
        track_id: int,
        current_user: AuthUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Проверяем, что плейлист принадлежит пользователю
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    if playlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only add tracks to your own playlists")

    return crud.add_track_to_playlist(db, playlist_id=playlist_id, track_id=track_id)


@app.delete("/playlists/{playlist_id}/tracks/{track_id}")
def remove_track_from_playlist(
        playlist_id: int,
        track_id: int,
        current_user: AuthUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Проверяем, что плейлист принадлежит пользователю
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    if playlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only remove tracks from your own playlists")

    result = crud.remove_track_from_playlist(db, playlist_id=playlist_id, track_id=track_id)
    if not result:
        raise HTTPException(status_code=404, detail="Track not found in playlist")
    return {"message": "Track removed from playlist"}


# Recommendation endpoint (требует аутентификации)
@app.get("/recommendations/", response_model=schemas.RecommendationResponse)
def get_recommendations(
        limit: int = 10,
        current_user: AuthUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    return recommendations.get_recommendations(db, user_id=current_user.id, limit=limit)


# Admin endpoints
@app.get("/admin/users", response_model=List[UserResponse])
def get_all_users(
        current_user: AuthUser = Depends(get_current_admin),
        auth_db: Session = Depends(get_auth_db)
):
    users = auth_db.query(AuthUser).all()
    return users


@app.post("/admin/users/{user_id}/toggle")
def toggle_user_active(
        user_id: int,
        current_user: AuthUser = Depends(get_current_admin),
        auth_db: Session = Depends(get_auth_db)
):
    # Проверяем, что пользователь не пытается заблокировать себя
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account"
        )

    user = get_user_by_id(auth_db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    auth_db.commit()
    auth_db.refresh(user)

    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'}",
        "user": user
    }


# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Music Catalog API is running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)