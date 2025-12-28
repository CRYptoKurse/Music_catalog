from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)


class Artist(Base):
    __tablename__ = "artists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    biography = Column(Text)
    country = Column(String(50))
    formed_year = Column(Integer)

    albums = relationship("Album", back_populates="artist")


class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    artist_id = Column(Integer, ForeignKey("artists.id", ondelete="CASCADE"))
    release_year = Column(Integer)
    genre_id = Column(Integer, ForeignKey("genres.id", ondelete="SET NULL"))
    cover_image = Column(String(255))

    artist = relationship("Artist", back_populates="albums")
    genre = relationship("Genre")
    tracks = relationship("Track", back_populates="album")


class Track(Base):
    __tablename__ = "tracks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    album_id = Column(Integer, ForeignKey("albums.id", ondelete="CASCADE"))
    duration = Column(Integer)
    track_number = Column(Integer)
    file_path = Column(String(255))

    album = relationship("Album", back_populates="tracks")
    playlists = relationship("PlaylistTrack", back_populates="track")


class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    user_id = Column(Integer, nullable=False)  # Просто Integer, без ForeignKey
    description = Column(Text)
    created_at = Column(DateTime, default=func.now())
    is_public = Column(Boolean, default=False)

    tracks = relationship("PlaylistTrack", back_populates="playlist")

    # НЕТ relationship к User, так как пользователи в другой базе

class PlaylistTrack(Base):
    __tablename__ = "playlist_tracks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"))
    track_id = Column(Integer, ForeignKey("tracks.id", ondelete="CASCADE"))
    added_at = Column(DateTime, default=func.now())

    playlist = relationship("Playlist", back_populates="tracks")
    track = relationship("Track", back_populates="playlists")