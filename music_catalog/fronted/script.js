const API_BASE = 'http://localhost:8000';
let currentUser = null;
let currentToken = null;
let currentPlaylistId = null;

// ======================== АУТЕНТИФИКАЦИЯ ========================

// Проверка авторизации при загрузке
function checkAuth() {
    const token = localStorage.getItem('music_token');
    const user = localStorage.getItem('music_user');

    if (token && user) {
        currentToken = token;
        currentUser = JSON.parse(user);

        // Обновляем информацию в навбаре
        updateNavbar();

        // Проверяем валидность токена
        return authFetch(`${API_BASE}/me`)
            .then(response => {
                if (response.ok) {
                    return true;
                } else {
                    logout();
                    return false;
                }
            })
            .catch(() => {
                logout();
                return false;
            });
    }

    // Если нет токена, перенаправляем на страницу входа
    window.location.href = 'auth.html';
    return false;
}

// Функция для запросов с авторизацией
async function authFetch(url, options = {}) {
    const headers = {
        ...options.headers,
        'Content-Type': 'application/json'
    };

    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    return fetch(url, { ...options, headers });
}

// Выход из системы
function logout() {
    // Вызываем логаут на сервере
    if (currentToken) {
        fetch(`${API_BASE}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        }).catch(console.error);
    }

    // Очищаем локальные данные
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('music_token');
    localStorage.removeItem('music_user');

    // Перенаправляем на страницу входа
    window.location.href = 'auth.html';
}

// Обновление информации в навбаре
function updateNavbar() {
    if (currentUser) {
        const usernameElement = document.getElementById('current-username');
        const roleBadge = document.getElementById('user-role-badge');
        const adminBtn = document.getElementById('admin-btn');

        if (usernameElement) {
            usernameElement.textContent = currentUser.username;
        }

        if (roleBadge) {
            roleBadge.textContent = currentUser.role === 'admin' ? 'Админ' : 'Пользователь';
            roleBadge.style.background = currentUser.role === 'admin' ? '#f39c12' : 'rgba(255,255,255,0.3)';
        }

        if (adminBtn) {
            adminBtn.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
        }
    }
}

// ======================== ОСНОВНЫЕ ФУНКЦИИ ========================

// Проверка подключения к API
async function checkApiConnection() {
    console.log("🔍 Проверка подключения к API...");
    try {
        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();
        console.log("✅ API подключен:", data.message);
        return true;
    } catch (error) {
        console.error("❌ API не доступен:", error);
        showErrorMessage("API сервер не отвечает. Запустите бэкенд: python app/main.py в папке backend");
        return false;
    }
}

// Показать сообщение об ошибке
function showErrorMessage(message) {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; background: white; border-radius: 10px; margin: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #e74c3c;">⚠️ Ошибка подключения</h2>
                <p>${message}</p>
                <p>Проверьте:</p>
                <ol style="text-align: left; display: inline-block; margin: 20px auto;">
                    <li>Запущен ли бэкенд-сервер? (должна быть консоль с "Uvicorn running on http://0.0.0.0:8000")</li>
                    <li>Открывается ли <a href="http://localhost:8000/" target="_blank">http://localhost:8000/</a>?</li>
                    <li>Работает ли <a href="http://localhost:8000/docs" target="_blank">http://localhost:8000/docs</a>?</li>
                </ol>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                    Перезагрузить страницу
                </button>
            </div>
        `;
    }
}

// Переключение между секциями
function showSection(sectionName) {
    console.log(`Переключаемся на секцию: ${sectionName}`);

    // Скрыть все секции
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Показать выбранную секцию
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Загрузить данные для секции
    switch(sectionName) {
        case 'catalog':
            loadCatalog();
            loadGenres();
            break;
        case 'playlists':
            loadPlaylists();
            break;
        case 'recommendations':
            loadRecommendations();
            break;
        case 'search':
            // Автоматически загружается при вводе
            break;
        case 'admin':
            if (currentUser && currentUser.role === 'admin') {
                loadAdminUsers();
            } else {
                showSection('catalog');
            }
            break;
        default:
            loadCatalog();
    }
}

// Форматирование длительности
function formatDuration(seconds) {
    if (!seconds) return 'Неизвестно';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ======================== КАТАЛОГ ========================

// Загрузка каталога треков
async function loadCatalog() {
    console.log("Загрузка каталога...");
    const container = document.getElementById('catalog-grid');
    if (!container) return;

    container.innerHTML = '<div class="loading">Загрузка треков...</div>';

    try {
        const response = await authFetch(`${API_BASE}/tracks/`);
        if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`);

        const tracks = await response.json();
        console.log(`Загружено ${tracks.length} треков`);
        displayTracks(tracks, 'catalog-grid');
    } catch (error) {
        console.error('Ошибка загрузки каталога:', error);
        container.innerHTML = `
            <div class="error">
                ❌ Ошибка загрузки треков: ${error.message}<br>
                Проверьте, работает ли API сервер.
            </div>
        `;
    }
}

// Загрузка жанров для фильтра
async function loadGenres() {
    try {
        const response = await authFetch(`${API_BASE}/genres/`);
        const genres = await response.json();
        const genreFilter = document.getElementById('genre-filter');

        if (genreFilter && genres.length > 0) {
            genreFilter.innerHTML = '<option value="">Все жанры</option>';
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.id;
                option.textContent = genre.name;
                genreFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки жанров:', error);
    }
}

// Фильтрация по жанру
async function filterByGenre() {
    const genreId = document.getElementById('genre-filter').value;

    if (!genreId) {
        loadCatalog();
        return;
    }

    try {
        const response = await authFetch(`${API_BASE}/tracks/genre/${genreId}`);
        const tracks = await response.json();
        displayTracks(tracks, 'catalog-grid');
    } catch (error) {
        console.error('Ошибка фильтрации:', error);
    }
}

// Поиск в каталоге
async function searchCatalog() {
    const query = document.getElementById('search-catalog').value;

    if (query.length < 2) {
        loadCatalog();
        return;
    }

    try {
        const response = await authFetch(`${API_BASE}/tracks/search/?query=${encodeURIComponent(query)}`);
        const tracks = await response.json();
        displayTracks(tracks, 'catalog-grid');
    } catch (error) {
        console.error('Ошибка поиска:', error);
    }
}

// Отображение треков
function displayTracks(tracks, containerId) {
    const container = document.getElementById(containerId);

    if (!tracks || tracks.length === 0) {
        container.innerHTML = '<div class="loading">Треки не найдены</div>';
        return;
    }

    container.innerHTML = tracks.map(track => `
        <div class="track-card">
            <div class="track-info">
                <h3>${track.title || 'Без названия'}</h3>
                <div class="track-meta">
                    <strong>Исполнитель:</strong> ${track.album?.artist?.name || 'Неизвестно'}<br>
                    <strong>Альбом:</strong> ${track.album?.title || 'Неизвестно'}<br>
                    <strong>Жанр:</strong> ${track.album?.genre?.name || 'Неизвестно'}<br>
                    <strong>Длительность:</strong> ${formatDuration(track.duration)}
                </div>
            </div>
            <div class="track-actions">
                <button class="btn btn-primary" onclick="addToPlaylistPrompt(${track.id}, '${track.title.replace(/'/g, "\\'")}')">
                    Добавить в плейлист
                </button>
            </div>
        </div>
    `).join('');
}

// ======================== ПЛЕЙЛИСТЫ ========================

// Загрузка плейлистов пользователя
async function loadPlaylists() {
    console.log("Загрузка плейлистов...");
    const container = document.getElementById('playlists-grid');
    if (!container) return;

    container.innerHTML = '<div class="loading">Загрузка плейлистов...</div>';

    try {
        const response = await authFetch(`${API_BASE}/users/playlists/`);
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error(`HTTP ошибка: ${response.status}`);
        }

        const playlists = await response.json();
        displayPlaylists(playlists);
    } catch (error) {
        console.error('Ошибка загрузки плейлистов:', error);
        container.innerHTML = `
            <div class="error">
                ❌ Ошибка загрузки плейлистов: ${error.message}<br>
                Попробуйте создать новый плейлист.
            </div>
        `;
    }
}

// Отображение плейлистов
function displayPlaylists(playlists) {
    const container = document.getElementById('playlists-grid');

    if (!playlists || playlists.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p>У вас пока нет плейлистов</p>
                <p>Создайте первый плейлист, используя форму выше</p>
            </div>
        `;
        return;
    }

    container.innerHTML = playlists.map(playlist => `
        <div class="playlist-card">
            <h3>${playlist.name}</h3>
            <p>${playlist.description || 'Без описания'}</p>
            <div class="track-meta">
                Треков: ${playlist.track_count || 0}<br>
                Создан: ${new Date(playlist.created_at).toLocaleDateString()}
            </div>
            <div class="track-actions">
                <button class="btn btn-primary" onclick="openPlaylistModal(${playlist.id}, '${playlist.name.replace(/'/g, "\\'")}')">
                    Управлять
                </button>
            </div>
        </div>
    `).join('');
}

// Обновление счетчика треков в конкретном плейлисте
function updatePlaylistTrackCount(playlistId, change) {
    const playlistCards = document.querySelectorAll('.playlist-card');
    playlistCards.forEach(card => {
        const button = card.querySelector('button[onclick*="openPlaylistModal"]');
        if (button && button.getAttribute('onclick').includes(`openPlaylistModal(${playlistId}`)) {
            const trackCountElement = card.querySelector('.track-meta');
            if (trackCountElement) {
                const currentText = trackCountElement.innerHTML;
                const match = currentText.match(/Треков:\s*(\d+)/);
                if (match) {
                    const currentCount = parseInt(match[1]);
                    const newCount = Math.max(0, currentCount + change);
                    trackCountElement.innerHTML = currentText.replace(
                        /Треков:\s*\d+/,
                        `Треков: ${newCount}`
                    );
                }
            }
        }
    });
}

// Создание плейлиста
async function createPlaylist() {
    const nameInput = document.getElementById('new-playlist-name');
    const name = nameInput.value.trim();

    if (!name) {
        alert('Введите название плейлиста');
        return;
    }

    try {
        const response = await authFetch(`${API_BASE}/users/playlists/`, {
            method: 'POST',
            body: JSON.stringify({
                name: name,
                description: 'Мой новый плейлист',
                is_public: false
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка создания плейлиста');
        }

        const newPlaylist = await response.json();
        console.log('Создан плейлист:', newPlaylist);

        nameInput.value = '';
        loadPlaylists();
        alert(`Плейлист "${name}" создан!`);

    } catch (error) {
        console.error('Ошибка создания плейлиста:', error);
        alert(`Ошибка создания плейлиста: ${error.message}`);
    }
}

// Открытие модального окна плейлиста
function openPlaylistModal(playlistId, playlistName) {
    currentPlaylistId = playlistId;
    document.getElementById('modal-playlist-name').textContent = playlistName;
    document.getElementById('playlist-modal').style.display = 'block';
    loadPlaylistTracks(playlistId);
    document.getElementById('search-track-to-add').value = '';
    document.getElementById('search-tracks-results-modal').innerHTML = '';
}

// Закрытие модального окна
function closePlaylistModal() {
    document.getElementById('playlist-modal').style.display = 'none';
    currentPlaylistId = null;
}

// Загрузка треков плейлиста
async function loadPlaylistTracks(playlistId) {
    try {
        const response = await authFetch(`${API_BASE}/playlists/${playlistId}/tracks/`);

        if (!response.ok) {
            if (response.status === 403) {
                alert('У вас нет доступа к этому плейлисту');
                closePlaylistModal();
                return;
            }
            throw new Error(`HTTP ошибка: ${response.status}`);
        }

        const tracks = await response.json();

        const container = document.getElementById('playlist-tracks-list');
        if (tracks.length === 0) {
            container.innerHTML = '<div class="loading">В плейлисте пока нет треков</div>';
            return;
        }

        container.innerHTML = tracks.map(track => `
            <div class="playlist-track-item">
                <span>${track.title} - ${track.album?.artist?.name || 'Неизвестно'}</span>
                <button class="btn btn-danger" onclick="removeFromPlaylist(${playlistId}, ${track.id})">
                    Удалить
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки треков плейлиста:', error);
        document.getElementById('playlist-tracks-list').innerHTML =
            '<div class="error">Ошибка загрузки треков плейлиста</div>';
    }
}

// Поиск треков для добавления в плейлист
async function searchTracksForPlaylist() {
    const query = document.getElementById('search-track-to-add').value;

    if (query.length < 2) {
        document.getElementById('search-tracks-results-modal').innerHTML = '';
        return;
    }

    try {
        const response = await authFetch(`${API_BASE}/tracks/search/?query=${encodeURIComponent(query)}`);
        const tracks = await response.json();

        const container = document.getElementById('search-tracks-results-modal');
        if (tracks.length === 0) {
            container.innerHTML = '<div class="loading">Треки не найдены</div>';
            return;
        }

        container.innerHTML = tracks.map(track => `
            <div class="playlist-track-item">
                <span>${track.title} - ${track.album?.artist?.name || 'Неизвестно'}</span>
                <button class="btn btn-success" onclick="addToPlaylist(${currentPlaylistId}, ${track.id})">
                    Добавить
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка поиска треков:', error);
    }
}

// Добавление трека в плейлист
async function addToPlaylist(playlistId, trackId) {
    try {
        const response = await authFetch(`${API_BASE}/playlists/${playlistId}/tracks/${trackId}`, {
            method: 'POST'
        });

        if (response.ok) {
            loadPlaylistTracks(playlistId);
            updatePlaylistTrackCount(playlistId, 1);

            document.getElementById('search-track-to-add').value = '';
            document.getElementById('search-tracks-results-modal').innerHTML = '';
            console.log(`Трек ${trackId} добавлен в плейлист ${playlistId}`);
        } else {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка добавления трека');
        }
    } catch (error) {
        console.error('Ошибка добавления трека:', error);
        alert(`Ошибка добавления трека: ${error.message}`);
    }
}

// Удаление трека из плейлиста
async function removeFromPlaylist(playlistId, trackId) {
    if (!confirm('Удалить этот трек из плейлиста?')) return;

    try {
        const response = await authFetch(`${API_BASE}/playlists/${playlistId}/tracks/${trackId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadPlaylistTracks(playlistId);
            updatePlaylistTrackCount(playlistId, -1);

            console.log(`Трек ${trackId} удален из плейлиста ${playlistId}`);
        } else {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка удаления трека');
        }
    } catch (error) {
        console.error('Ошибка удаления трека:', error);
        alert(`Ошибка удаления трека: ${error.message}`);
    }
}

// Быстрое добавление в плейлист
async function addToPlaylistPrompt(trackId, trackTitle) {
    try {
        // Получаем текущие плейлисты пользователя
        const playlistsResponse = await authFetch(`${API_BASE}/users/playlists/`);

        if (!playlistsResponse.ok) {
            throw new Error('Не удалось получить плейлисты');
        }

        let playlists = await playlistsResponse.json();

        // Если нет плейлистов, создаем один
        if (!playlists || playlists.length === 0) {
            const createResponse = await authFetch(`${API_BASE}/users/playlists/`, {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Мой первый плейлист',
                    description: 'Автоматически созданный плейлист',
                    is_public: false
                })
            });

            if (!createResponse.ok) {
                const error = await createResponse.json();
                throw new Error(error.detail || 'Ошибка создания плейлиста');
            }

            const newPlaylist = await createResponse.json();
            playlists = [{ id: newPlaylist.id, name: newPlaylist.name }];

            // Перезагружаем список плейлистов
            loadPlaylists();
        }

        // Добавляем в первый плейлист
        const playlistId = playlists[0].id;
        await addToPlaylist(playlistId, trackId);

        alert(`Трек "${trackTitle}" добавлен в плейлист "${playlists[0].name}"`);

    } catch (error) {
        console.error('Ошибка добавления в плейлист:', error);
        alert(`Не удалось добавить трек в плейлист: ${error.message}`);
    }
}

// ======================== РЕКОМЕНДАЦИИ ========================

// Загрузка рекомендаций
async function loadRecommendations() {
    console.log("Загрузка рекомендаций...");
    const container = document.getElementById('recommendations-grid');
    if (!container) return;

    container.innerHTML = '<div class="loading">Загрузка рекомендаций...</div>';
    const reasonElement = document.getElementById('recommendation-reason');
    if (reasonElement) reasonElement.textContent = '';

    try {
        const response = await authFetch(`${API_BASE}/recommendations/?limit=10`);
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error(`HTTP ошибка: ${response.status}`);
        }

        const data = await response.json();

        if (reasonElement) {
            reasonElement.textContent = data.reason || 'Рекомендации для вас';
        }

        displayTracks(data.tracks, 'recommendations-grid');
    } catch (error) {
        console.error('Ошибка загрузки рекомендаций:', error);
        container.innerHTML = `
            <div class="error">
                ❌ Ошибка загрузки рекомендаций: ${error.message}<br>
                Возможно, функция рекомендаций еще не реализована.
            </div>
        `;
    }
}

// ======================== ПОИСК ========================

// Переключение вкладок поиска
function openSearchTab(tabName) {
    console.log(`Открываем вкладку поиска: ${tabName}`);

    // Деактивировать все табы
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Деактивировать все контенты
    document.querySelectorAll('.search-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Активировать выбранный таб
    const activeButton = event?.target || document.querySelector(`.tab-button[onclick*="${tabName}"]`);
    if (activeButton) activeButton.classList.add('active');

    // Активировать контент
    const tabContent = document.getElementById(`search-${tabName}`);
    if (tabContent) tabContent.classList.add('active');

    // Очистить результаты предыдущего поиска
    clearSearchResults();
}

// Глобальный поиск
async function performGlobalSearch() {
    const query = document.getElementById('global-search').value;

    if (query.length < 2) {
        clearSearchResults();
        return;
    }

    // Определяем активную вкладку
    let activeTab = 'tracks';
    document.querySelectorAll('.tab-button').forEach(button => {
        if (button.classList.contains('active')) {
            const match = button.textContent.match(/треки|альбомы|исполнители/i);
            if (match) {
                const tabNames = { 'треки': 'tracks', 'альбомы': 'albums', 'исполнители': 'artists' };
                activeTab = tabNames[match[0].toLowerCase()] || 'tracks';
            }
        }
    });

    try {
        let endpoint, displayFunction, containerId;

        switch(activeTab) {
            case 'tracks':
                endpoint = `/tracks/search/?query=${encodeURIComponent(query)}`;
                displayFunction = displayTracks;
                containerId = 'search-tracks-results';
                break;
            case 'albums':
                endpoint = `/albums/search/?query=${encodeURIComponent(query)}`;
                displayFunction = displayAlbums;
                containerId = 'search-albums-results';
                break;
            case 'artists':
                endpoint = `/artists/search/?query=${encodeURIComponent(query)}`;
                displayFunction = displayArtists;
                containerId = 'search-artists-results';
                break;
        }

        const response = await authFetch(`${API_BASE}${endpoint}`);
        const results = await response.json();
        displayFunction(results, containerId);
    } catch (error) {
        console.error('Ошибка поиска:', error);
    }
}

// Очистка результатов поиска
function clearSearchResults() {
    document.querySelectorAll('.search-results').forEach(container => {
        container.innerHTML = '';
    });
}

// Отображение альбомов
function displayAlbums(albums, containerId) {
    const container = document.getElementById(containerId);

    if (!albums || albums.length === 0) {
        container.innerHTML = '<div class="loading">Альбомы не найдены</div>';
        return;
    }

    container.innerHTML = albums.map(album => `
        <div class="album-card">
            <h3>${album.title}</h3>
            <div class="track-meta">
                <strong>Исполнитель:</strong> ${album.artist?.name || 'Неизвестно'}<br>
                <strong>Год выпуска:</strong> ${album.release_year || 'Неизвестно'}<br>
                <strong>Жанр:</strong> ${album.genre?.name || 'Неизвестно'}
            </div>
        </div>
    `).join('');
}

// Отображение исполнителей
function displayArtists(artists, containerId) {
    const container = document.getElementById(containerId);

    if (!artists || artists.length === 0) {
        container.innerHTML = '<div class="loading">Исполнители не найдены</div>';
        return;
    }

    container.innerHTML = artists.map(artist => `
        <div class="artist-card">
            <h3>${artist.name}</h3>
            <div class="track-meta">
                <strong>Страна:</strong> ${artist.country || 'Неизвестно'}<br>
                <strong>Год основания:</strong> ${artist.formed_year || 'Неизвестно'}
            </div>
            ${artist.biography ? `<p>${artist.biography.substring(0, 100)}...</p>` : ''}
        </div>
    `).join('');
}

// ======================== АДМИНИСТРИРОВАНИЕ ========================

// Загрузка пользователей для админа
async function loadAdminUsers() {
    if (!currentUser || currentUser.role !== 'admin') {
        return;
    }

    const container = document.getElementById('users-list');
    if (!container) return;

    container.innerHTML = '<div class="loading">Загрузка пользователей...</div>';

    try {
        const response = await authFetch(`${API_BASE}/admin/users`);
        if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }

        const users = await response.json();
        displayAdminUsers(users);
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        container.innerHTML = `
            <div class="error">
                ❌ Ошибка загрузки пользователей: ${error.message}
            </div>
        `;
    }
}

// Отображение пользователей для админа
function displayAdminUsers(users) {
    const container = document.getElementById('users-list');

    if (!users || users.length === 0) {
        container.innerHTML = '<div class="loading">Пользователи не найдены</div>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-card ${user.role}">
            <h4>${user.username} <span style="font-size: 0.8em; color: #666;">(${user.email})</span></h4>
            <div class="track-meta">
                <strong>Роль:</strong> ${user.role === 'admin' ? 'Администратор' : 'Пользователь'}<br>
                <strong>Статус:</strong> ${user.is_active ? 'Активен' : 'Заблокирован'}<br>
                <strong>Зарегистрирован:</strong> ${new Date(user.created_at).toLocaleDateString()}
            </div>
            <div class="user-actions">
                <button class="btn btn-warning" onclick="toggleUserActive(${user.id})">
                    ${user.is_active ? 'Заблокировать' : 'Разблокировать'}
                </button>
            </div>
        </div>
    `).join('');
}

// Поиск пользователей для админа
async function searchUsers() {
    const query = document.getElementById('search-users').value.toLowerCase();

    if (!query) {
        loadAdminUsers();
        return;
    }

    // Фильтрация на клиенте для простоты
    const userCards = document.querySelectorAll('.user-card');
    userCards.forEach(card => {
        const username = card.querySelector('h4').textContent.toLowerCase();
        const email = card.querySelector('span')?.textContent.toLowerCase() || '';

        if (username.includes(query) || email.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Переключение статуса пользователя
async function toggleUserActive(userId) {
    if (!confirm('Изменить статус пользователя?')) return;

    try {
        const response = await authFetch(`${API_BASE}/admin/users/${userId}/toggle`, {
            method: 'POST'
        });

        if (response.ok) {
            loadAdminUsers();
        } else {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка изменения статуса');
        }
    } catch (error) {
        console.error('Ошибка изменения статуса пользователя:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

// ======================== ИНИЦИАЛИЗАЦИЯ ========================

// Инициализация при загрузке страницы
async function initializeApp() {
    console.log('🎵 Инициализация музыкального каталога...');

    // Проверяем авторизацию
    const isAuthenticated = await checkAuth();

    if (!isAuthenticated) {
        return;
    }

    // Проверяем подключение к API
    const isConnected = await checkApiConnection();

    if (isConnected) {
        // Обновляем навбар
        updateNavbar();

        // Показываем каталог по умолчанию
        showSection('catalog');
        console.log('✅ Фронтенд готов к работе!');
    } else {
        // Если API не доступен, показываем сообщение об ошибке
        showErrorMessage("API сервер не отвечает. Запустите бэкенд сервер в папке backend: python app/main.py");
    }

    // Назначаем обработчики событий
    setupEventListeners();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Закрытие модального окна при клике вне его
    window.onclick = function(event) {
        const modal = document.getElementById('playlist-modal');
        if (event.target === modal) {
            closePlaylistModal();
        }
    };

    // Закрытие модального окна по ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePlaylistModal();
        }
    });

    console.log('✅ Обработчики событий установлены');
}

// ======================== ЗАПУСК ПРИЛОЖЕНИЯ ========================

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен');
    initializeApp();
});

// Экспорт функций для использования в консоли браузера (отладка)
window.showSection = showSection;
window.loadCatalog = loadCatalog;
window.createPlaylist = createPlaylist;
window.openPlaylistModal = openPlaylistModal;
window.closePlaylistModal = closePlaylistModal;
window.addToPlaylist = addToPlaylist;
window.removeFromPlaylist = removeFromPlaylist;
window.addToPlaylistPrompt = addToPlaylistPrompt;
window.loadRecommendations = loadRecommendations;
window.performGlobalSearch = performGlobalSearch;
window.openSearchTab = openSearchTab;
window.logout = logout;

console.log('✅ script.js загружен');