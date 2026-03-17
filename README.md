# Chirpy

A Twitter-like microblogging API built in TypeScript with Express.js. RESTful JSON APIs for users, chirps (short messages), JWT auth, and Chirpy Red membership. Give it a star if you find it useful ⭐

Built for the [Boot.dev Learn HTTP Servers in TypeScript](https://www.boot.dev/courses/learn-http-servers-typescript) course. [Certificate of completion](https://www.boot.dev/certificates/6baf2153-cdca-498e-9358-55e45ff9a930).

## Motivation

Learning to build HTTP servers often means piecing together routing, JSON, auth, and databases from scattered tutorials. Chirpy is a complete reference implementation that covers the full stack: static files, REST APIs, JWT + refresh tokens, PostgreSQL with Drizzle, and webhooks.

### Goal

The goal with Chirpy is to demonstrate production-style patterns in a learning-friendly codebase. In particular:

- RESTful JSON API with clear request/response contracts
- JWT access tokens (1h) + refresh token rotation (60 days)
- Argon2 password hashing
- Author-only authorization (e.g. delete your own chirps)
- Polka webhook integration for Chirpy Red membership
- Error handling and middleware conventions

## ⚙️ Installation

Prerequisites: Node.js (see [.nvmrc](.nvmrc)), PostgreSQL.

```bash
git clone https://github.com/Amer-Abuyaqob/Chirpy.git
cd Chirpy
npm install
```

Configure environment variables (in `.env` — do not commit):

| Variable     | Purpose                                      |
| ------------ | -------------------------------------------- |
| `DB_URL`     | PostgreSQL connection string                 |
| `JWT_SECRET` | JWT signing (e.g. `openssl rand -base64 64`) |
| `POLKA_KEY`  | API key for Polka webhooks                   |
| `PORT`       | HTTP server port                             |
| `PLATFORM`   | Set to `dev` for local reset                 |

## 🚀 Quick Start

Build and run:

```bash
npm run build
npm start
```

The server runs migrations at startup, then listens on `http://localhost:{PORT}`. Static app at `/app`, health at `GET /api/healthz`.

## 🚀 Quick Start — API Usage

**1. Register a user**

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

**2. Login (returns JWT + refresh token)**

```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

**3. Create a chirp** (use the `token` from login)

```bash
curl -X POST http://localhost:8080/api/chirps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -d '{"body":"Hello, Chirpy!"}'
```

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
