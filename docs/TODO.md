# FlowHook — Full TODO Tree

Deeply detailed step-by-step checklist. Work top-to-bottom within each phase. Check off items as you complete them.

---

## PreRequirements

Complete these before creating the FlowHook project. They set up your machine and tools.

**Environment:** Ubuntu via WSL (Windows Subsystem for Linux). Commands below are for Ubuntu/WSL.

### Node.js

- **Choose Node version**
  - Use Node 24 LTS (Krypton) — Active LTS, recommended for production
- **`.nvmrc`:** The project uses `.nvmrc` with `24`. Run `nvm use` when entering the project.
- **Install Node.js on Ubuntu/WSL**
  - **Option A — nvm:** `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash` → restart terminal → `nvm install 24` → `nvm use 24`
  - **Option B — NodeSource apt:** `curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -` then `sudo apt install -y nodejs`
- **Verify:** `node -v` and `npm -v`

### PostgreSQL

- **Choose Postgres version**
  - Postgres 14+ (16 recommended)
- **Install PostgreSQL on Ubuntu/WSL**
  - **Option A — Docker:** `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`
  - **Option B — Local apt:** `sudo apt update && sudo apt install -y postgresql postgresql-contrib` then `sudo service postgresql start`
- **Verify:** `psql -U postgres -c "SELECT 1"` (or `sudo -u postgres psql -c "SELECT 1"` for local install)

### Git

- **Install Git on Ubuntu/WSL:** `sudo apt update && sudo apt install -y git`
- **Verify:** `git --version`

### Docker (optional but recommended)

- **Install Docker on Ubuntu/WSL**
  - **Option A:** [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) with WSL 2 backend
  - **Option B:** Docker Engine inside WSL — [Docker Ubuntu install guide](https://docs.docker.com/engine/install/ubuntu/)
- **Verify:** `docker --version` and `docker compose version`

### GitHub Actions Node deprecation

- **Note:** GitHub Actions deprecates Node 20 on runners (June 2026). Add `env: FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` to your CI workflow to silence the warning and future-proof.

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

- **Create FlowHook workspace/repo**
  - Create new folder or clone empty repo
  - Initialize git: `git init`
  - Add `.gitignore` (node_modules, dist, .env, etc.)
- **Verify PreRequirements**
  - Node, Postgres, Git (and Docker if using) are installed and working

---

## Phase 1: Base (on `main`)

### 1.1 Project Init

- **Initialize Node project**
  - Run `npm init -y`
  - Set `"name": "flowhook"` in package.json
  - Add `"type": "module"` if using ESM
  - Create `.nvmrc` with `24` (run `nvm use` to switch to Node 24 LTS)
- **Install dependencies** (versions for Node 24 LTS)
  - `npm install express@^5.2.0 drizzle-orm@^0.45.0 pg@^8.13.0`
  - `npm install -D typescript@^5.7.0 @types/node@^24 @types/express tsx@^4.19.0 drizzle-kit@^0.31.0 vitest@^4.1.0`
- **Configure TypeScript**
  - Create `tsconfig.json` with `target: "ES2022"`, `module: "NodeNext"`, `outDir: "dist"`
  - Add `"strict": true`
- **Add npm scripts**
  - `"build": "tsc"`
  - `"start": "node dist/index.js"`
  - `"worker": "node dist/worker.js"`
  - `"dev": "tsx watch src/index.ts"`
  - `"test": "vitest"`
- **Create folder structure**
  - `src/`
  - `src/db/`
  - `src/auth/`
  - `src/routes/`
  - `src/services/`
  - `src/services/actions/`
  - `src/lib/`
  - `tests/` or `src/__tests__/`

---

### 1.2 Config

- **Create `src/config.ts`**
  - Read `PORT` from env (default 3000)
  - Read `DATABASE_URL` from env
  - Read `API_KEY` from env
  - Export typed config object
- **Create `.env.example`**
  - `PORT=3000`
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/flowhook`
  - `API_KEY=your-secret-key`

---

### 1.3 DB Schema + Migrations

- **Create Drizzle schema `src/db/schema.ts`**
  - Define `pipelines` table
    - `id` UUID PK, default `gen_random_uuid()`
    - `slug` TEXT UNIQUE NOT NULL
    - `name` TEXT NOT NULL
    - `action_type` TEXT (`transform` | `filter` | `template`)
    - `action_config` JSONB
    - `is_active` BOOLEAN default true
    - `created_at` TIMESTAMPTZ
    - `updated_at` TIMESTAMPTZ
  - Define `subscribers` table
    - `id` UUID PK
    - `pipeline_id` UUID FK → pipelines
    - `url` TEXT NOT NULL
    - `headers` JSONB
    - `created_at` TIMESTAMPTZ
  - Define `jobs` table
    - `id` UUID PK
    - `pipeline_id` UUID FK → pipelines
    - `status` TEXT (`pending` | `processing` | `completed` | `filtered` | `failed`)
    - `payload` JSONB
    - `result` JSONB
    - `created_at` TIMESTAMPTZ
    - `updated_at` TIMESTAMPTZ
    - `processing_started_at` TIMESTAMPTZ
    - `processing_ended_at` TIMESTAMPTZ
  - Define `delivery_attempts` table
    - `id` UUID PK
    - `job_id` UUID FK → jobs
    - `subscriber_id` UUID FK → subscribers
    - `attempt_number` INT
    - `status_code` INT
    - `success` BOOLEAN
    - `error_message` TEXT
    - `created_at` TIMESTAMPTZ
- **Create `src/db/index.ts`**
  - Initialize Drizzle client with `DATABASE_URL`
  - Export `db` and schema
- **Configure Drizzle**
  - Create `drizzle.config.ts` pointing to schema
  - Add `"db:generate": "drizzle-kit generate"` and `"db:migrate": "drizzle-kit migrate"` scripts
- **Generate and run migration**
  - Run `npm run db:generate`
  - Run `npm run db:migrate` (or `drizzle-kit push` for dev)

---

### 1.4 Health Endpoint

- **Create `src/routes/health.ts`**
  - `GET /api/healthz` → returns plain text `OK`
- **Wire up in main server**
  - Create `src/index.ts` (Express app)
  - Mount health route
  - Listen on `PORT`

---

### 1.5 Auth Middleware

- **Create `src/auth/validate.ts`**
  - Define `Identity` interface (e.g. `{ type: 'api_key' }`)
  - Implement `validateAuth(req): Promise<{ valid: boolean; identity?: Identity }>`
  - Check `Authorization: Bearer <API_KEY>` header
  - Check `X-API-Key: <API_KEY>` header (fallback)
  - Compare against `process.env.API_KEY`
- **Create auth middleware**
  - Middleware that calls `validateAuth`; if invalid, return 401
  - Attach `identity` to `req` for downstream use
- **Unit test auth**
  - Test: valid Bearer token returns valid
  - Test: valid X-API-Key returns valid
  - Test: missing/invalid key returns invalid

---

### 1.6 Slug Library

- **Create `src/lib/slug.ts`**
  - `generateSlug(name: string): string` — lowercase, replace spaces/special with `-`, collapse hyphens, trim
  - `validateSlug(slug: string): boolean` — regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`
  - `ensureUniqueSlug(slug: string, db): Promise<string>` — append `-1`, `-2` if collision
- **Unit test slug**
  - Test: "My Stripe Orders" → "my-stripe-orders"
  - Test: invalid chars stripped
  - Test: validateSlug rejects bad formats

---

### 1.7 Pipeline Service

- **Create `src/services/pipeline.ts`**
  - `createPipeline(name, action_type, action_config)` — generate slug, ensure unique, insert
  - `listPipelines()` — select all
  - `getPipelineById(id)` — select by id
  - `getPipelineBySlug(slug)` — select by slug
  - `updatePipeline(id, updates)` — update name/action_type/action_config, refresh updated_at
  - `deletePipeline(id)` — delete pipeline (cascade or handle subscribers)
- **Validate action_config shape** (basic validation per action_type)
  - transform: require `mappings` array
  - filter: require `conditions` array
  - template: require `template` string

---

### 1.8 Pipeline Routes

- **Create `src/routes/pipelines.ts`**
  - `POST /api/pipelines` — create (body: name, action_type, action_config)
    - Validate required fields
    - Call pipeline service create
    - Return 201 with full pipeline including slug and webhook URL
  - `GET /api/pipelines` — list
  - `GET /api/pipelines/:id` — get by id (404 if not found)
  - `PUT /api/pipelines/:id` — update (404 if not found)
  - `DELETE /api/pipelines/:id` — delete (404 if not found)
- **Apply auth middleware** to all pipeline routes
- **Integration tests for pipeline CRUD**
  - Create pipeline, verify slug and response
  - List pipelines
  - Get by id
  - Update pipeline
  - Delete pipeline
  - 401 when no API key

---

### 1.9 Subscriber Service

- **Create subscriber helpers in `src/services/pipeline.ts` or `src/services/subscriber.ts`**
  - `addSubscriber(pipelineId, url, headers?)` — insert into subscribers
  - `removeSubscriber(pipelineId, subscriberId)` — delete (verify pipeline ownership)
  - `getSubscribersByPipelineId(pipelineId)` — for worker use later

---

### 1.10 Subscriber Routes

- **Create `src/routes/pipelines.ts` subscriber endpoints (or separate file)**
  - `POST /api/pipelines/:id/subscribers` — add subscriber (body: url, headers?)
    - 404 if pipeline not found
    - Validate url format
  - `DELETE /api/pipelines/:id/subscribers/:subscriberId` — remove
    - 404 if pipeline or subscriber not found
- **Integration tests for subscriber CRUD**
  - Add subscriber to pipeline
  - Remove subscriber

---

### 1.11 Job Service (Enqueue Only)

- **Create `src/services/job.ts`**
  - `enqueueJob(pipelineId, payload)` — insert job with status `pending`, return job id

---

### 1.12 Webhook Ingestion

- **Create `src/routes/webhooks.ts`**
  - `POST /webhooks/:slug` — no auth
  - Parse slug from path
  - Fetch pipeline by slug
  - If not found → 404
  - If not active → 400
  - Parse body as JSON; if invalid → 400
  - Call `enqueueJob(pipelineId, payload)`
  - Return 202 with `Job-Id` header
  - On DB error → 500
- **Integration test webhook ingest**
  - Create pipeline, POST to webhook URL → 202, job in DB with pending
  - Invalid slug → 404
  - Invalid JSON → 400

---

### 1.13 Docker

- **Create `Dockerfile`**
  - FROM node:24-alpine
  - WORKDIR /app
  - COPY package.json ./
  - RUN npm ci --only=production
  - COPY dist ./dist
  - CMD ["node", "dist/index.js"]
- **Create `docker-compose.yml`**
  - Service `postgres`: image postgres:16, env POSTGRES_USER/PASSWORD/DB, volume for data
  - Service `api`: build from Dockerfile, command `node dist/index.js`, depends_on postgres, env DATABASE_URL, API_KEY, PORT
  - Service `worker`: same image, command `node dist/worker.js`, depends_on postgres (worker will fail until Phase 2 — that's OK)
- **Update Dockerfile for build**
  - Multi-stage or add `npm run build` before CMD
  - Ensure `dist` exists before COPY (build in CI or locally before docker build)

---

### 1.14 GitHub Actions CI

- **Create `.github/workflows/ci.yml`**
  - On push and pull_request to main
  - Checkout code
  - Setup Node with `node-version-file: '.nvmrc'` (or `node-version: '24'`)
  - `npm ci`
  - `npm run build`
  - `npm test` — use Postgres service or test container for integration tests
- **Ensure tests run in CI**
  - Set `DATABASE_URL` for test Postgres in CI
  - Set `API_KEY` for auth tests

---

### 1.15 Base Tests Summary

- **Unit tests**
  - Auth validation
  - Slug generation and validation
  - Action config parsing (optional)
- **Integration tests**
  - Pipeline CRUD (with real Postgres)
  - Subscriber CRUD
  - Webhook ingestion → job enqueued
  - Health endpoint
  - 401 on protected routes without key

---

### Phase 1 Complete When

- `docker compose up` runs api + postgres
- Create pipeline → add subscriber → POST webhook → job exists with status `pending`
- CI passes

---

## Phase 2: Worker Skeleton (branch `feat/worker`)

**Create branch:** `git checkout -b feat/worker`

---

### 2.1 Worker Entry Point

- **Create `src/worker.ts`**
  - Import config, db
  - Start infinite loop (or use a simple `while(true)` with poll + process)
  - On error, log and continue (don't crash)

---

### 2.2 Job Poller

- **Add to `src/services/job.ts`**
  - `claimNextJob()` — `SELECT ... FROM jobs WHERE status = 'pending' FOR UPDATE SKIP LOCKED LIMIT 1`
  - Update status to `processing`, set `processing_started_at`
  - Return job or null
- **Handle transaction** so claim is atomic

---

### 2.3 Action Dispatcher

- **Create `src/services/actions/index.ts`**
  - `runAction(actionType, actionConfig, payload): Promise<{ result: unknown } | { filtered: true }>`
  - Switch on actionType → call transform, filter, or template
  - Filter returns `{ filtered: true }` when event is dropped

---

### 2.4 Transform Action (Real)

- **Create `src/services/actions/transform.ts`**
  - Parse `action_config.mappings` — array of `{ from, to, optional? }`
  - For each mapping: get value at path `from` (e.g. lodash get or custom)
  - If not optional and missing → throw or return error
  - Set value at path `to` in output object
  - Return transformed object
- **Unit test transform**
  - Simple field rename
  - Optional field missing → no error
  - Required field missing → error

---

### 2.5 Filter Action (Stub)

- **Create `src/services/actions/filter.ts`**
  - Export `run(config, payload)` — throw "Not implemented" or return `{ filtered: true }` always

---

### 2.6 Template Action (Stub)

- **Create `src/services/actions/template.ts`**
  - Export `run(config, payload)` — throw "Not implemented"

---

### 2.7 Delivery Stub

- **Create `src/lib/delivery.ts`**
  - `deliverToSubscribers(pipeline, result, jobId): Promise<void>` — no-op (do nothing)
  - Define `DeliverySigner` interface for future HMAC; v1 no-op

---

### 2.8 Worker Processing Loop

- **Implement full loop in `src/worker.ts`**
  - Call `claimNextJob()`
  - If null, sleep (e.g. 1s) and continue
  - Fetch pipeline (with subscribers) by job.pipeline_id
  - Call `runAction(pipeline.action_type, pipeline.action_config, job.payload)`
  - If `{ filtered: true }` → update job status `filtered`, set `processing_ended_at`
  - Else → store result in job.result, call `deliverToSubscribers` (stub), update status `completed`, set `processing_ended_at`
  - On error → update status `failed`, set `processing_ended_at`, log
- **Integration test**
  - Create pipeline with action_type transform, enqueue job, run worker, verify job completed with result

---

### Phase 2 Complete When

- Worker processes transform jobs end-to-end (result stored, status completed)
- Filter/template throw when used (acceptable for now)
- Merge `feat/worker` into `main`

---

## Phase 3a: Filter Action (branch `feat/filter`)

**Create branch:** `git checkout main && git pull && git checkout -b feat/filter`

---

### 3a.1 Implement Filter

- **Implement `src/services/actions/filter.ts`**
  - Parse `action_config.conditions` — array of `{ path, operator, value }`
  - Operators: `eq`, `neq`, `exists`, `contains`
  - Get value at path from payload (e.g. `payload.event.type`)
  - Evaluate each condition (AND)
  - If all match → return `{ result: payload }` (keep)
  - If any fail → return `{ filtered: true }` (drop)
- **Unit tests**
  - `eq` matches
  - `eq` no match → filtered
  - `neq` matches
  - `exists` for present/missing
  - `contains` for string/array
  - Multiple conditions ANDed

---

### Phase 3a Complete When

- Filter action works; dropped events mark job `filtered`
- Merge `feat/filter` into `main`

---

## Phase 3b: Template Action (branch `feat/template`)

**Create branch:** `git checkout main && git pull && git checkout -b feat/template`

---

### 3b.1 Implement Template

- **Implement `src/services/actions/template.ts`**
  - Parse `action_config.template` — string with `{{path}}` placeholders
  - Replace each `{{x.y.z}}` with value from payload at path
  - Use mustache lib or custom regex
  - Return `{ result: { text: renderedString } }` or similar (design: template produces a string; store as `{ text: "..." }`)
- **Unit tests**
  - Simple `{{name}}` replacement
  - Nested `{{user.email}}`
  - Missing path → empty string or error (define behavior)

---

### Phase 3b Complete When

- Template action works
- Merge `feat/template` into `main`

---

## Phase 4: Delivery (branch `feat/delivery`)

**Create branch:** `git checkout main && git pull && git checkout -b feat/delivery`

---

### 4.1 Delivery Implementation

- **Implement `src/lib/delivery.ts`**
  - For each subscriber: POST to `subscriber.url` with `Content-Type: application/json`
  - Body = processed result (JSON.stringify)
  - Add headers from `subscriber.headers` (JSONB)
  - Retry: 3 attempts, exponential backoff (1s, 2s, 4s)
  - On 2xx → success, record in delivery_attempts
  - On failure → record attempt, retry
  - After all retries fail → record final failure
- **Insert delivery_attempts**
  - For each attempt: job_id, subscriber_id, attempt_number, status_code, success, error_message, created_at
- **Wire into worker**
  - Replace delivery stub with real `deliverToSubscribers`
  - Only deliver when job not filtered
  - Mark job `failed` if any subscriber fails after retries? Or `completed` with some failed? (Define: e.g. job completed if at least one delivered, or strict: all must succeed)
- **Unit test retry/backoff**
  - Mock HTTP: first fails, second succeeds
  - Verify backoff timing
- **Integration test**
  - Use mock HTTP server (e.g. nock or local express); verify POST received with correct body and headers

---

### Phase 4 Complete When

- Full flow: webhook → job → action → delivery to subscribers
- delivery_attempts populated
- Retry works on transient failure
- Merge `feat/delivery` into `main`

---

## Phase 5: Job API (branch `feat/job-api`)

**Create branch:** `git checkout main && git pull && git checkout -b feat/job-api`

---

### 5.1 Job Query Service

- **Add to `src/services/job.ts`**
  - `getJobById(id)` — job + delivery_attempts (join or separate query)
  - `listJobs(filters: { pipelineId?, status?, limit?, offset? })` — paginated list

---

### 5.2 Job Routes

- **Create `src/routes/jobs.ts`**
  - `GET /api/jobs/:id` — get job with delivery attempts (404 if not found)
  - `GET /api/jobs` — list with query params pipelineId, status, limit, offset
- **Apply auth middleware**
- **Integration tests**
  - Get job by id
  - List jobs with filters
  - 401 without API key

---

### Phase 5 Complete When

- Job API works
- Merge `feat/job-api` into `main`

---

## Final: Documentation & Polish

- **README.md**
  - Project overview
  - Setup (clone, npm install, .env, db migrate)
  - Run with docker compose
  - API documentation (endpoints, request/response examples)
  - Architecture diagram (reference DESIGN_DECISIONS)
  - Design decisions summary
- **docs/DESIGN_DECISIONS.md** (copy from PlaningFlowHook or adapt)
- **Clean up**
  - Remove console.logs
  - Ensure all tests pass
  - Verify `docker compose up` runs full stack

---

## Quick Reference: Branch Order

| Order | Branch          | From | Merge When                |
| ----- | --------------- | ---- | ------------------------- |
| 1     | `feat/worker`   | main | Transform works           |
| 2     | `feat/filter`   | main | Filter works              |
| 2     | `feat/template` | main | Template works (parallel) |
| 3     | `feat/delivery` | main | Delivery works            |
| 4     | `feat/job-api`  | main | Job API works             |
