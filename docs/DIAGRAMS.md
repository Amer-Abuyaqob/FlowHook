# FlowHook Diagrams (Mermaid)

These diagrams are the single source of truth for FlowHook’s architecture and runtime behavior. They are aligned to the API contract in [docs/API.md](docs/API.md).

- For the phase/branch graphs, see [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).

---

## A) System context (service + data flow)

```mermaid
flowchart TB
    subgraph ExternalSystems[External systems]
        WebhookSender[Webhook sender]
        SubscriberEndpoints[Subscriber URLs]
    end

    subgraph FlowHookService[FlowHook service]
        ApiServer["API server (Express)"]
        WorkerProcess[Worker process]
    end

    PostgresDb[(Postgres database)]

    WebhookSender -->|"POST /webhooks/:slug (no auth)"| ApiServer
    ApiServer -->|"Validate pipeline + enqueue job"| PostgresDb
    ApiServer -->|"202 { jobId }"| WebhookSender

    ApiServer -->|"Protected CRUD + queries (/api/*)"| PostgresDb

    WorkerProcess -->|"Poll pending jobs"| PostgresDb
    WorkerProcess -->|"Run action + update job"| PostgresDb
    WorkerProcess -->|"Deliver result (POST JSON + headers)"| SubscriberEndpoints
    WorkerProcess -->|"Persist delivery_attempts"| PostgresDb
```

---

## B) Auth matrix (public vs protected)

```mermaid
flowchart LR
    Client[Client] --> Routes[FlowHook routes]

    Routes --> PublicRoutes[Public]
    Routes --> ProtectedRoutes[Protected]

    PublicRoutes --> Health["GET /api/healthz"]
    PublicRoutes --> WebhookIngest["POST /webhooks/:slug"]

    ProtectedRoutes --> PipelinesCrud["/api/pipelines*"]
    ProtectedRoutes --> SubscribersCrud["/api/pipelines/:id/subscribers*"]
    ProtectedRoutes --> JobsApi["/api/jobs*"]
```

Auth mechanism for protected routes:

- `Authorization: Bearer <API_KEY>` or `X-API-Key: <API_KEY>`

---

## C) Webhook ingestion sequence (enqueue → 202)

```mermaid
sequenceDiagram
    participant Sender as WebhookSender
    participant Api as FlowHookAPI
    participant Db as PostgresDB

    Sender->>Api: POST /webhooks/:slug (JSON body)
    Api->>Db: SELECT pipeline by slug
    alt pipeline not found
        Api-->>Sender: 404 { error: "Pipeline not found" }
    else pipeline inactive
        Api-->>Sender: 400 { error: "Pipeline is inactive" }
    else invalid JSON
        Api-->>Sender: 400 { error: "Invalid JSON" }
    else ok
        Api->>Db: INSERT job(status=pending, payload, pipeline_id)
        Api-->>Sender: 202 { jobId } (optional Job-Id header)
    end
```

---

## D) Job lifecycle (worker + delivery semantics)

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> processing: worker claims job

    processing --> filtered: filter action drops event

    processing --> completed: action ok + all deliveries succeed
    processing --> failed: any subscriber exhausts retries

    filtered --> [*]
    completed --> [*]
    failed --> [*]
```

Status values are exactly: `pending`, `processing`, `completed`, `filtered`, `failed`.

---

## E) Delivery & retry flow (per subscriber)

```mermaid
flowchart TD
    StartDelivery[Start delivery for job] --> ForEachSubscriber[For each subscriber]
    ForEachSubscriber --> Attempt1[Attempt 1: HTTP POST]

    Attempt1 -->|"2xx"| RecordSuccess[Record delivery_attempts(success=true)]
    Attempt1 -->|"timeout / network / non-2xx"| RecordFailure1[Record delivery_attempts(success=false)]

    RecordFailure1 --> ShouldRetry{Attempts left?}
    ShouldRetry -->|"yes"| Backoff["Wait: baseDelay * 2^(attempt-1)"]
    Backoff --> NextAttempt[Next attempt: HTTP POST]
    NextAttempt -->|"2xx"| RecordSuccess
    NextAttempt -->|"timeout / network / non-2xx"| RecordFailureN[Record delivery_attempts(success=false)]
    RecordFailureN --> ShouldRetry

    ShouldRetry -->|"no"| SubscriberFailed[Subscriber failed (exhausted retries)]

    RecordSuccess --> NextSubscriber[Next subscriber]
    SubscriberFailed --> JobFailed[Mark job failed]
    NextSubscriber --> AllDone{All subscribers done?}
    AllDone -->|"no"| ForEachSubscriber
    AllDone -->|"yes"| JobCompleted[Mark job completed]
```

Retry policy inputs (from env vars):

- `DELIVERY_MAX_ATTEMPTS`
- `DELIVERY_BASE_DELAY_MS`
- `DELIVERY_REQUEST_TIMEOUT_MS`

---

## F) ERD (data model)

```mermaid
erDiagram
    pipelines ||--o{ subscribers : has
    pipelines ||--o{ jobs : creates
    jobs ||--o{ delivery_attempts : records
    subscribers ||--o{ delivery_attempts : targets

    pipelines {
        UUID id PK
        TEXT slug UK
        TEXT name
        TEXT action_type
        JSONB action_config
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    subscribers {
        UUID id PK
        UUID pipeline_id FK
        TEXT url
        JSONB headers
        TIMESTAMPTZ created_at
    }

    jobs {
        UUID id PK
        UUID pipeline_id FK
        TEXT status
        JSONB payload
        JSONB result
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ processing_started_at
        TIMESTAMPTZ processing_ended_at
    }

    delivery_attempts {
        UUID id PK
        UUID job_id FK
        UUID subscriber_id FK
        INT attempt_number
        INT status_code
        BOOLEAN success
        TEXT error_message
        TIMESTAMPTZ created_at
    }
```

---

## G) Docker / local deployment (compose mental model)

```mermaid
flowchart LR
    Dev[Developer] -->|"docker compose up"| Compose[docker compose]

    Compose --> Api["api container (8080)"]
    Compose --> Worker["worker container"]
    Compose --> Db[(postgres container)]

    Api --> Db
    Worker --> Db
```
