# UnboundAI

🤖 Полнофункциональный AI ассистент с поддержкой безопасного и свободного режимов, управлением сессиями и видением изображений.

## 🚀 Живой demo

👉 **[Открыть приложение →](https://labyv2004.github.io/unboundai/)**

## 📋 Требования

- Node.js ≥ 18
- pnpm ≥ 10
- PostgreSQL ≥ 12 (для полного функционала)

## ⚡ Быстрый старт

```bash
# 1. Установить зависимости
pnpm install

# 2. Создать .env файл
cp .env.example .env

# 3. Настроить базу данных (см. SETUP.md)

# 4. Запустить проект
pnpm -r --filter @workspace/unbound-ai run dev
pnpm -r --filter @workspace/api-server run dev  # в другом терминале
```

Откройте http://localhost:5173/

## 📚 Документация

- [Полная инструкция по запуску](./SETUP.md)
- [GitHub Pages Deployment](#-github-pages-deployment)

## 🏗️ Архитектура

Это монорепозиторий (pnpm workspaces) с 3 основными приложениями:

```
📦 unboundai
├── 🖥️  artifacts/api-server/      - Express.js API
├── 🎨 artifacts/unbound-ai/       - React фронтенд  
├── 🧩 artifacts/mockup-sandbox/   - UI компоненты
├── 📦 lib/db/                     - Drizzle ORM + PostgreSQL
├── 📦 lib/api-client-react/       - React Query хуки
└── 📦 lib/api-zod/                - API типы (Zod)
```

## 🌐 GitHub Pages Deployment

### Как это работает

1. **Автоматический деплой** - при push в `main` ветку
2. **Сборка** - `pnpm build` собирает фронтенд
3. **Деплой** - загружается на GitHub Pages
4. **Результат** - https://labyv2004.github.io/unboundai/

### Статус деплоя

[![Build and Deploy](https://github.com/labyv2004/unboundai/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/labyv2004/unboundai/actions/workflows/deploy-pages.yml)

### Как включить

1. Перейдите в **Settings → Pages**
2. Source: выберите **Deploy from a branch**
3. Branch: выберите **gh-pages** (создастся автоматически при первом деплое)
4. Нажмите **Save**

### Тестирование локально

```bash
# Собрать как для GitHub Pages
GITHUB_PAGES=true pnpm build

# Проверить собранные файлы
ls artifacts/unbound-ai/dist/public/
```

## 🛠️ Команды

```bash
# Разработка
pnpm dev                    # Запустить все dev серверы
pnpm typecheck             # Проверить типы TypeScript
pnpm build                 # Собрать for production
pnpm -r run build          # Собрать все packages

# API Server
cd artifacts/api-server && pnpm dev

# Frontend
cd artifacts/unbound-ai && pnpm dev

# UI Library
cd artifacts/mockup-sandbox && pnpm dev
```

## 📝 Переменные окружения

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/unboundai

# Server
PORT=3000
NODE_ENV=development

# Frontend
BASE_PATH=/                    # или /unboundai/ для GitHub Pages
BASE_URL=http://localhost:3000

# AI APIs (опционально)
OPENROUTER_API_KEY=sk-...
HF_TOKEN=hf_...
```

## 🎯 Особенности

- ✅ **Two-Mode System** - Unbound (без ограничений) и Bound (безопасный)
- ✅ **Vision Capabilities** - анализ изображений и видео
- ✅ **Persistent Memory** - сохранение воспоминаний между сессиями
- ✅ **Session Management** - управление несколькими чатами
- ✅ **Type Safety** - полная типизация TypeScript
- ✅ **Modern Stack** - React 19, Vite, TailwindCSS 4
- ✅ **GitHub Pages** - одноклик деплой фронтенда

## 🔗 Stack

**Frontend:**
- React 19 + TypeScript
- Vite 7 (быстрая сборка)
- TailwindCSS 4 (стили)
- React Query (состояние)
- Wouter (маршрутизация)
- Radix UI (компоненты)

**Backend:**
- Node.js + Express 5
- TypeScript
- Drizzle ORM (типобезопасная БД)
- PostgreSQL
- JWT Auth

## 📦 Production Deploy

### Frontend (GitHub Pages)
```bash
# Автоматически при push в main
# Или вручную:
GITHUB_PAGES=true pnpm build
git push
```

### Backend (требует отдельного хостинга)
- Railway
- Render
- Heroku
- DigitalOcean
- AWS

## 🐛 Решение проблем

| Проблема | Решение |
|----------|--------|
| DATABASE_URL error | Проверьте .env файл и PostgreSQL соединение |
| Port 5173 занят | `PORT=3000 pnpm dev` |
| GitHub Pages не обновляется | Проверьте Actions и gh-pages ветку |
| Build fails | Запустите `pnpm install` и `pnpm build` локально |

## 📄 Лицензия

MIT

## 🤝 Контрибьютинг

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing`)
5. Откройте Pull Request

---

**Готово к использованию! 🎉**

Откройте https://labyv2004.github.io/unboundai/ чтобы начать.