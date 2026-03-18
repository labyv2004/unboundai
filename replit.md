# Workspace — Unbound AI

## Project
BIOS/console-aesthetic AI chat app with dual AI modes (Unbound / Bound), persistent memory, markdown rendering, MCP config, session context, file upload, JWT auth, and full BIOS boot animation.

**Live at**: unboundai.replit.app

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── unbound-ai/         # Unbound AI frontend (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/unbound-ai` (`@workspace/unbound-ai`)

Unbound AI — a BIOS/console-style AI chat interface. React + Vite frontend with full authentication, multi-session chat, file upload, and system status.

- Pure black background with cyan/blue BIOS aesthetic
- CRT scanlines, glow effects, blinking cursor animations
- Boot sequence animation on page load
- Auth: login/register with JWT tokens (stored in localStorage)
- Chat: terminal-style conversation interface with typewriter effect for AI responses
- File upload: drag & drop zone supporting IMG, TXT, JSON, VIDEO
- Sessions log: table of previous chat sessions
- System status: shows AI model routing architecture

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: 
  - `src/routes/health.ts` — `GET /api/healthz`
  - `src/routes/auth.ts` — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
  - `src/routes/sessions.ts` — CRUD for chat sessions
  - `src/routes/messages.ts` — send messages, calls OpenRouter API
- Auth: JWT-based (bcryptjs for hashing, jsonwebtoken for tokens)
- AI: Calls OpenRouter API — set `OPENROUTER_API_KEY` env var to enable real AI

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/users.ts` — users table
- `src/schema/sessions.ts` — chat sessions
- `src/schema/messages.ts` — messages with role, content, model

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec covering auth, sessions, messages, and health check endpoints.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `OPENROUTER_API_KEY` — API key for OpenRouter (AI responses). Without this, runs in demo mode.
- `JWT_SECRET` — Secret for JWT signing (defaults to a dev secret if not set)

## AI Model Routing

The system routes requests through the following model pipeline:
1. **Input Layer**: stepfun/step-3.5-flash:free
2. **Central Layer**: arcee-ai/trinity-large-preview:free
3. **Optional Layers**: nvidia/nemotron-3-super-120b, z-ai/glm-4.5-air, nvidia/nemotron-3-nano-30b
4. **Vision Layer**: nvidia/nemotron-nano-12b-v2-vl (for image uploads)
5. **Output Layer**: cognitivecomputations/dolphin-mistral-24b-venice-edition:free (Uncensored)
