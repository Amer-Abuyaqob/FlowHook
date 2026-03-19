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

The API server is a placeholder; Express routes and health endpoint are coming next. Tests run with `npm test` (integration tests run when `DATABASE_URL` is set; otherwise skipped).

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

**Last Updated:** CI/CD and Phase 1 tooling — added Cloud Run CD workflow, split CI into tests + style checks, and introduced Prettier + ESLint + Vitest coverage scripts. See [personal/PR.md](personal/PR.md) for recent PR details.
