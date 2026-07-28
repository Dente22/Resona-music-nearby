# Resona — музыкальный плеер с боковой панелью

Десктопное приложение для Windows: **Resona** выезжает с края экрана по горячей клавише или клику в трее.

## Возможности

- **Одна кнопка** — `F9` / хоткей или иконка в системном трее
- **Боковая панель** — выезжает слева или справа (настраивается)
- **Офлайн** — локальные MP3, WAV, FLAC, OGG, M4A, AAC
- **Библиотека** — добавление, поиск, удаление треков
- **Плейлисты** — создание и удаление
- **Интернет** — Spotify / Яндекс.Музыка встроенным браузером
- **Настройки** — hotkey, сторона панели, громкость

## Запуск

```bash
npm install
npm run electron:dev
```

Или `run-app.bat`.

## Данные (отдельно от фронтенда)

Все пользовательские данные **не хранятся в `src/` / frontend** и **не коммитятся**:

| Режим | Корень данных |
|-------|----------------|
| `electron:dev` | `userdata/` в корне проекта |
| Установленное приложение | `%AppData%/Resona/` |

Структура:

```
userdata/   (или AppData/Resona)
  data/     library.json, playlists.json, settings.json,
            streaming-library.json, embed-playback.json, streaming-auth.json
  music/    локальные файлы
  covers/   обложки
  app.log
```

Между корнями данные **не переносятся** автоматически.

## Папка для репозитория

`uploads/` — сюда кладите файлы, которые нужно залить в git (см. `uploads/README.md`).

## Тесты (TDD)

```bash
npm test
npm run test:coverage
```

## Скачать установщик

Готовые сборки: [Releases](https://github.com/Dente22/Resona-music-nearby/releases)  
Файл: `Resona-Setup-x.y.z.exe` (мастер установки NSIS, русский/английский).

## Сборка

```bash
npm run electron:build
```

Артефакт: `release/Resona-Setup-<version>.exe`.

## Структура

```
src/lib/       — бизнес-логика
electron/      — main process, IPC, BrowserView
src/app/       — React UI
userdata/      — локальные данные (gitignore)
uploads/       — файлы для репозитория
tests/         — unit-тесты
```
