# Novel frontend — first runnable prototype

Standalone Next.js App Router / TypeScript frontend for Laravel Novel Platform API.

## Run

1. Start backend at `http://localhost:8080/api/v1`.
2. `cp .env.example .env.local`
3. `npm install && npm run dev`
4. Open `http://localhost:3000`.

## Included

- Landing page, login/register, author's work list, create work, work/chapter workspace, draft save with CAS, publish/unpublish, public reader.
- Server-side same-origin API gateway at `/api/[...path]`; backend bearer token held in HttpOnly cookie, not exposed to browser JS.
- Contract copy: `contracts/openapi.yaml`.

## Prototype limitations / next steps

- Editor is deliberately a **plain-text proof of concept**, not Tiptap. It converts each line to a ProseMirror paragraph; editing existing rich content **loses formatting**. Do not use it for production writing. Next milestone: Tiptap matching the exact backend allow-list, debounce autosave, dirty state and conflict resolution.
- Reader renderer covers basic blocks, not all marks and nodes.
- Authentication needs production hardening: CSRF protection for BFF mutating requests, server-side session lifecycle, cookie expiry coordination, logout UX, error handling. The cookie is currently a bearer token; protect deployment accordingly.
- Works list uses first page only; volume creation/reorder, revisions, account settings and publication status per chapter are not yet fully surfaced.
- No Catalog API exists yet; public reading is via known UUID.
- No dependencies installed or runtime build verified in this offline artifact environment.

## v0.4: редактор

Tiptap (ProseMirror JSON) с форматированием, автосохранением по CAS `version` и блокировкой записи при HTTP 409. При конфликте скопируйте локальный текст перед загрузкой серверной версии. Публикация главы отключена до успешного сохранения. Переключение глав предупреждает о несохранённых изменениях.

Пока не реализованы управление томами через UI, восстановление ревизий и офлайн-черновики. Публикация может вернуть 409 при параллельном изменении на сервере.

## v0.6 — студия автора

- Создание, переименование и удаление томов; удаление тома оставляет главы без тома.
- Создание, переименование, удаление и перемещение глав.
- Изменение порядка томов и глав кнопками вверх/вниз через API `/order` (без drag-and-drop).
- Публикация произведения и выбранной главы, индикация состояний.
- История ревизий: список, ручное создание снимка, восстановление с CAS.
- Защита от случайного переключения главы при несохранённых изменениях.

Примечание: `409` при удалении глав с редакторскими или публикационными данными — ожидаемое ограничение backend. Сборка в этой среде не выполнялась, проверьте `npm install && npm run typecheck && npm run build` локально.


## v0.7 — студия автора

- Настройки произведения: название, slug, описание, статус. Сохраняются через PATCH /works/{work}.
- Drag-and-drop: перетаскивайте том на том для изменения порядка; главу на главу для изменения порядка/переноса, главу на заголовок тома или «Без тома» для перемещения. Используется нативный HTML Drag and Drop API (мышь/тачпад). На сенсорных устройствах остаются кнопки порядка и переноса.
- На узких экранах структура скрывается за кнопкой «Тома и главы».
- Перед перемещением главы между томами редактор предупреждает о несохранённых изменениях.

## v0.8 — читательская часть
- `/read/{workId}` — публичная карточка произведения и оглавление из опубликованных глав.
- `/read/{workId}?chapter={chapterId}` — отдельная глава, навигация по главам, темы/типографика с сохранением в localStorage.
- Отображение ProseMirror JSON с базовыми marks, заголовками, списками, цитатами и ссылками.
- Главная принимает UUID произведения или ссылку `/read/{uuid}`.
- Полноценного каталога/поиска пока нет: в текущем API отсутствует публичный список произведений. Нужен отдельный backend endpoint.


## v0.9: каталог и изображения

- `/catalog` — публичный каталог с поиском, фильтрами, сортировкой и пагинацией.
- Настройки произведения — загрузка, замена и удаление обложки.
- Редактор — вставка иллюстраций кнопкой, через clipboard и drop, с хранением `mediaId` в документе.
- Читалка — изображения из публичного `media` map.
- BFF — поддержка multipart и image binary response.

Требуется Media/Catalog API по `contracts/openapi.yaml`. Установите зависимости (`npm install`) и запустите (`npm run dev`).
Проверка сборки в текущем окружении не завершена: установка npm-зависимостей превысила лимит времени.

### v0.9.4 — публичная обложка и обновление публикации
- На странице `/read/[id]` обложка пробует публичный thumbnail (как каталог), затем оригинал; при ошибке отображает заглушку.
- У опубликованной главы появилась кнопка «Обновить публикацию»; перед запросом `POST /chapters/{id}/publish` она принудительно сохраняет черновик. «Снять с публикации» оставлено отдельной кнопкой с подтверждением.
- Индикатор локальных неопубликованных изменений показывается после редактирования; после повторного открытия страницы сравнение с опубликованной версией сервером пока не предоставляется.


### v0.9.5 — Обложки в «Моих произведениях»
Карточки `/dashboard` показывают `cover_thumb_url` (резервно `cover_url`) через `mediaUrl()`, сохраняя подпись URL. Если обложки нет или загрузка завершилась ошибкой, остаётся прежняя текстовая заглушка.

## Docker Compose (production)

Requirements: Docker Engine and Docker Compose plugin. The Docker image builds the Next.js app, then starts `next start` on port 3000. Backend is **not** included.

```bash
cp .env.example .env
# Edit .env: BACKEND_API_URL must be reachable from the frontend container
# For a backend in a different Compose project, connect both to a shared Docker network
# and use its Docker DNS service name.
docker compose up -d --build
docker compose logs -f frontend
```

By default, the site is bound only to `127.0.0.1:3000` on the server. Put Nginx/Caddy in front of it for public HTTPS access. Example Nginx server block:

```nginx
server {
    listen 80;
    server_name example.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Configure HTTPS separately with your existing Nginx/Certbot setup. Do not expose the Next.js port publicly if using a reverse proxy.

**Backend connectivity:** `localhost` in `BACKEND_API_URL` refers to the *frontend container*, not the server. If the backend is running on the Linux host and listening on a reachable interface, add to the `frontend` service in `compose.yaml`:

```yaml
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

Then set `BACKEND_API_URL=http://host.docker.internal:8080/api/v1`. If the backend port is only bound to `127.0.0.1` on the host, this will not work; use a shared Docker network or another reachable backend endpoint. The BFF proxies `/api/*` to the backend and keeps auth tokens in HttpOnly cookies. `BACKEND_API_URL` is read server-side at runtime.

Update: `docker compose up -d --build`. Logs: `docker compose logs --tail=100 frontend`. Stop: `docker compose down`.

Note: production build requires npm registry access for `npm ci`; full Docker build has not been verified in this environment.
