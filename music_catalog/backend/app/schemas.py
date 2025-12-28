from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


class GenreBase(BaseModel):
    name: str
    description: Optional[str] = None


class Genre(GenreBase):
    id: int

    class Config:
        from_attributes = True


class ArtistBase(BaseModel):
    name: str
    biography: Optional[str] = None
    country: Optional[str] = None
    formed_year: Optional[int] = None


class Artist(ArtistBase):
    id: int

    class Config:
        from_attributes = True


class AlbumBase(BaseModel):
    title: str
    release_year: Optional[int] = None
    cover_image: Optional[str] = None


class AlbumCreate(AlbumBase):
    artist_id: int
    genre_id: int


class Album(AlbumBase):
    id: int
    artist: Artist
    genre: Genre

    class Config:
        from_attributes = True


class TrackBase(BaseModel):
    title: str
    duration: Optional[int] = None
    track_number: Optional[int] = None
    file_path: Optional[str] = None


class TrackCreate(TrackBase):
    album_id: int


class Track(TrackBase):
    id: int
    album: Album

    class Config:
        from_attributes = True


class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False


class PlaylistSimple(BaseModel):
    id: int
    name: str
    user_id: int  # ID пользователя из базы music_auth
    description: Optional[str] = None
    created_at: datetime
    is_public: bool = False
    track_count: int = 0

    class Config:
        from_attributes = True

class PlaylistCreate(PlaylistBase):
    pass


class Playlist(PlaylistBase):
    id: int
    user_id: int  # Только ID, без полной информации о пользователе
    created_at: datetime
    tracks: List[Track] = []

    class Config:
        from_attributes = True

class RecommendationRequest(BaseModel):
    user_id: int
    limit: int = 10


class RecommendationResponse(BaseModel):
    tracks: List[Track]
    reason: str