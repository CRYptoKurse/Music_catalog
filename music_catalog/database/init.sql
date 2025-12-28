-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1:3306
-- Время создания: Дек 08 2025 г., 09:40
-- Версия сервера: 9.1.0
-- Версия PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `kurse`
--

-- --------------------------------------------------------

--
-- Структура таблицы `albums`
--

DROP TABLE IF EXISTS `albums`;
CREATE TABLE IF NOT EXISTS `albums` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `artist_id` int DEFAULT NULL,
  `release_year` int DEFAULT NULL,
  `genre_id` int DEFAULT NULL,
  `cover_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_artist_id` (`artist_id`),
  KEY `idx_genre_id` (`genre_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `albums`
--

INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_year`, `genre_id`, `cover_image`) VALUES
(1, 'Abbey Road', 1, 1969, 1, NULL),
(2, 'A Night at the Opera', 2, 1975, 1, NULL),
(3, 'Origin of Symmetry', 3, 2001, 1, NULL),
(4, 'Точка', 4, 2019, 1, NULL),
(5, 'Баста 5', 5, 2018, 6, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `artists`
--

DROP TABLE IF EXISTS `artists`;
CREATE TABLE IF NOT EXISTS `artists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `biography` text COLLATE utf8mb4_unicode_ci,
  `country` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formed_year` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `artists`
--

INSERT INTO `artists` (`id`, `name`, `biography`, `country`, `formed_year`) VALUES
(1, 'The Beatles', NULL, 'Великобритания', 1960),
(2, 'Queen', NULL, 'Великобритания', 1970),
(3, 'Muse', NULL, 'Великобритания', 1994),
(4, 'Ленинград', NULL, 'Россия', 1997),
(5, 'Баста', NULL, 'Россия', 1998);

-- --------------------------------------------------------

--
-- Структура таблицы `genres`
--

DROP TABLE IF EXISTS `genres`;
CREATE TABLE IF NOT EXISTS `genres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `genres`
--

INSERT INTO `genres` (`id`, `name`, `description`) VALUES
(1, 'Рок', 'Рок-музыка'),
(2, 'Поп', 'Поп-музыка'),
(3, 'Джаз', 'Джазовая музыка'),
(4, 'Классика', 'Классическая музыка'),
(5, 'Электроника', 'Электронная музыка'),
(6, 'Хип-хоп', 'Хип-хоп музыка');

-- --------------------------------------------------------

--
-- Структура таблицы `playlists`
--

DROP TABLE IF EXISTS `playlists`;
CREATE TABLE IF NOT EXISTS `playlists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_public` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `playlists`
--

INSERT INTO `playlists` (`id`, `name`, `user_id`, `description`, `created_at`, `is_public`) VALUES
(1, 'Мой первый плейлист', 1, 'Плейлист для тестирования системы', '2025-12-08 09:39:43', 0);

-- --------------------------------------------------------

--
-- Структура таблицы `playlist_tracks`
--

DROP TABLE IF EXISTS `playlist_tracks`;
CREATE TABLE IF NOT EXISTS `playlist_tracks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `playlist_id` int DEFAULT NULL,
  `track_id` int DEFAULT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_playlist_track` (`playlist_id`,`track_id`),
  KEY `idx_playlist_id` (`playlist_id`),
  KEY `idx_track_id` (`track_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `tracks`
--

DROP TABLE IF EXISTS `tracks`;
CREATE TABLE IF NOT EXISTS `tracks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `album_id` int DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `track_number` int DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_album_id` (`album_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `tracks`
--

INSERT INTO `tracks` (`id`, `title`, `album_id`, `duration`, `track_number`, `file_path`) VALUES
(1, 'Come Together', 1, 259, 1, NULL),
(2, 'Something', 1, 182, 2, NULL),
(3, 'Bohemian Rhapsody', 2, 354, 1, NULL),
(4, 'Plug in Baby', 3, 220, 1, NULL),
(5, 'Вояджер-1', 4, 204, 1, NULL),
(6, 'Сансара', 5, 242, 1, NULL);

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `albums`
--
ALTER TABLE `albums` ADD FULLTEXT KEY `ft_title` (`title`);

--
-- Индексы таблицы `artists`
--
ALTER TABLE `artists` ADD FULLTEXT KEY `ft_name` (`name`);

--
-- Индексы таблицы `tracks`
--
ALTER TABLE `tracks` ADD FULLTEXT KEY `ft_title` (`title`);

--
-- Ограничения внешнего ключа сохраненных таблиц
--



--
-- Ограничения внешнего ключа таблицы `albums`
--
ALTER TABLE `albums`
  ADD CONSTRAINT `albums_ibfk_1` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `albums_ibfk_2` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `playlist_tracks`
--
ALTER TABLE `playlist_tracks`
  ADD CONSTRAINT `playlist_tracks_ibfk_1` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `playlist_tracks_ibfk_2` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `tracks`
--
ALTER TABLE `tracks`
  ADD CONSTRAINT `tracks_ibfk_1` FOREIGN KEY (`album_id`) REFERENCES `albums` (`id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;