# FlowHook — Full TODO Tree

Deeply detailed step-by-step checklist. Work top-to-bottom within each phase. Check off items as you complete them.

**Status:** Phase 1 partially complete. Project init, config, DB schema, basic health, Docker, and CI/CD are done. Auth, pipeline APIs, webhooks, and worker processing are pending.

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

- [ ] **Create `src/routes/health.ts`**
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

- [ ] **Create `src/auth/validate.ts`**
  - [ ] **Step 1:** Create folder `src/auth/` if it doesn't exist.
  - [ ] **Step 2:** Create file `src/auth/validate.ts`.
  - [ ] **Step 3:** Define the `Identity` interface:
    ```ts
    export interface Identity {
      type: "api_key";
    }
    ```
  - [ ] **Step 4:** Implement `validateAuth(req: Request)`:
    - [ ] Get `apiKey` from `config.apiKey` (import from `../config.js`).
    - [ ] Check `req.headers.authorization` — if it starts with `Bearer `, extract the token (substring after "Bearer ").
    - [ ] Else check `req.headers["x-api-key"]` (case-insensitive; Express normalizes to lowercase).
    - [ ] If no key found → return `{ valid: false }`.
    - [ ] If key found but doesn't match `apiKey` → return `{ valid: false }`.
    - [ ] If match → return `{ valid: true, identity: { type: "api_key" } }`.
  - [ ] **Step 5:** Function signature: `validateAuth(req: Request): Promise<{ valid: boolean; identity?: Identity }>` (can be sync; return a resolved Promise for future extensibility).
- [ ] **Create auth middleware**
  - [ ] **Step 6:** In the same file or new `src/auth/middleware.ts`, export `authMiddleware`:
    - [ ] Call `validateAuth(req)`.
    - [ ] If `!result.valid` → `res.status(401).json({ error: "Unauthorized" })` and return (don't call `next()`).
    - [ ] If valid → `(req as any).identity = result.identity; next();`
  - [ ] **Step 7:** Add a type for `req.identity` via declaration merging or use a typed `Request` extension.
- [ ] **Unit test auth**
  - [ ] **Step 8:** Create `src/auth/validate.test.ts` (or `auth.test.ts`).
  - [ ] **Step 9:** Set `process.env.API_KEY = "test-key"` in a `beforeEach` (and restore after). Or mock config.
  - [ ] **Step 10:** Test: `Authorization: Bearer test-key` → `valid: true`.
  - [ ] **Step 11:** Test: `X-API-Key: test-key` → `valid: true`.
  - [ ] **Step 12:** Test: missing header → `valid: false`.
  - [ ] **Step 13:** Test: wrong key → `valid: false`.
  - [ ] **Step 14:** Test: malformed `Authorization: InvalidFormat` → `valid: false`.

---

### 1.6 Slug Library

- [ ] **Create `src/lib/slug.ts`**
  - [ ] **Step 1:** Create folder `src/lib/` if it doesn't exist.
  - [ ] **Step 2:** Create file `src/lib/slug.ts`.
  - [ ] **Step 3:** Implement `generateSlug(name: string): string`:
    - [ ] `name.toLowerCase().trim()`.
    - [ ] Replace non-alphanumeric chars (spaces, underscores, etc.) with `-`: e.g. `replace(/[^a-z0-9]+/g, "-")`.
    - [ ] Collapse multiple hyphens: `replace(/-+/g, "-")`.
    - [ ] Trim leading/trailing hyphens: `replace(/^-|-$/g, "")`.
    - [ ] If empty after that, return `"unnamed"` or similar fallback.
  - [ ] **Step 4:** Implement `validateSlug(slug: string): boolean`:
    - [ ] Regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
    - [ ] Return `regex.test(slug)`.
  - [ ] **Step 5:** Implement `ensureUniqueSlug(slug: string, db: DbClient): Promise<string>`:
    - [ ] Import db types and schema (e.g. `pipelines` from `../db/schema.js`).
    - [ ] Query: `SELECT 1 FROM pipelines WHERE slug = $1 LIMIT 1` (or Drizzle `db.select().from(pipelines).where(eq(pipelines.slug, slug)).limit(1)`).
    - [ ] If no row → return `slug`.
    - [ ] If collision → try `slug + "-1"`, then `"-2"`, etc. until unique.
  - [ ] **Step 6:** Type the `db` param: use the Drizzle client type from `src/db/index.js`.
- [ ] **Unit test slug**
  - [ ] **Step 7:** Create `src/lib/slug.test.ts`.
  - [ ] **Step 8:** Test `generateSlug("My Stripe Orders")` → `"my-stripe-orders"`.
  - [ ] **Step 9:** Test `generateSlug("  Hello   World  ")` → `"hello-world"`.
  - [ ] **Step 10:** Test invalid chars: `generateSlug("Test@#$%")` → `"test"` (or `"unnamed"` if all stripped).
  - [ ] **Step 11:** Test `validateSlug("my-pipeline")` → `true`.
  - [ ] **Step 12:** Test `validateSlug("My-Pipeline")` → `false`.
  - [ ] **Step 13:** Test `validateSlug("invalid slug")` → `false`.
  - [ ] **Step 14:** Test `validateSlug("")` → `false`.
  - [ ] **Step 15:** Test `ensureUniqueSlug` with mocked db: new slug returns as-is; existing slug returns `-1` suffix (requires DB mock or integration test).

---

### 1.7 Pipeline Service

- [ ] **Create `src/services/pipeline.ts`**
  - [ ] **Step 1:** Create folder `src/services/` if it doesn't exist.
  - [ ] **Step 2:** Create file `src/services/pipeline.ts`.
  - [ ] **Step 3:** Import `db`, `assertDbConnection`, `pipelines`, `eq`, and `generateSlug`, `ensureUniqueSlug`, `validateSlug` from lib.
  - [ ] **Step 4:** Implement `createPipeline(name, action_type, action_config)`:
    - [ ] Assert db connection.
    - [ ] Validate `action_config` per action_type (see below).
    - [ ] `baseSlug = generateSlug(name)`.
    - [ ] `slug = await ensureUniqueSlug(baseSlug, db)`.
    - [ ] Insert: `db.insert(pipelines).values({ slug, name, actionType: action_type, actionConfig: action_config }).returning({ id, slug, ... })`.
    - [ ] Return full pipeline row.
  - [ ] **Step 5:** Implement `listPipelines()`: `db.select().from(pipelines)`.
  - [ ] **Step 6:** Implement `getPipelineById(id)`: `db.select().from(pipelines).where(eq(pipelines.id, id)).limit(1)`; return first row or null.
  - [ ] **Step 7:** Implement `getPipelineBySlug(slug)`: same pattern, `eq(pipelines.slug, slug)`.
  - [ ] **Step 8:** Implement `updatePipeline(id, updates)`: `db.update(pipelines).set({ ...updates, updatedAt: new Date() }).where(eq(pipelines.id, id)).returning()`.
  - [ ] **Step 9:** Implement `deletePipeline(id)`: `db.delete(pipelines).where(eq(pipelines.id, id)).returning()`; cascade handles subscribers.
- [ ] **Validate action_config shape**
  - [ ] **Step 10:** For `action_type === "transform"`: ensure `action_config` is object with `mappings` array. Each mapping has `from` and `to` (strings). Throw if invalid.
  - [ ] **Step 11:** For `action_type === "filter"`: ensure `action_config.conditions` is array. Each condition has `path`, `operator`, optional `value`. Throw if invalid.
  - [ ] **Step 12:** For `action_type === "template"`: ensure `action_config.template` is string. Throw if invalid.
  - [ ] **Step 13:** For unknown action_type, throw.

---

### 1.8 Pipeline Routes

- [ ] **Create `src/routes/pipelines.ts`**
  - [ ] **Step 1:** Create file `src/routes/pipelines.ts`.
  - [ ] **Step 2:** Create router: `const router = Router();`
  - [ ] **Step 3:** Apply auth middleware: `router.use(authMiddleware);` so all routes below require auth.
  - [ ] **Step 4:** `POST /api/pipelines`:
    - [ ] Parse body: `{ name, action_type, action_config }`.
    - [ ] Validate: `name` (string, non-empty), `action_type` (one of "transform"|"filter"|"template"), `action_config` (object).
    - [ ] If invalid → `res.status(400).json({ error: "Invalid request" })`.
    - [ ] Call `createPipeline(name, action_type, action_config)`.
    - [ ] Return `res.status(201).json(pipeline)`; include `webhookUrl: \`${baseUrl}/webhooks/${pipeline.slug}\`` if you have base URL.
  - [ ] **Step 5:** `GET /api/pipelines`: call `listPipelines()`, return `res.json(pipelines)`.
  - [ ] **Step 6:** `GET /api/pipelines/:id`: call `getPipelineById(id)`; if null → 404; else `res.json(pipeline)`.
  - [ ] **Step 7:** `PUT /api/pipelines/:id`: parse body (partial: name, action_type, action_config); call `updatePipeline(id, updates)`; if no rows updated → 404; else return updated pipeline.
  - [ ] **Step 8:** `DELETE /api/pipelines/:id`: call `deletePipeline(id)`; if no rows → 404; else 204.
  - [ ] **Step 9:** Mount in `index.ts`: `app.use("/api/pipelines", pipelinesRouter)`. In the router, define `router.post("/", ...)`, `router.get("/", ...)`, `router.get("/:id", ...)`, `router.put("/:id", ...)`, `router.delete("/:id", ...)` so full paths are `/api/pipelines`, `/api/pipelines/:id`.
- [ ] **Integration tests for pipeline CRUD**
  - [ ] **Step 10:** Create `src/routes/pipelines.integration.test.ts` or in `tests/`.
  - [ ] **Step 11:** Use real Postgres (DATABASE_URL) or skip if not set.
  - [ ] **Step 12:** Before each test: clean pipelines table or use unique names.
  - [ ] **Step 13:** Test create: POST with valid body, expect 201, body has `slug`, `id`.
  - [ ] **Step 14:** Test list: GET, expect array.
  - [ ] **Step 15:** Test get by id: use id from create, expect 200.
  - [ ] **Step 16:** Test update: PUT with new name, expect 200 with updated data.
  - [ ] **Step 17:** Test delete: DELETE, then GET same id, expect 404.
  - [ ] **Step 18:** Test 401: send request without `Authorization` or `X-API-Key`, expect 401.

---

### 1.9 Subscriber Service

- [ ] **Create `src/services/subscriber.ts`** (or add to pipeline.ts)
  - [ ] **Step 1:** Create file `src/services/subscriber.ts`.
  - [ ] **Step 2:** Implement `addSubscriber(pipelineId, url, headers?)`:
    - [ ] Assert db connection.
    - [ ] Validate URL format: `new URL(url)` or regex for http(s) URL.
    - [ ] Insert: `db.insert(subscribers).values({ pipelineId, url, headers: headers ?? null }).returning()`.
    - [ ] Return subscriber row.
    - [ ] Optionally verify pipeline exists first; if not, throw or return null.
  - [ ] **Step 3:** Implement `removeSubscriber(pipelineId, subscriberId)`:
    - [ ] Delete where `subscriberId` AND `pipelineId` match (ensures ownership): `db.delete(subscribers).where(and(eq(subscribers.id, subscriberId), eq(subscribers.pipelineId, pipelineId))).returning()`.
    - [ ] Return deleted row or null.
  - [ ] **Step 4:** Implement `getSubscribersByPipelineId(pipelineId)`:
    - [ ] `db.select().from(subscribers).where(eq(subscribers.pipelineId, pipelineId))`.
    - [ ] Return array.

---

### 1.10 Subscriber Routes

- [ ] **Add subscriber endpoints**
  - [ ] **Step 1:** In `src/routes/pipelines.ts` or new `src/routes/subscribers.ts`, add nested routes.
  - [ ] **Step 2:** `POST /api/pipelines/:id/subscribers`:
    - [ ] Get `pipelineId` from `req.params.id`.
    - [ ] Call `getPipelineById(pipelineId)`; if null → 404.
    - [ ] Parse body: `{ url, headers? }`.
    - [ ] Validate `url` (required, valid URL format).
    - [ ] Call `addSubscriber(pipelineId, url, headers)`.
    - [ ] Return 201 with subscriber.
  - [ ] **Step 3:** `DELETE /api/pipelines/:id/subscribers/:subscriberId`:
    - [ ] Get `pipelineId`, `subscriberId` from params.
    - [ ] Call `getPipelineById(pipelineId)`; if null → 404.
    - [ ] Call `removeSubscriber(pipelineId, subscriberId)`; if null → 404.
    - [ ] Return 204.
  - [ ] **Step 4:** Mount routes: e.g. `router.post("/:id/subscribers", ...)` and `router.delete("/:id/subscribers/:subscriberId", ...)` on pipelines router.
- [ ] **Integration tests for subscriber CRUD**
  - [ ] **Step 5:** Test add: create pipeline, POST subscriber, expect 201.
  - [ ] **Step 6:** Test add with invalid pipeline id → 404.
  - [ ] **Step 7:** Test add with invalid URL → 400.
  - [ ] **Step 8:** Test remove: add subscriber, DELETE, expect 204.
  - [ ] **Step 9:** Test remove with wrong pipeline id → 404.

---

### 1.11 Job Service (Enqueue Only)

- [ ] **Create `src/services/job.ts`**
  - [ ] **Step 1:** Create file `src/services/job.ts`.
  - [ ] **Step 2:** Import `db`, `assertDbConnection`, `jobs`, `eq`.
  - [ ] **Step 3:** Implement `enqueueJob(pipelineId, payload)`:
    - [ ] Assert db connection.
    - [ ] `payload` is `unknown` (JSON body); store as JSONB.
    - [ ] Insert: `db.insert(jobs).values({ pipelineId, status: "pending", payload }).returning({ id })`.
    - [ ] Return `id` (UUID string).

---

### 1.12 Webhook Ingestion

- [ ] **Create `src/routes/webhooks.ts`**
  - [ ] **Step 1:** Create file `src/routes/webhooks.ts`.
  - [ ] **Step 2:** Create router. Do **not** apply auth middleware (webhooks are unauthenticated).
  - [ ] **Step 3:** `POST /webhooks/:slug`:
    - [ ] `slug = req.params.slug`.
    - [ ] Call `getPipelineBySlug(slug)` (from pipeline service).
    - [ ] If null → `res.status(404).json({ error: "Pipeline not found" })`.
    - [ ] If `!pipeline.isActive` → `res.status(400).json({ error: "Pipeline is inactive" })`.
    - [ ] Parse body: `JSON.parse` or `express.json()` already parsed it. If invalid (caught), → 400.
    - [ ] Call `enqueueJob(pipeline.id, req.body)`.
    - [ ] Return `res.status(202).set("Job-Id", jobId).json({ jobId })` or empty body.
    - [ ] Wrap in try/catch; on DB error → 500.
  - [ ] **Step 4:** Mount: `app.use("/webhooks", webhooksRouter)` — route will be `POST /webhooks/:slug`. Ensure router defines `router.post("/:slug", handler)`.
  - [ ] **Step 5:** Ensure `app.use(express.json())` is before webhooks so body is parsed.
- [ ] **Integration test webhook ingest**
  - [ ] **Step 6:** Create pipeline with transform action, get slug.
  - [ ] **Step 7:** POST `{"foo":"bar"}` to `http://localhost:PORT/webhooks/{slug}`.
  - [ ] **Step 8:** Expect 202, `Job-Id` header present.
  - [ ] **Step 9:** Query jobs table; one job with `status: "pending"`, `payload` matches.
  - [ ] **Step 10:** POST to `/webhooks/nonexistent` → 404.
  - [ ] **Step 11:** POST invalid JSON (e.g. raw `{invalid`) → 400.

---

### 1.13 Docker

- [ ] **Verify/align Dockerfile**
  - [ ] **Step 1:** Ensure multi-stage build: stage 1 builds TS, stage 2 copies dist.
  - [ ] **Step 2:** Builder: `FROM node:24-alpine` (or 22 if preferred), `WORKDIR /app`, `COPY package*.json`, `RUN npm ci`, `COPY .`, `RUN npm run build`.
  - [ ] **Step 3:** Runtime: `FROM node:24-alpine`, `COPY package*.json`, `RUN npm ci --omit=dev`, `COPY --from=builder /app/dist ./dist`, `CMD ["node", "dist/index.js"]`.
  - [ ] **Step 4:** Add `EXPOSE 8080` if using 8080 (Cloud Run).
- [ ] **Verify docker-compose.yml**
  - [ ] **Step 5:** `postgres`: image `postgres:16`, env `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, ports `5432`, volume for persistence, healthcheck.
  - [ ] **Step 6:** `api`: `build: .`, `command: node dist/index.js`, `depends_on: postgres`, env `DATABASE_URL`, `API_KEY`, `PORT`.
  - [ ] **Step 7:** `worker`: same image, `command: node dist/worker.js`, `depends_on: postgres`.
  - [ ] **Step 8:** Run `docker compose build` then `docker compose up` — api and postgres should start.

---

### 1.14 GitHub Actions CI

- [x] **Create `.github/workflows/ci.yml`**
  - [x] On pull_request to main/master
  - [x] Node via `.nvmrc`, `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`
  - [x] `npm ci`, `npm test`, `npm run test:coverage`
  - [x] Style job: format:check, lint
- [x] **CD workflow** (`.github/workflows/cd.yml`) — deploy to GCP Cloud Run on push to main
  - [ ] **Note:** CI runs unit tests only; no Postgres service for integration tests. Add `DATABASE_URL`/Postgres service if integration tests require it.

---

### 1.15 Base Tests Summary

- **Unit tests** (partial)
  - [x] Config parsing (`config.test.ts`)
  - [x] DB helpers (`db/db.test.ts`)
  - [ ] **Auth validation** (`src/auth/validate.test.ts`)
    - [ ] **Step 1:** Create test file. Use `describe("validateAuth", () => { ... })`.
    - [ ] **Step 2:** Mock or set `process.env.API_KEY = "secret"` in beforeEach; restore in afterEach.
    - [ ] **Step 3:** Build mock req: `{ headers: { authorization: "Bearer secret" } }`. Call `validateAuth(mockReq)`. Expect `{ valid: true, identity: { type: "api_key" } }`.
    - [ ] **Step 4:** Same with `headers: { "x-api-key": "secret" }`.
    - [ ] **Step 5:** `headers: {}` → `{ valid: false }`.
    - [ ] **Step 6:** Wrong key → `{ valid: false }`.
  - [ ] **Slug generation and validation** (`src/lib/slug.test.ts`)
    - [ ] **Step 1:** Test `generateSlug("My Stripe Orders")` → `"my-stripe-orders"`.
    - [ ] **Step 2:** Test `generateSlug("  spaces  ")` → `"spaces"`.
    - [ ] **Step 3:** Test `validateSlug("valid-slug")` → true, `validateSlug("Invalid")` → false.
  - [ ] **Action config parsing** (optional) — validate in pipeline service; add unit test for validation helper if extracted.
- **Integration tests** (partial)
  - [x] DB integration (`db/db.integration.test.ts` — conditional on DATABASE_URL)
  - [x] Smoke test (`smoke.test.ts`)
  - [ ] **Health endpoint**: `GET /api/healthz` → 200, body "OK".
  - [ ] **Pipeline CRUD**: See 1.8 Step 10–18.
  - [ ] **Subscriber CRUD**: See 1.10 Step 5–9.
  - [ ] **Webhook ingestion**: See 1.12 Step 6–11.
  - [ ] **401 on protected routes**: Request without API key → 401.

---

### Phase 1 Complete When

- [ ] **Step 1:** Run `docker compose up` — api and postgres start without error.
- [ ] **Step 2:** Create pipeline via `POST /api/pipelines` (with API key).
- [ ] **Step 3:** Add subscriber via `POST /api/pipelines/:id/subscribers`.
- [ ] **Step 4:** POST JSON body to `POST /webhooks/:slug`.
- [ ] **Step 5:** Verify job exists in DB with `status: "pending"`.
- [x] **Step 6:** CI passes

---

## Phase 2: Worker Skeleton (branch `feat/worker`)

- [ ] **Create branch:** `git checkout -b feat/worker`

---

### 2.1 Worker Entry Point

- [ ] **Create `src/worker.ts`**
  - [ ] Import config, db
  - [ ] Start infinite loop (or use a simple `while(true)` with poll + process)
  - [ ] On error, log and continue (don't crash)

---

### 2.2 Job Poller

- [ ] **Add to `src/services/job.ts`**
  - [ ] `claimNextJob()` — `SELECT ... FROM jobs WHERE status = 'pending' FOR UPDATE SKIP LOCKED LIMIT 1`
  - [ ] Update status to `processing`, set `processing_started_at`
  - [ ] Return job or null
- [ ] **Handle transaction** so claim is atomic

---

### 2.3 Action Dispatcher

- [ ] **Create `src/services/actions/index.ts`**
  - [ ] `runAction(actionType, actionConfig, payload): Promise<{ result: unknown } | { filtered: true }>`
  - [ ] Switch on actionType → call transform, filter, or template
  - [ ] Filter returns `{ filtered: true }` when event is dropped

---

### 2.4 Transform Action (Real)

- [ ] **Create `src/services/actions/transform.ts`**
  - [ ] Parse `action_config.mappings` — array of `{ from, to, optional? }`
  - [ ] For each mapping: get value at path `from` (e.g. lodash get or custom)
  - [ ] If not optional and missing → throw or return error
  - [ ] Set value at path `to` in output object
  - [ ] Return transformed object
- [ ] **Unit test transform**
  - [ ] Simple field rename
  - [ ] Optional field missing → no error
  - [ ] Required field missing → error

---

### 2.5 Filter Action (Stub)

- [ ] **Create `src/services/actions/filter.ts`**
  - [ ] Export `run(config, payload)` — throw "Not implemented" or return `{ filtered: true }` always

---

### 2.6 Template Action (Stub)

- [ ] **Create `src/services/actions/template.ts`**
  - [ ] Export `run(config, payload)` — throw "Not implemented"

---

### 2.7 Delivery Stub

- [ ] **Create `src/lib/delivery.ts`**
  - [ ] `deliverToSubscribers(pipeline, result, jobId): Promise<void>` — no-op (do nothing)
  - [ ] Define `DeliverySigner` interface for future HMAC; v1 no-op

---

### 2.8 Worker Processing Loop

- [ ] **Implement full loop in `src/worker.ts`**
  - [ ] Call `claimNextJob()`
  - [ ] If null, sleep (e.g. 1s) and continue
  - [ ] Fetch pipeline (with subscribers) by job.pipeline_id
  - [ ] Call `runAction(pipeline.action_type, pipeline.action_config, job.payload)`
  - [ ] If `{ filtered: true }` → update job status `filtered`, set `processing_ended_at`
  - [ ] Else → store result in job.result, call `deliverToSubscribers` (stub), update status `completed`, set `processing_ended_at`
  - [ ] On error → update status `failed`, set `processing_ended_at`, log
- [ ] **Integration test**
  - [ ] Create pipeline with action_type transform, enqueue job, run worker, verify job completed with result

---

### Phase 2 Complete When

- [ ] Worker processes transform jobs end-to-end (result stored, status completed)
- [ ] Filter/template throw when used (acceptable for now)
- [ ] Merge `feat/worker` into `main`

---

## Phase 3a: Filter Action (branch `feat/filter`)

- [ ] **Create branch:** `git checkout main && git pull && git checkout -b feat/filter`

---

### 3a.1 Implement Filter

- [ ] **Implement `src/services/actions/filter.ts`**
  - [ ] Parse `action_config.conditions` — array of `{ path, operator, value }`
  - [ ] Operators: `eq`, `neq`, `exists`, `contains`
  - [ ] Get value at path from payload (e.g. `payload.event.type`)
  - [ ] Evaluate each condition (AND)
  - [ ] If all match → return `{ result: payload }` (keep)
  - [ ] If any fail → return `{ filtered: true }` (drop)
- [ ] **Unit tests**
  - [ ] `eq` matches
  - [ ] `eq` no match → filtered
  - [ ] `neq` matches
  - [ ] `exists` for present/missing
  - [ ] `contains` for string/array
  - [ ] Multiple conditions ANDed

---

### Phase 3a Complete When

- [ ] Filter action works; dropped events mark job `filtered`
- [ ] Merge `feat/filter` into `main`

---

## Phase 3b: Template Action (branch `feat/template`)

- [ ] **Create branch:** `git checkout main && git pull && git checkout -b feat/template`

---

### 3b.1 Implement Template

- [ ] **Implement `src/services/actions/template.ts`**
  - [ ] Parse `action_config.template` — string with `{{path}}` placeholders
  - [ ] Replace each `{{x.y.z}}` with value from payload at path
  - [ ] Use mustache lib or custom regex
  - [ ] Return `{ result: { text: renderedString } }` or similar (design: template produces a string; store as `{ text: "..." }`)
- [ ] **Unit tests**
  - [ ] Simple `{{name}}` replacement
  - [ ] Nested `{{user.email}}`
  - [ ] Missing path → empty string or error (define behavior)

---

### Phase 3b Complete When

- [ ] Template action works
- [ ] Merge `feat/template` into `main`

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
