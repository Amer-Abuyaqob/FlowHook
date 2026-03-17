# FlowHook Design Decisions

Design decisions and Q1–Q5 answers for the FlowHook webhook-driven task processing pipeline (FTS X Boot.dev Backend Internship Final Project).

---

## Decisions Summary

| Topic         | Choice                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Actions       | JSON transform, Filter, Template render                                                 |
| Queue         | Postgres-backed (jobs table + worker polling)                                           |
| Auth          | API keys (single global for v1; design for multiple keys later)                         |
| Delivery      | POST JSON + Custom headers per subscriber (design for HMAC signing)                     |
| Inbound       | Validate first, then 202; 4xx/5xx on failure                                            |
| API key model | Single global key from env; design for per-project keys                                 |
| Webhook URL   | Slugs                                                                                   |
| Slug          | Auto-generated from pipeline name; strict format (lowercase, letters, numbers, hyphens) |

---

## Q1: Processing Actions

**Choice:** JSON transform, Filter, Template render

- **JSON transform** – rename/add/remove fields based on config
- **Filter events** – keep or drop events based on conditions
- **Template render** – fill a string template with payload data

---

## Q2: Queue Approach

**Choice:** Postgres-backed (table + worker polling)

- Jobs stored in a `jobs` table
- Worker polls for pending jobs with row locking
- No Redis or other services required

---

## Q3: Auth for Management API

**Choice:** API keys (abstracted for easy JWT switch later)

- `validateAuth(req)` returns `Identity`; v1 uses API key lookup
- Design allows swapping to JWT without changing route handlers
- Single global key from env for v1; structure supports multiple keys per project later

---

## Q4: Subscriber Delivery

**Choice:** POST JSON + Custom headers per subscriber (design for HMAC later)

- HTTP POST with `Content-Type: application/json`
- Per-subscriber headers (e.g. `Authorization`) stored in DB
- Delivery signer interface planned for future HMAC signing

---

## Q5: Inbound Webhook Response

**Choice:** Validate first, then 202

- Validate pipeline exists and is active
- Validate body is valid JSON (when required)
- Return 202 on success; 4xx/5xx on validation or enqueue failure

---

## Additional Decisions

### API Key Model

- **v1:** Single global API key from env
- **Future:** Structure supports `api_keys` and `projects` tables, pipelines scoped by project

### Webhook URL Format

- Use slugs (e.g. `/webhooks/my-stripe-orders`)
- Slug auto-generated from pipeline name
- Strict format: lowercase letters, numbers, hyphens only
- Collision handling: append `-1`, `-2`, etc. until unique
