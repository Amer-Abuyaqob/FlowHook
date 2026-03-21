# FlowHook

A webhook-driven task processing pipeline built in TypeScript with Express.js. RESTful APIs for pipelines, subscribers, webhook ingestion, and job processing. Give it a star if you find it useful ⭐

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the implementation plan.

## Motivation

FlowHook is a webhook ingestion and processing pipeline. It receives webhooks, runs configurable actions (transform, filter, template), and delivers results to subscribers.

### Goal

- RESTful JSON API for pipelines and subscribers
- Webhook ingestion with slug-based routing
- Action pipeline (transform, filter, template)
- PostgreSQL with Drizzle ORM
- JWT/API key auth for protected routes

## ⚙️ Installation

Prerequisites: Node.js (see [.nvmrc](.nvmrc)), PostgreSQL.

```bash
git clone https://github.com/Amer-Abuyaqob/FlowHook.git
cd FlowHook
npm install
```

**Dependencies:** `pg`, `express`, `drizzle-orm`, `dotenv`, `tsx`, `vitest`, `drizzle-kit` (see [.nvmrc](.nvmrc) for Node version).

Configure environment variables (in `.env` — do not commit). Copy from `.env.example` if available:

| Variable       | Purpose                                 |
| -------------- | --------------------------------------- |
| `API_KEY`      | API key for protected routes (required) |
| `DATABASE_URL` | PostgreSQL connection string (optional) |
| `PORT`         | HTTP server port (default 3000)         |

## 🚀 Quick Start

1. Set `API_KEY` in `.env` (required). Set `DATABASE_URL` for DB features (optional).
2. Run migrations (if using DB) and build:

```bash
npm run db:migrate   # Only when DATABASE_URL is set
npm run build
npm start
```

The server exposes a **health check** at **`GET /api/healthz`** (plain text **`OK`**, UTF-8). **`GET /`** redirects to **`/app/`**, which serves a **README-aligned** static page (HTML + **`styles.css`**, **dark theme**) from **`src/app`** (copied to **`dist/client`** on build). **API key auth** (Bearer or X-API-Key) and **central error middleware** are implemented; auth will be applied to pipeline/job routes when those are added. Tests run with `npm test` (DB integration tests may run when `DATABASE_URL` is set).

## 🚀 Quick Start — API Usage

| Method | Path           | Description                |
| ------ | -------------- | -------------------------- |
| `GET`  | `/`            | Redirects to `/app/` (302) |
| `GET`  | `/app/`        | Static web UI (HTML)       |
| `GET`  | `/api/healthz` | Liveness (text OK)         |

Examples:

```bash
curl http://localhost:8080/api/healthz
curl -sI http://localhost:8080/
curl http://localhost:8080/app/
```

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the full roadmap.

## Tech Stack

| Layer     | Tech                                             |
| --------- | ------------------------------------------------ |
| Runtime   | Node.js                                          |
| Language  | TypeScript                                       |
| Framework | Express.js                                       |
| Database  | PostgreSQL                                       |
| ORM       | Drizzle                                          |
| Auth      | API key (Bearer, X-API-Key) — JWT/Argon2 planned |

## Scripts

```bash
npm run build       # Compile TypeScript and copy src/app → dist/client
npm start           # Run production server
npm run dev         # Build and run
npm run test        # Run Vitest
npm run lint        # Run ESLint
npm run format:check # Check formatting with Prettier
npm run test:coverage # Run tests with coverage
npm run db.generate # Generate migrations
npm run db.migrate  # Apply migrations
```

## Documentation

- [Project overview](docs/PROJECT_DESC.md) — Architecture, workspace map
- [API reference](docs/API.md) — Full endpoint docs with schemas

## 👏 Contributing

Contributions are welcome! Fork the repo, open a pull request, and ensure tests pass (`npm run test`). Submit PRs to the `main` branch.

---

**Last Updated:** Phase 1.5 auth middleware done. API key validation (Bearer, X-API-Key), `authMiddleware`, and central `errorMiddleware` for JSON error responses. `req.identity` typed via Express augmentation. Auth not yet mounted on routes. See [personal/PR.md](personal/PR.md) for PR notes.
