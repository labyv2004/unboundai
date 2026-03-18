# 🚀 UnboundAI - Запуск и развертывание

## Структура проекта

Это монорепозиторий (pnpm workspaces) из 3 основных компонентов:

```
├── artifacts/
│   ├── api-server/         - Express.js API (порт 3000)
│   ├── unbound-ai/         - React фронтенд (порт 5173)
│   └── mockup-sandbox/     - UI компоненты (порт 5173)
├── lib/
│   ├── db/                 - Drizzle ORM + PostgreSQL
│   ├── api-client-react/   - React Query хуки
│   └── api-zod/            - API типы (Zod)
└── scripts/                - Утилиты
```

## Требования

- **Node.js** ≥ 18
- **pnpm** ≥ 10
- **PostgreSQL** ≥ 12 (для полного функционала)

## Быстрый старт (локальная разработка)

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Конфигурация базы данных PostgreSQL

#### Вариант A: Использовать локальный PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql
sudo systemctl start postgresql

# Windows - скачайте с https://www.postgresql.org/download/windows/
```

Создайте БД и пользователя:

```bash
psql postgres
CREATE DATABASE unboundai;
CREATE USER unbounduser WITH PASSWORD 'password123';
ALTER ROLE unbounduser WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE unboundai TO unbounduser;
\q
```

#### Вариант B: Использовать Docker

```bash
docker run --name unboundai-db -e POSTGRES_PASSWORD=password123 \\
  -e POSTGRES_DB=unboundai -e POSTGRES_USER=unbounduser \\
  -p 5432:5432 -d postgres:15
```

### 3. Создайте .env файл

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
DATABASE_URL=postgresql://unbounduser:password123@localhost:5432/unboundai
PORT=3000
NODE_ENV=development
```

### 4. Инициализируйте БД

```bash
cd lib/db
pnpm drizzle-kit push
cd ../..
```

### 5. Запустите проект

#### Вариант A: Все приложения вместе

```bash
# Терминал 1 - API сервер
pnpm -r --filter @workspace/api-server run dev

# Терминал 2 - Фронтенд
pnpm -r --filter @workspace/unbound-ai run dev
```

#### Вариант B: Отдельные приложения

```bash
# API сервер
cd artifacts/api-server
pnpm dev

# Фронтенд (новый терминал)
cd artifacts/unbound-ai
pnpm dev
```

### 6. Откройте приложение

```bash
# Основное приложение:
http://localhost:5173

# UI Компоненты:
http://localhost:5173 (mockup-sandbox)
```

## Сборка для production

### Собрать все приложения

```bash
pnpm build
```

### Выходные файлы

```
artifacts/
├── api-server/dist/index.mjs       - Собранный API сервер
├── unbound-ai/dist/public/         - Собранный React фронтенд
└── mockup-sandbox/dist/            - Собранные UI компоненты
```

### Развертывание API сервера

```bash
# Установить production зависимости
NODE_ENV=production pnpm install --frozen-lockfile

# Запустить server
cd artifacts/api-server
NODE_ENV=production DATABASE_URL=<postgresql://...> PORT=3000 node dist/index.mjs
```

### Развертывание фронтенда

```bash
# Статические файлы находятся в artifacts/unbound-ai/dist/public/
# Залейте на любой CDN или веб-сервер (nginx, Vercel, Netlify и т.д.)
```

## Переменные окружения

### API Server

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname  # PostgreSQL (обязательно)
PORT=3000                                              # Порт сервера
NODE_ENV=development|production                        # Режим
OPENROUTER_API_KEY=sk-...                             # OpenRouter API (опционально)
HF_TOKEN=hf_...                                        # HuggingFace токен (опционально)
JWT_SECRET=your-secret-key                            # JWT ключ (по умолчанию есть)
```

### Фронтенд

```env
BASE_URL=http://localhost:3000  # API базовый URL
BASE_PATH=/                     # Путь для сборки (для subpath deployment)
```

## Архитектура

### API Endpoints

```
POST   /api/auth/register              - Регистрация
POST   /api/auth/login                 - Вход
GET    /api/auth/me                    - Текущий пользователь
POST   /api/auth/logout                - Выход

GET    /api/sessions                   - Список сессий
POST   /api/sessions                   - Создать сессию
GET    /api/sessions/:id               - Получить сессию
PATCH  /api/sessions/:id               - Обновить название
DELETE /api/sessions/:id               - Удалить сессию

POST   /api/sessions/:id/messages      - Отправить сообщение
GET    /api/sessions/:id/messages      - Получить сообщения

GET    /api/memories                   - Список воспоминаний
POST   /api/memories                   - Добавить воспоминание
PATCH  /api/memories/:id               - Обновить воспоминание
DELETE /api/memories/:id               - Удалить воспоминание

GET    /api/health                     - Health check
```

### Stack

**Backend:**
- Express.js 5
- Drizzle ORM
- PostgreSQL
- JWT Auth
- TypeScript

**Frontend:**
- React 19
- Vite 7
- TailwindCSS 4
- React Query
- Wouter (routing)
- Radix UI

## Решение проблем

### "DATABASE_URL must be set"

```bash
# Убедитесь что .env файл создан и содержит DATABASE_URL
echo $DATABASE_URL

# Или установите переменную
export DATABASE_URL=postgresql://user:pass@localhost/unboundai
```

### PostgreSQL не подключается

```bash
# Проверьте статус
psql -U unbounduser -d unboundai

# Проверьте строку подключения в .env
DATABASE_URL=postgresql://unbounduser:password@localhost:5432/unboundai
```

### API порт занят

```bash
# Используйте другой порт
PORT=3001 pnpm -r --filter @workspace/api-server run dev
```

### Вайтлист хостов для Vite

Если вы видите CORS ошибки, убедитесь что `--host 0.0.0.0` передан в vite dev команде.

## Дебаг

### Включить verbose логирование

```bash
DEBUG=* pnpm dev
```

### Проверить типизацию

```bash
pnpm typecheck
```

### Проверить сборку

```bash
pnpm build
```

## Поддержка

- [GitHub Issues](https://github.com/labyv2004/unboundai/issues)
- [Документация Drizzle](https://orm.drizzle.team)
- [Документация Express](https://expressjs.com)

---

**Проект успешно исправлен! ✅**

Все ошибки типизации устранены, проект собран и готов к запуску.
