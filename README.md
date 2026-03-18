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

**Dependencies:** `pg`, `express`, `drizzle-orm`, `tsx`, `vitest`, `drizzle-kit` (see [.nvmrc](.nvmrc) for Node version).

Configure environment variables (in `.env` — do not commit):

| Variable      | Purpose                      |
| ------------- | ---------------------------- |
| `DATABASE_URL`| PostgreSQL connection string |
| `API_KEY`     | API key for protected routes |
| `PORT`        | HTTP server port             |

## 🚀 Quick Start

Build and run:

```bash
npm run build
npm start
```

The server runs migrations at startup, then listens on `http://localhost:{PORT}`. Health at `GET /api/healthz`.

## 🚀 Quick Start — API Usage

API endpoints will be available once the base phase is complete. See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the roadmap.

## Tech Stack

| Layer     | Tech        |
| --------- | ----------- |
| Runtime   | Node.js     |
| Language  | TypeScript  |
| Framework | Express.js  |
| Database  | PostgreSQL  |
| ORM       | Drizzle     |
| Auth      | JWT, Argon2 |

## Scripts

```bash
npm run build       # Compile TypeScript
npm start           # Run production server
npm run dev         # Build and run
npm run test        # Run Vitest
npm run db.generate # Generate migrations
npm run db.migrate  # Apply migrations
```

## Documentation

- [Project overview](docs/PROJECT_DESC.md) — Architecture, workspace map
- [API reference](docs/API.md) — Full endpoint docs with schemas

## 👏 Contributing

Contributions are welcome! Fork the repo, open a pull request, and ensure tests pass (`npm run test`). Submit PRs to the `main` branch.

---

**Last Updated:** Phase 1 — Dependencies installed (`pg`, `tsx`), TypeScript configured (ES2022, NodeNext). See [personal/PR.md](personal/PR.md) for recent PR details.
