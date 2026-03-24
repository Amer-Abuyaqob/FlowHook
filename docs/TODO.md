# FlowHook — Full TODO Tree

Deeply detailed step-by-step checklist. Work top-to-bottom within each phase. Check off items as you complete them.

**Status:** Phase 1 partially complete. Project init, config, DB schema, basic health, auth middleware, error middleware, Docker, CI/CD, pipeline APIs, subscriber routes, and webhook ingestion are done. Worker processing and subscriber delivery are pending.

---

## PreRequirements

Complete these before creating the FlowHook project. They set up your machine and tools.

**Environment:** Ubuntu via WSL (Windows Subsystem for Linux). Commands below are for Ubuntu/WSL.

### Node.js

- [x] **Choose Node version**
  - [x] Use Node 24 LTS (Krypton) — Active LTS, recommended for production
- [x] **`.nvmrc`:** The project uses `.nvmrc` with `24`. Run `nvm use` when entering the project.
- [x] **Install Node.js on Ubuntu/WSL**
- [x] **Verify:** `node -v` and `npm -v`

### PostgreSQL

- [x] **Choose Postgres version**
  - [x] Postgres 14+ (16 recommended)
- [x] **Install PostgreSQL on Ubuntu/WSL**
  - [x] **Local apt:** `sudo apt update && sudo apt install -y postgresql postgresql-contrib` then `sudo service postgresql start`
- [x] **Verify:** `psql -U postgres -c "SELECT 1"` (or `sudo -u postgres psql -c "SELECT 1"` for local install)

### Git

- [x] **Install Git on Ubuntu/WSL:** `sudo apt update && sudo apt install -y git`
- [x] **Verify:** `git --version`

### Docker (optional but recommended)

- [x] **Install Docker on Ubuntu/WSL**
  - [x] **Option A:** [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) with WSL 2 backend
- [x] **Verify:** `docker --version` and `docker compose version`

### GitHub Actions Node deprecation

- [x] **Note:** GitHub Actions deprecates Node 20 on runners (June 2026). Add `env: FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` to your CI workflow to silence the warning and future-proof.

### Project dependencies (installed in Phase 1)

These are installed via `npm install` when you create the project — no global install needed. **Recommended versions for Node 24 LTS:**

| Package     | Version | Notes                                     |
| ----------- | ------- | ----------------------------------------- |
| drizzle-orm | ^0.45.0 | ORM; Node 24 compatible                   |
| drizzle-kit | ^0.31.0 | Migrations CLI                            |
| pg          | ^8.13.0 | PostgreSQL driver                         |
| express     | ^5.2.0  | Web framework; v5 requires Node 18+       |
| vitest      | ^4.1.0  | Test framework; peer deps support Node 24 |
| typescript  | ^5.7.0  | TypeScript compiler                       |
| tsx         | ^4.19.0 | TypeScript execution for dev              |

---

## Pre-Start (Before Phase 1)

- [x] **Create FlowHook workspace/repo**
  - [x] Create new folder or clone empty repo
  - [x] Initialize git: `git init`
  - [x] Add `.gitignore` (node_modules, dist, .env, etc.)
- [x] **Verify PreRequirements**
  - [x] Node, Postgres, Git (and Docker if using) are installed and working

---

## Phase 1: Base (on `main`)

### 1.1 Project Init

- [x] **Initialize Node project**
  - [x] Run `npm init -y`
  - [x] Set `"name": "flowhook"` in package.json
  - [x] Add `"type": "module"` if using ESM
  - [x] Create `.nvmrc` with `24` (run `nvm use` to switch to Node 24 LTS)
- [x] **Install dependencies** (versions for Node 24 LTS)
  - [x] `npm install express@^5.2.0 drizzle-orm@^0.45.0 pg@^8.13.0`
  - [x] `npm install -D typescript@^5.7.0 @types/node@^24 @types/express tsx@^4.19.0 drizzle-kit@^0.31.0 vitest@^4.1.0`
- [x] **Configure TypeScript**
  - [x] Create `tsconfig.json` with `target: "ES2022"`, `module: "NodeNext"`, `outDir: "dist"`
  - [x] Add `"strict": true`
- [x] **Add npm scripts**
  - [x] `"build": "tsc"`, `"start"`, `"worker"`, `"test"`, `db:generate`, `db:migrate`
  - [x] `dev` and `dev:worker` use `tsx watch` for hot reload
- [x] **Create folder structure** (partial)
  - [x] `src/`, `src/db/`
  - [x] `src/auth/`, `src/routes/`, `src/services/`, `src/services/actions/`, `src/lib/`
  - [x] Tests in `src/` (config.test.ts, smoke.test.ts, db/\*.test.ts)

---

### 1.2 Config

- [x] **Create `src/config.ts`**
  - [x] Read `PORT` from env (default 3000)
  - [x] Read `DATABASE_URL` from env
  - [x] Read `API_KEY` from env
  - [x] Export typed config object
- [x] **Create `.env.example`**
  - [x] `PORT=3000`
  - [x] `DATABASE_URL=postgresql://user:pass@localhost:5432/flowhook`
  - [x] `API_KEY=your-secret-key`

---

### 1.3 DB Schema + Migrations

- [x] **Create Drizzle schema `src/db/schema.ts`**
  - [x] Define `pipelines` table
    - [x] `id` UUID PK, default `gen_random_uuid()`
    - [x] `slug` TEXT UNIQUE NOT NULL
    - [x] `name` TEXT NOT NULL
    - [x] `action_type` TEXT (`transform` | `filter` | `template`)
    - [x] `action_config` JSONB
    - [x] `is_active` BOOLEAN default true
    - [x] `created_at` TIMESTAMPTZ
    - [x] `updated_at` TIMESTAMPTZ
  - [x] Define `subscribers` table
    - [x] `id` UUID PK
    - [x] `pipeline_id` UUID FK → pipelines
    - [x] `url` TEXT NOT NULL
    - [x] `headers` JSONB
    - [x] `created_at` TIMESTAMPTZ
  - [x] Define `jobs` table
    - [x] `id` UUID PK
    - [x] `pipeline_id` UUID FK → pipelines
    - [x] `status` TEXT (`pending` | `processing` | `completed` | `filtered` | `failed`)
    - [x] `payload` JSONB
    - [x] `result` JSONB
    - [x] `created_at` TIMESTAMPTZ
    - [x] `updated_at` TIMESTAMPTZ
    - [x] `processing_started_at` TIMESTAMPTZ
    - [x] `processing_ended_at` TIMESTAMPTZ
  - [x] Define `delivery_attempts` table
    - [x] `id` UUID PK
    - [x] `job_id` UUID FK → jobs
    - [x] `subscriber_id` UUID FK → subscribers
    - [x] `attempt_number` INT
    - [x] `status_code` INT
    - [x] `success` BOOLEAN
    - [x] `error_message` TEXT
    - [x] `created_at` TIMESTAMPTZ
- [x] **Create `src/db/index.ts`**
  - [x] Initialize Drizzle client with `DATABASE_URL`
  - [x] Export `db` and schema
- [x] **Configure Drizzle**
  - [x] Create `drizzle.config.ts` pointing to schema
  - [x] Add `"db:generate": "drizzle-kit generate"` and `"db:migrate": "drizzle-kit migrate"` scripts
- [x] **Generate and run migration**
  - [x] Migration `drizzle/0000_init.sql` exists

---

### 1.4 Health Endpoint

- [x] **Create `src/routes/health.ts`**
  - [x] **Step 1:** Create folder `src/routes/` if it doesn't exist.
  - [x] **Step 2:** Create file `src/routes/health.ts`.
  - [x] **Step 3:** Define and export a Router:
    ```ts
    import { Router } from "express";
    const router = Router();
    router.get("/healthz", (_req, res) => {
      res.type("text/plain").send("OK");
    });
    export default router;
    ```
  - [x] **Step 4:** Mount with `app.use("/api", healthRouter)` so `GET /api/healthz` returns plain text `OK`.
- [x] **Wire up in main server**
  - [x] **Step 5:** In `src/index.ts`, add `import healthRouter from "./routes/health.js";`
  - [x] **Step 6:** Add `app.use("/api", healthRouter);` before `app.listen`.
  - [x] **Step 7:** Keep `app.listen(config.port, ...)`.
  - [x] **Step 8:** Verify: `curl http://localhost:3000/api/healthz` returns `OK` (plain text).

---

### 1.5 Auth Middleware

- [x] **Create `src/auth/validate.ts`**
  - [x] **Step 1:** Create folder `src/auth/` if it doesn't exist.
  - [x] **Step 2:** Create file `src/auth/validate.ts`.
  - [x] **Step 3:** Define the `Identity` interface:
    ```ts
    export interface Identity {
      type: "api_key";
    }
    ```
  - [x] **Step 4:** Implement `validateAuth(req: Request)`:
    - [x] Get `apiKey` from `config.apiKey` (import from `../config.js`).
    - [x] Check `req.headers.authorization` — if it starts with `Bearer `, extract the token (substring after "Bearer ").
    - [x] Else check `req.headers["x-api-key"]` (case-insensitive; Express normalizes to lowercase).
    - [x] If no key found → return `{ valid: false }`.
    - [x] If key found but doesn't match `apiKey` → return `{ valid: false }`.
    - [x] If match → return `{ valid: true, identity: { type: "api_key" } }`.
  - [x] **Step 5:** Function signature: `validateAuth(req: Request): Promise<{ valid: boolean; identity?: Identity }>` (can be sync; return a resolved Promise for future extensibility).
- [x] **Create auth middleware**
  - [x] **Step 6:** In the same file or new `src/auth/middleware.ts`, export `authMiddleware`:
    - [x] Call `validateAuth(req)`.
    - [x] If `!result.valid` → `res.status(401).json({ error: "Unauthorized" })` and return (don't call `next()`).
    - [x] If valid → `(req as any).identity = result.identity; next();`
  - [x] **Step 7:** Add a type for `req.identity` via declaration merging or use a typed `Request` extension.
- [x] **Unit test auth**
  - [x] **Step 8:** Create `src/auth/validate.test.ts` (or `auth.test.ts`).
  - [x] **Step 9:** Set `process.env.API_KEY = "test-key"` in a `beforeEach` (and restore after). Or mock config.
  - [x] **Step 10:** Test: `Authorization: Bearer test-key` → `valid: true`.
  - [x] **Step 11:** Test: `X-API-Key: test-key` → `valid: true`.
  - [x] **Step 12:** Test: missing header → `valid: false`.
  - [x] **Step 13:** Test: wrong key → `valid: false`.
  - [x] **Step 14:** Test: malformed `Authorization: InvalidFormat` → `valid: false`.

---

### 1.6 Slug Library

- [x] **Create `src/lib/slug.ts`**
  - [x] **Step 1:** Create folder `src/lib/` if it doesn't exist.
  - [x] **Step 2:** Create file `src/lib/slug.ts`.
  - [x] **Step 3:** Implement `generateSlug(name: string): string`:
    - [x] `name.toLowerCase().trim()`.
    - [x] Replace non-alphanumeric chars (spaces, underscores, etc.) with `-`: e.g. `replace(/[^a-z0-9]+/g, "-")`.
    - [x] Collapse multiple hyphens: `replace(/-+/g, "-")`.
    - [x] Trim leading/trailing hyphens: `replace(/^-|-$/g, "")`.
    - [x] If empty after that, return `"unnamed"` or similar fallback.
  - [x] **Step 4:** Implement `validateSlug(slug: string): boolean`:
    - [x] Regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
    - [x] Return `regex.test(slug)`.
  - [x] **Step 5:** Implement `ensureUniqueSlug(slug: string, db: DbClient): Promise<string>`:
    - [x] Import db types and schema (e.g. `pipelines` from `../db/schema.js`).
    - [x] Query: `SELECT 1 FROM pipelines WHERE slug = $1 LIMIT 1` (or Drizzle `db.select().from(pipelines).where(eq(pipelines.slug, slug)).limit(1)`).
    - [x] If no row → return `slug`.
    - [x] If collision → try `slug + "-1"`, then `"-2"`, etc. until unique.
  - [x] **Step 6:** Type the `db` param: use the Drizzle client type from `src/db/index.js`.
- [x] **Unit test slug**
  - [x] **Step 7:** Create `src/lib/slug.test.ts`.
  - [x] **Step 8:** Test `generateSlug("My Stripe Orders")` → `"my-stripe-orders"`.
  - [x] **Step 9:** Test `generateSlug("  Hello   World  ")` → `"hello-world"`.
  - [x] **Step 10:** Test invalid chars: `generateSlug("Test@#$%")` → `"test"` (or `"unnamed"` if all stripped).
  - [x] **Step 11:** Test `validateSlug("my-pipeline")` → `true`.
  - [x] **Step 12:** Test `validateSlug("My-Pipeline")` → `false`.
  - [x] **Step 13:** Test `validateSlug("invalid slug")` → `false`.
  - [x] **Step 14:** Test `validateSlug("")` → `false`.
  - [x] **Step 15:** Test `ensureUniqueSlug` with mocked db: new slug returns as-is; existing slug returns `-1` suffix (requires DB mock or integration test).

---

### 1.7 Pipeline Service

- [x] **Create `src/services/pipeline.ts`**
  - [x] **Step 1:** Create folder `src/services/` if it doesn't exist.
  - [x] **Step 2:** Create file `src/services/pipeline.ts`.
  - [x] **Step 3:** Import `db`, `assertDbConnection`, `pipelines`, `eq`, and `generateSlug`, `ensureUniqueSlug`, `validateSlug` from lib.
  - [x] **Step 4:** Implement `createPipeline(name, action_type, action_config)`:
    - [x] Assert db connection.
    - [x] Validate `action_config` per action_type (see below).
    - [x] `baseSlug = generateSlug(name)`.
    - [x] `slug = await ensureUniqueSlug(baseSlug, db)`.
    - [x] Insert: `db.insert(pipelines).values({ slug, name, actionType: action_type, actionConfig: action_config }).returning({ id, slug, ... })`.
    - [x] Return full pipeline row.
  - [x] **Step 5:** Implement `listPipelines()`: `db.select().from(pipelines)`.
  - [x] **Step 6:** Implement `getPipelineById(id)`: `db.select().from(pipelines).where(eq(pipelines.id, id)).limit(1)`; return first row or null.
  - [x] **Step 7:** Implement `getPipelineBySlug(slug)`: same pattern, `eq(pipelines.slug, slug)`.
  - [x] **Step 8:** Implement `updatePipeline(id, updates)`: `db.update(pipelines).set({ ...updates, updatedAt: new Date() }).where(eq(pipelines.id, id)).returning()`.
  - [x] **Step 9:** Implement `deletePipeline(id)`: `db.delete(pipelines).where(eq(pipelines.id, id)).returning()`; cascade handles subscribers.
- [x] **Validate action_config shape**
  - [x] **Step 10:** For `action_type === "transform"`: ensure `action_config` is object with `mappings` array. Each mapping has `from` and `to` (strings). Throw if invalid.
  - [x] **Step 11:** For `action_type === "filter"`: ensure `action_config.conditions` is array. Each condition has `path`, `operator`, optional `value`. Throw if invalid.
  - [x] **Step 12:** For `action_type === "template"`: ensure `action_config.template` is string. Throw if invalid.
  - [x] **Step 13:** For unknown action_type, throw.

---

### 1.8 Pipeline Routes

- [x] **Create `src/routes/pipelines.ts`**
  - [x] **Step 1:** Create file `src/routes/pipelines.ts`.
  - [x] **Step 2:** Create router: `const router = Router();`
  - [x] **Step 3:** Apply auth middleware: `router.use(authMiddleware);` so all routes below require auth.
  - [x] **Step 4:** `POST /api/pipelines`:
    - [x] Parse body: `{ name, action_type, action_config }`.
    - [x] Validate: `name` (string, non-empty), `action_type` (one of "transform"|"filter"|"template"), `action_config` (object).
    - [x] If invalid → `res.status(400).json({ error: "Invalid request" })`.
    - [x] Call `createPipeline(name, action_type, action_config)`.
    - [x] Return `res.status(201).json(pipeline)`; include `webhookUrl: \`${baseUrl}/webhooks/${pipeline.slug}\`` if you have base URL.
  - [x] **Step 5:** `GET /api/pipelines`: call `listPipelines()`, return `res.json(pipelines)`.
  - [x] **Step 6:** `GET /api/pipelines/:id`: call `getPipelineById(id)`; if null → 404; else `res.json(pipeline)`.
  - [x] **Step 7:** `PUT /api/pipelines/:id`: parse body (partial: name, action_type, action_config); call `updatePipeline(id, updates)`; if no rows updated → 404; else return updated pipeline.
  - [x] **Step 8:** `DELETE /api/pipelines/:id`: call `deletePipeline(id)`; if no rows → 404; else 204.
  - [x] **Step 9:** Mount in `index.ts`: `app.use("/api/pipelines", pipelinesRouter)`. In the router, define `router.post("/", ...)`, `router.get("/", ...)`, `router.get("/:id", ...)`, `router.put("/:id", ...)`, `router.delete("/:id", ...)` so full paths are `/api/pipelines`, `/api/pipelines/:id`.
- [x] **Integration tests for pipeline CRUD**
  - [x] **Step 10:** Create `src/routes/pipelines.integration.test.ts` or in `tests/`.
  - [x] **Step 11:** Use real Postgres (DATABASE_URL) or skip if not set.
  - [x] **Step 12:** Before each test: clean pipelines table or use unique names.
  - [x] **Step 13:** Test create: POST with valid body, expect 201, body has `slug`, `id`.
  - [x] **Step 14:** Test list: GET, expect array.
  - [x] **Step 15:** Test get by id: use id from create, expect 200.
  - [x] **Step 16:** Test update: PUT with new name, expect 200 with updated data.
  - [x] **Step 17:** Test delete: DELETE, then GET same id, expect 404.
  - [x] **Step 18:** Test 401: send request without `Authorization` or `X-API-Key`, expect 401.

---

### 1.9 Subscriber Service

- [x] **Create `src/services/subscriber.ts`** (or add to pipeline.ts)
  - [x] **Step 1:** Create file `src/services/subscriber.ts`.
  - [x] **Step 2:** Implement `addSubscriber(pipelineId, url, headers?)`:
    - [x] Assert db connection.
    - [x] Validate URL format: `new URL(url)` or regex for http(s) URL.
    - [x] Insert: `db.insert(subscribers).values({ pipelineId, url, headers: headers ?? null }).returning()`.
    - [x] Return subscriber row.
    - [x] Optionally verify pipeline exists first; if not, throw or return null.
  - [x] **Step 3:** Implement `removeSubscriber(pipelineId, subscriberId)`:
    - [x] Delete where `subscriberId` AND `pipelineId` match (ensures ownership): `db.delete(subscribers).where(and(eq(subscribers.id, subscriberId), eq(subscribers.pipelineId, pipelineId))).returning()`.
    - [x] Return deleted row or null.
  - [x] **Step 4:** Implement `getSubscribersByPipelineId(pipelineId)`:
    - [x] `db.select().from(subscribers).where(eq(subscribers.pipelineId, pipelineId))`.
    - [x] Return array.

---

### 1.10 Subscriber Routes

- [x] **Add subscriber endpoints**
  - [x] **Step 1:** In `src/routes/pipelines.ts` or new `src/routes/subscribers.ts`, add nested routes.
  - [x] **Step 2:** `POST /api/pipelines/:id/subscribers`:
    - [x] Get `pipelineId` from `req.params.id`.
    - [x] Call `getPipelineById(pipelineId)`; if null → 404.
    - [x] Parse body: `{ url, headers? }`.
    - [x] Validate `url` (required, valid URL format).
    - [x] Call `addSubscriber(pipelineId, url, headers)`.
    - [x] Return 201 with subscriber.
  - [x] **Step 3:** `DELETE /api/pipelines/:id/subscribers/:subscriberId`:
    - [x] Get `pipelineId`, `subscriberId` from params.
    - [x] Call `getPipelineById(pipelineId)`; if null → 404.
    - [x] Call `removeSubscriber(pipelineId, subscriberId)`; if null → 404.
    - [x] Return 204.
  - [x] **Step 4:** Mount routes: e.g. `router.post("/:id/subscribers", ...)` and `router.delete("/:id/subscribers/:subscriberId", ...)` on pipelines router.
- [x] **Integration tests for subscriber CRUD**
  - [x] **Step 5:** Test add: create pipeline, POST subscriber, expect 201.
  - [x] **Step 6:** Test add with invalid pipeline id → 404.
  - [x] **Step 7:** Test add with invalid URL → 400.
  - [x] **Step 8:** Test remove: add subscriber, DELETE, expect 204.
  - [x] **Step 9:** Test remove with wrong pipeline id → 404.

---

### 1.11 Job Service (Enqueue Only)

- [x] **Create `src/services/job.ts`**
  - [x] **Step 1:** Create file `src/services/job.ts`.
  - [x] **Step 2:** Import `db`, `assertDbConnection`, `jobs`, `eq`.
  - [x] **Step 3:** Implement `enqueueJob(pipelineId, payload)`:
    - [x] Assert db connection.
    - [x] `payload` is `unknown` (JSON body); store as JSONB.
    - [x] Insert: `db.insert(jobs).values({ pipelineId, status: "pending", payload }).returning({ id })`.
    - [x] Return `id` (UUID string).

---

### 1.12 Webhook Ingestion

- [x] **Create `src/routes/webhooks.ts`**
  - [x] **Step 1:** Create file `src/routes/webhooks.ts`.
  - [x] **Step 2:** Create router. Do **not** apply auth middleware (webhooks are unauthenticated).
  - [x] **Step 3:** `POST /webhooks/:slug`:
    - [x] `slug = req.params.slug`.
    - [x] Call `getPipelineBySlug(slug)` (from pipeline service).
    - [x] If null → `res.status(404).json({ error: "Pipeline not found" })`.
    - [x] If `!pipeline.isActive` → `res.status(400).json({ error: "Pipeline is inactive" })`.
    - [x] Parse body: `JSON.parse` or `express.json()` already parsed it. If invalid (caught), → 400.
    - [x] Call `enqueueJob(pipeline.id, req.body)`.
    - [x] Return `res.status(202).set("Job-Id", jobId).json({ jobId })` or empty body.
    - [x] Wrap in try/catch; on DB error → 500.
  - [x] **Step 4:** Mount: `app.use("/webhooks", webhooksRouter)` — route will be `POST /webhooks/:slug`. Ensure router defines `router.post("/:slug", handler)`.
  - [x] **Step 5:** Ensure `app.use(express.json())` is before webhooks so body is parsed.
- [x] **Integration test webhook ingest**
  - [x] **Step 6:** Create pipeline with transform action, get slug.
  - [x] **Step 7:** POST `{"foo":"bar"}` to `http://localhost:PORT/webhooks/{slug}`.
  - [x] **Step 8:** Expect 202, `Job-Id` header present.
  - [x] **Step 9:** Query jobs table; one job with `status: "pending"`, `payload` matches.
  - [x] **Step 10:** POST to `/webhooks/nonexistent` → 404.
  - [x] **Step 11:** POST invalid JSON (e.g. raw `{invalid`) → 400.

---

### 1.13 Docker

- [x] **Verify/align Dockerfile**
  - [x] **Step 1:** Ensure multi-stage build: stage 1 builds TS, stage 2 copies dist.
  - [x] **Step 2:** Builder: `FROM node:24-alpine` (or 22 if preferred), `WORKDIR /app`, `COPY package*.json`, `RUN npm ci`, `COPY .`, `RUN npm run build`.
  - [x] **Step 3:** Runtime: `FROM node:24-alpine`, `COPY package*.json`, `RUN npm ci --omit=dev`, `COPY --from=builder /app/dist ./dist`, `CMD ["node", "dist/index.js"]`.
  - [x] **Step 4:** Add `EXPOSE 8080` if using 8080 (Cloud Run).
- [x] **Verify docker-compose.yml**
  - [x] **Step 5:** `postgres`: image `postgres:16`, env `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, ports `5432`, volume for persistence, healthcheck.
  - [x] **Step 6:** `api`: `build: .`, `command: node dist/index.js`, `depends_on: postgres`, env `DATABASE_URL`, `API_KEY`, `PORT`.
  - [x] **Step 7:** `worker`: same image, `command: node dist/worker.js`, `depends_on: postgres`.
  - [x] **Step 8:** Run `docker compose build` then `docker compose up` — api and postgres should start.

---

### 1.14 GitHub Actions CI

- [x] **Create `.github/workflows/ci.yml`**
  - [x] On pull_request to main/master
  - [x] Node via `.nvmrc`, `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`
  - [x] `npm ci`, `npm test`, `npm run test:coverage`
  - [x] Style job: format:check, lint
- [x] **CD workflow** (`.github/workflows/cd.yml`) — deploy to GCP Cloud Run on push to main

---

### 1.15 Base Tests Summary

- **Unit tests** (partial)
  - [x] Config parsing (`config.test.ts`)
  - [x] DB helpers (`db/db.test.ts`)
  - [x] **Auth validation** (`src/auth/validate.test.ts`)
    - [x] **Step 1:** Create test file. Use `describe("validateAuth", () => { ... })`.
    - [x] **Step 2:** Mock or set `process.env.API_KEY = "secret"` in beforeEach; restore in afterEach.
    - [x] **Step 3:** Build mock req: `{ headers: { authorization: "Bearer secret" } }`. Call `validateAuth(mockReq)`. Expect `{ valid: true, identity: { type: "api_key" } }`.
    - [x] **Step 4:** Same with `headers: { "x-api-key": "secret" }`.
    - [x] **Step 5:** `headers: {}` → `{ valid: false }`.
    - [x] **Step 6:** Wrong key → `{ valid: false }`.
  - [x] **Slug generation and validation** (`src/lib/slug.test.ts`)
    - [x] **Step 1:** Test `generateSlug("My Stripe Orders")` → `"my-stripe-orders"`.
    - [x] **Step 2:** Test `generateSlug("  spaces  ")` → `"spaces"`.
    - [x] **Step 3:** Test `validateSlug("valid-slug")` → true, `validateSlug("Invalid")` → false.
  - [x] **Action config parsing** (optional) — validate in pipeline service; add unit test for validation helper if extracted.
- **Integration tests** (partial)
  - [x] DB integration (`db/db.integration.test.ts` — conditional on DATABASE_URL)
  - [x] Smoke test (`smoke.test.ts`)
  - [x] **Health endpoint**: `GET /api/healthz` → 200, body "OK".
  - [x] **Pipeline CRUD**: See 1.8 Step 10–18.
  - [x] **Subscriber CRUD**: See 1.10 Step 5–9.
  - [x] **Webhook ingestion**: See 1.12 Step 6–11.
  - [x] **401 on protected routes**: Request without API key → 401.

---

### Phase 1 Complete When

- [x] **Step 1:** Run `docker compose up` — api and postgres start without error.
- [x] **Step 2:** Create pipeline via `POST /api/pipelines` (with API key).
- [x] **Step 3:** Add subscriber via `POST /api/pipelines/:id/subscribers`.
- [x] **Step 4:** POST JSON body to `POST /webhooks/:slug`.
- [x] **Step 5:** Verify job exists in DB with `status: "pending"`.
- [x] **Step 6:** CI passes

---

## Phase 2: Worker Skeleton (branch `feat/worker`)

**Scope:** Job poller loop, action dispatcher, transform action (real), filter/template (stubs), delivery stub. Worker processes transform jobs end-to-end; delivery is no-op.

**Merge when:** Jobs with `action_type: transform` process end-to-end (result stored, status `completed`). Filter/template throw when used.

---

### 2.0 Branch Setup

- [ ] **Step 1:** Create branch `feat/worker` from `main`
  - [ ] Run: `git checkout main && git pull && git checkout -b feat/worker`

---

### 2.1 Config: Worker Poll Interval

- [x] **Step 1:** Add poll interval to `src/config.ts`
  - [x] Read `WORKER_POLL_INTERVAL_MS` from env (default: `1000`)
  - [x] Parse as positive integer; if invalid, use default
  - [x] Export in config object (e.g. `config.worker.pollIntervalMs`)
- [x] **Step 2:** Add to `.env.example`
  - [x] `WORKER_POLL_INTERVAL_MS=1000`
- [x] **Step 3:** Add JSDoc for the new config property

---

### 2.2 JSON Path Helper (lib)

- [x] **Step 1:** Create `src/lib/jsonPath.ts`
  - [x] Add module JSDoc: dot-notation path helpers for action payloads
- [x] **Step 2:** Implement `getValueAtPath(obj: unknown, path: string): unknown`
  - [x] Split path by `.`; walk obj by each segment
  - [x] Return value at path, or `undefined` if not found
  - [x] Handle null/undefined intermediate values
- [x] **Step 3:** Implement `setValueAtPath(obj: Record<string, unknown>, key: string, value: unknown): void`
  - [x] For Phase 2: `key` is flat only (no dots); set `obj[key] = value`
  - [x] Add JSDoc noting flat keys only for v1
- [x] **Step 4:** Add JSDoc to both functions (`@param`, `@returns`)
- [x] **Step 5:** Create `src/lib/jsonPath.test.ts`
  - [x] Test `getValueAtPath({ a: 1 }, "a")` → `1`
  - [x] Test `getValueAtPath({ a: { b: 2 } }, "a.b")` → `2`
  - [x] Test `getValueAtPath({}, "x")` → `undefined`
  - [x] Test `setValueAtPath({}, "foo", 42)` mutates obj to `{ foo: 42 }`

---

### 2.3 Job Claim Query (db layer)

- [x] **Step 1:** Add `updateJob` to `src/db/queries/jobs.ts`
  - [x] Signature: `updateJob(db, jobId, updates): Promise<JobRow | undefined>`
  - [x] `updates` type: `{ status?, result?, processingStartedAt?, processingEndedAt? }`
  - [x] Use `db.update(jobs).set({ ...updates }).where(eq(jobs.id, jobId)).returning()`
  - [x] Return first row or undefined
  - [x] Add JSDoc
- [x] **Step 2:** Add `claimNextPendingJob` to `src/db/queries/jobs.ts`
  - [x] Signature: `claimNextPendingJob(db): Promise<JobRow | null>`
  - [x] Use `db.transaction(async (tx) => { ... })` for atomic claim
  - [x] Inside tx: `SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED` (Drizzle: `.for('update', { skipLocked: true })`)
  - [x] If no row → return null
  - [x] Else: `UPDATE jobs SET status = 'processing', processing_started_at = now() WHERE id = ?`
  - [x] Return the claimed job row
  - [x] Add JSDoc
- [x] **Step 3:** Add module JSDoc update if needed

---

### 2.4 Job Service: Claim

- [x] **Step 1:** Add `claimNextJob` to `src/services/job.ts`
  - [x] Call `assertDbConnection(db)`
  - [x] Call `claimNextPendingJob(db)` and return result
  - [x] Return type: `Promise<JobRow | null>`
- [x] **Step 2:** Worker will call `updateJob` from `db/queries/jobs` directly (no service wrapper needed)
- [x] **Step 3:** Add JSDoc for `claimNextJob`

---

### 2.5 Action Dispatcher

- [x] **Step 1:** Create `src/services/actions/index.ts`
  - [x] Add module JSDoc: dispatches to transform, filter, or template by action type
- [x] **Step 2:** Define return type: `{ result: unknown } | { filtered: true }`
- [x] **Step 3:** Export `runAction(actionType, actionConfig, payload): Promise<...>`
  - [x] Switch on `actionType`; call `runTransform`, `runFilter`, or `runTemplate`
  - [x] Re-export or import from `./transform.js`, `./filter.js`, `./template.js`
- [x] **Step 4:** Add JSDoc with `@param`, `@returns`, `@throws`

---

### 2.6 Transform Action (real implementation)

- [x] **Step 1:** Create `src/services/actions/transform.ts`
  - [x] Add module JSDoc: transform action — rename/reshape JSON fields per mappings
- [x] **Step 2:** Import `getValueAtPath`, `setValueAtPath` from `../../lib/jsonPath.js`
- [x] **Step 3:** Import `TransformActionConfig` from `../../db/types.js`
- [x] **Step 4:** Export `runTransform(config: TransformActionConfig, payload: unknown): { result: Record<string, unknown> }`
  - [x] Assume config is valid (already validated on pipeline create)
  - [x] Create output object `{}`
  - [x] For each mapping: `value = getValueAtPath(payload, mapping.from)`
  - [x] If `value === undefined` and `!mapping.optional` → throw `Error("Required field missing: ...")`
  - [x] If defined or optional: `setValueAtPath(output, mapping.to, value)` (flat `to` only)
  - [x] Return `{ result: output }`
- [x] **Step 5:** Add JSDoc
- [x] **Step 6:** Create `src/services/actions/transform.test.ts`
  - [x] Simple rename: `{ from: "a", to: "b" }` + `{ a: 1 }` → `{ result: { b: 1 } }`
  - [x] Optional missing: `{ from: "x", to: "y", optional: true }` + `{}` → `{ result: { y: undefined } }` (or omit key — define behavior)
  - [x] Required missing: `{ from: "x", to: "y" }` + `{}` → throws

---

### 2.7 Filter Action (stub)

- [x] **Step 1:** Create `src/services/actions/filter.ts`
  - [x] Add module JSDoc: filter action stub — not implemented in Phase 2
- [x] **Step 2:** Export `runFilter(_config, _payload): never`
  - [x] Throw `new Error("Filter action is not implemented")`
- [x] **Step 3:** Add JSDoc with `@throws`

---

### 2.8 Template Action (stub)

- [x] **Step 1:** Create `src/services/actions/template.ts`
  - [x] Add module JSDoc: template action stub — not implemented in Phase 2
- [x] **Step 2:** Export `runTemplate(_config, _payload): never`
  - [x] Throw `new Error("Template action is not implemented")`
- [x] **Step 3:** Add JSDoc with `@throws`

---

### 2.9 Delivery Stub

- [x] **Step 1:** Create `src/lib/delivery.ts`
  - [x] Add module JSDoc: delivery to subscribers; Phase 2 is no-op stub
- [x] **Step 2:** Define `DeliverySigner` interface
  - [x] `sign(payload: string): string` — for future HMAC
  - [x] Add JSDoc: v1 implementation returns `""`
- [x] **Step 3:** Export `deliverToSubscribers(subscribers, result, jobId): Promise<void>`
  - [x] Params: `SubscriberRow[]`, `unknown`, `string`
  - [x] Body: no-op (do nothing)
  - [x] Add JSDoc

---

### 2.10 Worker Processing Loop

- [x] **Step 1:** Update `src/worker.ts` — add module JSDoc (worker entry, polls jobs, runs actions)
- [x] **Step 2:** Import: `db`, `assertDbConnection`, `config`, `claimNextJob`, `updateJob` (from queries), `getPipelineById`, `getSubscribersByPipelineId`, `runAction`, `deliverToSubscribers`
- [x] **Step 3:** Add `sleep(ms: number): Promise<void>` helper (e.g. `return new Promise(r => setTimeout(r, ms))`)
- [x] **Step 4:** Implement main loop: `while (true)`
  - [x] Call `claimNextJob()`
  - [x] If `null` → `await sleep(config.worker.pollIntervalMs)`, continue
  - [x] Assert db; fetch pipeline via `getPipelineById(db, job.pipelineId)`
  - [x] If pipeline missing → log error, update job `failed`, continue
  - [x] Fetch subscribers via `getSubscribersByPipelineId(db, job.pipelineId)`
  - [x] Try: `outcome = await runAction(pipeline.actionType, pipeline.actionConfig, job.payload)`
  - [x] If `{ filtered: true }` → update job: `status: 'filtered'`, `result: null`, `processingEndedAt: new Date()`
  - [x] Else → update job: `status: 'completed'`, `result: outcome.result`, `processingEndedAt: new Date()`; call `deliverToSubscribers(subscribers, outcome.result, job.id)`
  - [x] Catch: `const message = e instanceof Error ? e.message : String(e)`; `console.error("Error:", message)`; update job `failed`, `processingEndedAt`
- [x] **Step 5:** Ensure worker exits if `db` is undefined (e.g. log and exit with code 1)

---

### 2.11 Integration Test

- [x] **Step 1:** Create `src/worker.integration.test.ts`
  - [x] Use `describe.skipIf(!hasDbUrl || !hasApiKey)` pattern (match webhooks test)
- [x] **Step 2:** Test: create pipeline with transform, enqueue job, run worker once, verify job completed
  - [x] Create pipeline via API (transform, mappings `[{ from: "x", to: "y" }]`)
  - [x] POST to webhook with `{ x: 123 }`
  - [x] Call worker processing logic (or spawn worker process and poll — prefer invoking processing function if exported)
  - [x] Query jobs table: status `completed`, result `{ y: 123 }`
- [x] **Step 3:** If worker loop is not easily testable in-process, document manual verification step as fallback

---

### Phase 2 Complete When

- [x] **Step 1:** Worker processes transform jobs end-to-end (result stored, status `completed`)
- [x] **Step 2:** Filter and template throw when used (acceptable for Phase 2)
- [x] **Step 3:** All unit and integration tests pass
- [x] **Step 4:** `npm run build` succeeds
- [x] **Step 5:** Merge `feat/worker` into `main`

---

## Phase 3a: Filter Action (branch `feat/filter`)

- [x] **Create branch:** `git checkout main && git pull && git checkout -b feat/filter`

---

### 3a.1 Implement Filter

- [x] **Implement `src/services/actions/filter.ts`**
  - [x] Parse `action_config.conditions` — array of `{ path, operator, value }`
  - [x] Operators: `eq`, `neq`, `exists`, `contains`
  - [x] Get value at path from payload (e.g. `payload.event.type`)
  - [x] Evaluate each condition (AND)
  - [x] If all match → return `{ result: payload }` (keep)
  - [x] If any fail → return `{ filtered: true }` (drop)
- [x] **Unit tests**
  - [x] `eq` matches
  - [x] `eq` no match → filtered
  - [x] `neq` matches
  - [x] `exists` for present/missing
  - [x] `contains` for string/array
  - [x] Multiple conditions ANDed

---

### Phase 3a Complete When

- [x] Filter action works; dropped events mark job `filtered`
- [x] Merge `feat/filter` into `main`

---

## Phase 3b: Template Action (branch `feat/template`)

- [x] **Create branch:** `git checkout main && git pull && git checkout -b feat/template`

---

### 3b.1 Implement Template

- [x] **Implement `src/services/actions/template.ts`**
  - [x] Parse `action_config.template` — string with `{{path}}` placeholders
  - [x] Replace each `{{x.y.z}}` with value from payload at path
  - [x] Use mustache lib or custom regex
  - [x] Return `{ result: { text: renderedString } }` or similar (design: template produces a string; store as `{ text: "..." }`)
- [x] **Unit tests**
  - [x] Simple `{{name}}` replacement
  - [x] Nested `{{user.email}}`
  - [x] Missing path → empty string or error (define behavior)

---

### Phase 3b Complete When

- [x] Template action works
- [x] Merge `feat/template` into `main`

---

## Phase 4: Delivery (branch `feat/delivery`)

- [ ] **Create branch:** `git checkout main && git pull && git checkout -b feat/delivery`

---

### 4.1 Delivery Implementation

- [ ] **Implement `src/lib/delivery.ts`**
  - [ ] For each subscriber: POST to `subscriber.url` with `Content-Type: application/json`
  - [ ] Body = processed result (JSON.stringify)
  - [ ] Add headers from `subscriber.headers` (JSONB)
  - [ ] Retry: 3 attempts, exponential backoff (1s, 2s, 4s)
  - [ ] On 2xx → success, record in delivery_attempts
  - [ ] On failure → record attempt, retry
  - [ ] After all retries fail → record final failure
- [ ] **Insert delivery_attempts**
  - [ ] For each attempt: job_id, subscriber_id, attempt_number, status_code, success, error_message, created_at
- [ ] **Wire into worker**
  - [ ] Replace delivery stub with real `deliverToSubscribers`
  - [ ] Only deliver when job not filtered
  - [ ] Mark job `failed` if any subscriber fails after retries? Or `completed` with some failed? (Define: e.g. job completed if at least one delivered, or strict: all must succeed)
- [ ] **Unit test retry/backoff**
  - [ ] Mock HTTP: first fails, second succeeds
  - [ ] Verify backoff timing
- [ ] **Integration test**
  - [ ] Use mock HTTP server (e.g. nock or local express); verify POST received with correct body and headers

---

### Phase 4 Complete When

- [ ] Full flow: webhook → job → action → delivery to subscribers
- [ ] delivery_attempts populated
- [ ] Retry works on transient failure
- [ ] Merge `feat/delivery` into `main`

---

## Phase 5: Job API (branch `feat/job-api`)

- [ ] **Create branch:** `git checkout main && git pull && git checkout -b feat/job-api`

---

### 5.1 Job Query Service

- [ ] **Add to `src/services/job.ts`**
  - [ ] `getJobById(id)` — job + delivery_attempts (join or separate query)
  - [ ] `listJobs(filters: { pipelineId?, status?, limit?, offset? })` — paginated list

---

### 5.2 Job Routes

- [ ] **Create `src/routes/jobs.ts`**
  - [ ] `GET /api/jobs/:id` — get job with delivery attempts (404 if not found)
  - [ ] `GET /api/jobs` — list with query params pipelineId, status, limit, offset
- [ ] **Apply auth middleware**
- [ ] **Integration tests**
  - [ ] Get job by id
  - [ ] List jobs with filters
  - [ ] 401 without API key

---

### Phase 5 Complete When

- [ ] Job API works
- [ ] Merge `feat/job-api` into `main`

---

## Final: Documentation & Polish

- [ ] **README.md**
  - [ ] Project overview
  - [ ] Setup (clone, npm install, .env, db migrate)
  - [ ] Run with docker compose
  - [ ] API documentation (endpoints, request/response examples)
  - [ ] Architecture diagram (reference DESIGN_DECISIONS)
  - [ ] Design decisions summary
- [ ] **docs/DESIGN_DECISIONS.md** (copy from PlaningFlowHook or adapt)
- [ ] **Clean up**
  - [ ] Remove console.logs
  - [ ] Ensure all tests pass
  - [ ] Verify `docker compose up` runs full stack

---

## Quick Reference: Branch Order

| Order | Branch          | From | Merge When                |
| ----- | --------------- | ---- | ------------------------- |
| 1     | `feat/worker`   | main | Transform works           |
| 2     | `feat/filter`   | main | Filter works              |
| 2     | `feat/template` | main | Template works (parallel) |
| 3     | `feat/delivery` | main | Delivery works            |
| 4     | `feat/job-api`  | main | Job API works             |
