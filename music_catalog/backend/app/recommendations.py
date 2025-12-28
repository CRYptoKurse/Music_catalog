from sqlalchemy.orm import Session, joinedload
import models, schemas
from typing import List
from sqlalchemy import func


def get_recommendations(db: Session, user_id: int, limit: int = 10) -> schemas.RecommendationResponse:
    """
    Генерирует рекомендации на основе:
    1. Жанров из плейлистов пользователя
    2. Исполнителей из плейлистов пользователя
    3. Популярных треков в системе
    """

    # Получаем жанры из плейлистов пользователя
    user_genres_subquery = db.query(models.Album.genre_id).join(
        models.Track, models.Track.album_id == models.Album.id
    ).join(
        models.PlaylistTrack, models.PlaylistTrack.track_id == models.Track.id
    ).join(
        models.Playlist, models.Playlist.id == models.PlaylistTrack.playlist_id
    ).filter(
        models.Playlist.user_id == user_id
    ).distinct().subquery()

    user_genre_ids = [row[0] for row in db.query(user_genres_subquery).all() if row[0] is not None]

    # Получаем исполнителей из плейлистов пользователя
    user_artists_subquery = db.query(models.Album.artist_id).join(
        models.Track, models.Track.album_id == models.Album.id
    ).join(
        models.PlaylistTrack, models.PlaylistTrack.track_id == models.Track.id
    ).join(
        models.Playlist, models.Playlist.id == models.PlaylistTrack.playlist_id
    ).filter(
        models.Playlist.user_id == user_id
    ).distinct().subquery()

    user_artist_ids = [row[0] for row in db.query(user_artists_subquery).all() if row[0] is not None]

    # Получаем треки, которые уже есть в плейлистах пользователя
    user_tracks_subquery = db.query(models.PlaylistTrack.track_id).join(
        models.Playlist, models.Playlist.id == models.PlaylistTrack.playlist_id
    ).filter(
        models.Playlist.user_id == user_id
    ).distinct().subquery()

    user_track_ids = [row[0] for row in db.query(user_tracks_subquery).all()]

    # Строим базовый запрос для рекомендаций с правильными JOIN
    query = db.query(models.Track).options(
        joinedload(models.Track.album).joinedload(models.Album.artist),
        joinedload(models.Track.album).joinedload(models.Album.genre)
    ).join(models.Album, models.Track.album_id == models.Album.id)

    # Исключаем треки, которые уже есть у пользователя
    if user_track_ids:
        query = query.filter(~models.Track.id.in_(user_track_ids))

    # Приоритет 1: треки того же жанра, что и в плейлистах пользователя
    if user_genre_ids:
        recommended_tracks = query.filter(
            models.Album.genre_id.in_(user_genre_ids)
        ).limit(limit).all()
        reason = "На основе ваших предпочтений в жанрах"
    else:
        # Приоритет 2: треки популярных исполнителей (по количеству в плейлистах)
        popular_artists_subquery = db.query(
            models.Album.artist_id,
            func.count(models.PlaylistTrack.id).label('playlist_count')
        ).join(
            models.Track, models.Track.album_id == models.Album.id
        ).join(
            models.PlaylistTrack, models.PlaylistTrack.track_id == models.Track.id
        ).group_by(
            models.Album.artist_id
        ).order_by(
            func.count(models.PlaylistTrack.id).desc()
        ).limit(5).subquery()

        popular_artist_ids = [row[0] for row in db.query(popular_artists_subquery.c.artist_id).all()]

        if popular_artist_ids:
            recommended_tracks = query.filter(
                models.Album.artist_id.in_(popular_artist_ids)
            ).limit(limit).all()
            reason = "Популярные треки в системе"
        else:
            # Приоритет 3: случайные треки
            # В MySQL используем RAND() вместо random()
            recommended_tracks = query.order_by(func.rand()).limit(limit).all()
            reason = "Новые треки для вас"

    return schemas.RecommendationResponse(tracks=recommended_tracks, reason=reason)