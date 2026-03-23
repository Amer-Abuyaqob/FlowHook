# FlowHook API Documentation

RESTful JSON API for the FlowHook webhook pipeline service. All API endpoints use `application/json` for request and response bodies unless noted.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Format](#error-format)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Pipelines](#pipelines)
  - [Subscribers](#subscribers)
  - [Jobs](#jobs)
  - [Webhooks](#webhooks)
- [Action Config Shapes](#action-config-shapes)
- [Static Assets](#static-assets)

---

## Base URL

```
http://localhost:{PORT}
```

Replace `{PORT}` with your configured port (default: `3000`).

---

## Authentication

FlowHook uses API key authentication for protected endpoints:

### API Key (Bearer or Header)

Used for pipeline CRUD, job queries, and subscriber management. Set via `API_KEY` environment variable.

```http
Authorization: Bearer <API_KEY>
```

Alternatively:

```http
X-API-Key: <API_KEY>
```

### Unprotected Routes

No authentication required for:

- `GET /api/healthz` — Health check
- `POST /webhooks/:slug` — Webhook ingestion (slug identifies the pipeline)

---

## Error Format

All error responses (4xx, 5xx) return JSON:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| 400    | Bad Request – Invalid or missing input          |
| 401    | Unauthorized – Missing or invalid credentials   |
| 403    | Forbidden – Valid credentials but not allowed   |
| 404    | Not Found – Resource does not exist             |
| 409    | Conflict – State conflict (e.g. duplicate slug) |
| 500    | Internal Server Error – Unexpected server error |

---

## Endpoints

### Health

#### `GET /api/healthz`

Readiness/health check. Returns `OK` as plain text.

| Auth | Response                |
| ---- | ----------------------- |
| None | 200 – `OK` (plain text) |

---

### Pipelines

All pipeline endpoints require API key authentication.

#### `POST /api/pipelines`

Create a new pipeline. Returns the full pipeline including `slug` and `webhookUrl`.

**Request body:**

```json
{
  "name": "My Stripe Orders",
  "action_type": "transform",
  "action_config": {
    "mappings": [
      { "from": "firstName", "to": "first_name" },
      { "from": "lastName", "to": "last_name", "optional": true }
    ]
  }
}
```

| Field         | Type   | Required | Notes                                                         |
| ------------- | ------ | -------- | ------------------------------------------------------------- |
| name          | string | Yes      | Non-empty; used to generate slug (lowercase, hyphens)         |
| action_type   | string | Yes      | One of `transform`, `filter`, `template`                      |
| action_config | object | Yes      | Shape depends on action_type (see Action Config Shapes below) |

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "my-stripe-orders",
  "name": "My Stripe Orders",
  "action_type": "transform",
  "action_config": { "mappings": [...] },
  "is_active": true,
  "created_at": "2025-03-14T12:00:00.000Z",
  "updated_at": "2025-03-14T12:00:00.000Z",
  "webhookUrl": "http://localhost:3000/webhooks/my-stripe-orders"
}
```

| Status | Error message                                     |
| ------ | ------------------------------------------------- |
| 201    | Created                                           |
| 400    | `Invalid request`, `name is required`, etc.       |
| 401    | `Authorization header is required`, etc.          |
| 409    | `Slug already in use` (if collision after append) |

---

#### `GET /api/pipelines`

List all pipelines.

| Auth    | Response                             |
| ------- | ------------------------------------ |
| API key | 200 – JSON array of pipeline objects |

---

#### `GET /api/pipelines/:id`

Get a single pipeline by ID.

| Auth    | Response                   |
| ------- | -------------------------- |
| API key | 200 – Pipeline object      |
| API key | 404 – `Pipeline not found` |

---

#### `PUT /api/pipelines/:id`

Update a pipeline. All fields are optional (partial update).

**Request body:**

```json
{
  "name": "Updated Name",
  "action_type": "filter",
  "action_config": { "conditions": [...] },
  "is_active": false
}
```

| Status | Error message                            |
| ------ | ---------------------------------------- |
| 200    | Success (returns updated pipeline)       |
| 400    | `Invalid request`                        |
| 401    | `Authorization header is required`, etc. |
| 404    | `Pipeline not found`                     |

---

#### `DELETE /api/pipelines/:id`

Delete a pipeline. Cascades to subscribers and related jobs.

| Auth    | Response                   |
| ------- | -------------------------- |
| API key | 204 – No Content           |
| API key | 404 – `Pipeline not found` |

---

### Subscribers

Manage destination URLs for a pipeline. All require API key.

#### `POST /api/pipelines/:id/subscribers`

Add a subscriber (destination URL) to a pipeline.

**Request body:**

```json
{
  "url": "https://example.com/webhook",
  "headers": {
    "Authorization": "Bearer your-secret",
    "X-Custom-Header": "value"
  }
}
```

| Field   | Type   | Required | Notes                              |
| ------- | ------ | -------- | ---------------------------------- |
| url     | string | Yes      | Valid http(s) URL                  |
| headers | object | No       | Optional key-value headers to send |

**Response (201):**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "pipeline_id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com/webhook",
  "headers": { "Authorization": "Bearer your-secret" },
  "created_at": "2025-03-14T12:00:00.000Z"
}
```

| Status | Error message                            |
| ------ | ---------------------------------------- |
| 201    | Created                                  |
| 400    | `URL is required`, `Invalid URL format`  |
| 401    | `Authorization header is required`, etc. |
| 404    | `Pipeline not found`                     |

---

#### `DELETE /api/pipelines/:id/subscribers/:subscriberId`

Remove a subscriber from a pipeline.

| Auth    | Response                                             |
| ------- | ---------------------------------------------------- |
| API key | 204 – No Content                                     |
| API key | 404 – `Pipeline not found` or `Subscriber not found` |

---

### Jobs

Query job status and results. All require API key.

#### `GET /api/jobs`

List jobs with optional filters.

**Query parameters:**

| Name       | Type   | Required | Default | Description                                                |
| ---------- | ------ | -------- | ------- | ---------------------------------------------------------- |
| pipelineId | string | No       | —       | Filter by pipeline UUID                                    |
| status     | string | No       | —       | `pending`, `processing`, `completed`, `filtered`, `failed` |
| limit      | number | No       | 50      | Max results                                                |
| offset     | number | No       | 0       | Pagination offset                                          |

**Example:** `GET /api/jobs?pipelineId=550e8400-e29b-41d4-a716-446655440000&status=completed&limit=10`

**Response (200):**

```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "pipeline_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "payload": { "event": "order.created", "amount": 99 },
    "result": { "first_name": "Jane", "amount": 99 },
    "created_at": "2025-03-14T12:00:00.000Z",
    "updated_at": "2025-03-14T12:00:05.000Z",
    "processing_started_at": "2025-03-14T12:00:01.000Z",
    "processing_ended_at": "2025-03-14T12:00:05.000Z"
  }
]
```

---

#### `GET /api/jobs/:id`

Get a single job by ID, including delivery attempts.

**Response (200):**

Same shape as job object in list, plus `delivery_attempts` array:

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "pipeline_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "payload": { ... },
  "result": { ... },
  "created_at": "...",
  "updated_at": "...",
  "processing_started_at": "...",
  "processing_ended_at": "...",
  "delivery_attempts": [
    {
      "id": "...",
      "subscriber_id": "...",
      "attempt_number": 1,
      "status_code": 200,
      "success": true,
      "error_message": null,
      "created_at": "..."
    }
  ]
}
```

| Status | Error message   |
| ------ | --------------- |
| 200    | Success         |
| 404    | `Job not found` |

---

### Webhooks

#### `POST /webhooks/:slug`

Ingest a webhook payload. **No authentication** — the slug identifies the pipeline. Returns 202 immediately after enqueueing; processing runs asynchronously in the worker.

**Path parameters:**

| Name | Type   | Required | Description                             |
| ---- | ------ | -------- | --------------------------------------- |
| slug | string | Yes      | Pipeline slug (e.g. `my-stripe-orders`) |

**Request body:** Valid JSON (arbitrary shape). Processed according to pipeline action config.

**Response (202):**

```json
{
  "jobId": "770e8400-e29b-41d4-a716-446655440002"
}
```

Optional `Job-Id` header: same UUID for programmatic retrieval.

| Status | Error message                               |
| ------ | ------------------------------------------- |
| 202    | Accepted (job enqueued)                     |
| 400    | `Invalid JSON`, `Pipeline is inactive`      |
| 404    | `Pipeline not found`                        |
| 500    | `Internal Server Error` (DB/insert failure) |

---

## Action Config Shapes

### transform

Renames or reshapes JSON fields.

```json
{
  "mappings": [
    { "from": "firstName", "to": "first_name" },
    { "from": "lastName", "to": "last_name", "optional": true }
  ]
}
```

| Field    | Type   | Notes                                 |
| -------- | ------ | ------------------------------------- |
| mappings | array  | Required                              |
| from     | string | Source key or path                    |
| to       | string | Target key in output                  |
| optional | bool   | If true, missing source does not fail |

---

### filter

Keeps or drops events based on conditions. All conditions are ANDed.

```json
{
  "conditions": [
    { "path": "event.type", "operator": "eq", "value": "order.created" },
    { "path": "amount", "operator": "exists" }
  ]
}
```

| Field      | Type   | Notes                                      |
| ---------- | ------ | ------------------------------------------ |
| conditions | array  | Required                                   |
| path       | string | Dot-notation path (e.g. `event.type`)      |
| operator   | string | `eq`, `neq`, `exists`, `contains`          |
| value      | any    | Used for eq, neq, contains; not for exists |

Dropped events → job status `filtered`, `result` is null.

---

### template

Renders a string from payload placeholders (Mustache-style `{{path}}`).

```json
{
  "template": "New order from {{customer.name}}: {{amount}}"
}
```

| Field    | Type   | Notes                                       |
| -------- | ------ | ------------------------------------------- |
| template | string | Required; `{{x.y.z}}` replaced from payload |

Output is a string; subscribers receive `{"body": "..."}` or similar wrapped result depending on implementation.

---

## Static Assets

#### `GET /` and `GET /app` and `GET /app/*`

- `/` redirects to `/app/`.
- `/app` and `/app/*` serve static files from the web UI.

| Auth | Response                                       |
| ---- | ---------------------------------------------- |
| None | 200 – Static file (HTML, etc.) or 302 redirect |

---

_Last updated: March 2026_
