from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
import models, schemas
from passlib.context import CryptContext
from fastapi import HTTPException
from sqlalchemy.orm import joinedload

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Genre operations
def get_genres(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Genre).offset(skip).limit(limit).all()


# Artist operations
def get_artists(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Artist).offset(skip).limit(limit).all()


def search_artists(db: Session, query: str):
    return db.query(models.Artist).filter(
        models.Artist.name.match(query)
    ).all()


# Album operations
def get_albums(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Album).offset(skip).limit(limit).all()


def search_albums(db: Session, query: str):
    return db.query(models.Album).filter(
        models.Album.title.match(query)
    ).all()


# Track operations
def get_tracks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Track).options(
        joinedload(models.Track.album).joinedload(models.Album.artist),
        joinedload(models.Track.album).joinedload(models.Album.genre)
    ).offset(skip).limit(limit).all()


def search_tracks(db: Session, query: str):
    return db.query(models.Track).options(
        joinedload(models.Track.album).joinedload(models.Album.artist),
        joinedload(models.Track.album).joinedload(models.Album.genre)
    ).filter(
        models.Track.title.match(query)
    ).all()


def get_tracks_by_genre(db: Session, genre_id: int, limit: int = 50):
    return db.query(models.Track).options(
        joinedload(models.Track.album).joinedload(models.Album.artist),
        joinedload(models.Track.album).joinedload(models.Album.genre)
    ).join(models.Album).filter(
        models.Album.genre_id == genre_id
    ).limit(limit).all()


# Playlist operations
def get_user_playlists(db: Session, user_id: int):
    playlists = db.query(models.Playlist).filter(
        models.Playlist.user_id == user_id
    ).all()

    result = []
    for playlist in playlists:
        track_count = db.query(models.PlaylistTrack).filter(
            models.PlaylistTrack.playlist_id == playlist.id
        ).count()

        playlist_dict = {
            "id": playlist.id,
            "name": playlist.name,
            "user_id": playlist.user_id,
            "description": playlist.description,
            "created_at": playlist.created_at,
            "is_public": playlist.is_public,
            "track_count": track_count
        }

        result.append(playlist_dict)

    return result


def create_playlist(db: Session, playlist: schemas.PlaylistCreate, user_id: int):
    # Здесь можно добавить проверку, что user_id существует в music_auth
    # Но так как базы разделены, мы доверяем аутентификации

    db_playlist = models.Playlist(**playlist.dict(), user_id=user_id)
    db.add(db_playlist)
    db.commit()
    db.refresh(db_playlist)
    return db_playlist

def get_tracks_in_playlist(db: Session, playlist_id: int):
    tracks = db.query(models.Track).options(
        joinedload(models.Track.album).joinedload(models.Album.artist),
        joinedload(models.Track.album).joinedload(models.Album.genre)
    ).join(
        models.PlaylistTrack
    ).filter(
        models.PlaylistTrack.playlist_id == playlist_id
    ).all()

    return tracks


def remove_track_from_playlist(db: Session, playlist_id: int, track_id: int):
    db_playlist_track = db.query(models.PlaylistTrack).filter(
        models.PlaylistTrack.playlist_id == playlist_id,
        models.PlaylistTrack.track_id == track_id
    ).first()

    if db_playlist_track:
        db.delete(db_playlist_track)
        db.commit()

    return db_playlist_track


def add_track_to_playlist(db: Session, playlist_id: int, track_id: int):
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    track = db.query(models.Track).filter(models.Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    existing = db.query(models.PlaylistTrack).filter(
        models.PlaylistTrack.playlist_id == playlist_id,
        models.PlaylistTrack.track_id == track_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Track already in playlist")

    db_playlist_track = models.PlaylistTrack(
        playlist_id=playlist_id,
        track_id=track_id
    )

    db.add(db_playlist_track)
    db.commit()
    db.refresh(db_playlist_track)

    return {"message": "Track added to playlist successfully"}