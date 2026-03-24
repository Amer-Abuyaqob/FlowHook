# FlowHook Error Inventory

This file inventories the current client-facing API error responses (`{ "error": "..." }`)
and maps each one to the workspace-wide error message policy implemented by
`src/http/errorMiddleware.ts` + `src/http/errorMessagePolicy.ts`.

## 1) Message policy (status -> client message)

These rules are applied centrally:

- `400 Invalid JSON` for malformed JSON bodies (`SyntaxError`)
- `401 Unauthorized` for `UserNotAuthenticatedError` (message is not trusted)
- `403 Forbidden` for `UserForbiddenError` (message is not trusted)
- `404/409/400 (BadRequest/NotFound/Conflict)` return the original error `.message`
- `500 Internal Server Error` for unknown/non-client errors

## 2) Inventory of currently produced messages

### 401 Unauthorized

- `Unauthorized` (from `src/auth/authMiddleware.ts` -> `UserNotAuthenticatedError`)

### 404 Not Found

- `Pipeline not found` (from `NotFoundError("Pipeline not found")`)
  - `src/routes/pipelines.ts`, `src/services/pipeline.ts`, `src/routes/webhooks.ts`
- `Subscriber not found` (from `NotFoundError("Subscriber not found")`)
  - `src/routes/subscribers.ts`
- `Job not found` (from `NotFoundError("Job not found")`)
  - `src/routes/jobs.ts`

### 400 Bad Request

- `Invalid JSON` (from Express body parsing -> `SyntaxError`)
- `Invalid request` (from multiple validators)
  - `src/lib/subscriberValidation.ts` (`Invalid request`)
  - `src/routes/jobs.ts` (`assertValidUuid(..., "Invalid request")`)
  - `src/lib/pipelineValidation.ts` / `src/lib/validation.ts` (`Invalid request` on malformed shapes)
- `Invalid pipelineId` (from `src/lib/jobQueryValidation.ts`)
- `URL is required` (from `src/lib/subscriberValidation.ts`)
- `Invalid URL format` (from `src/lib/validation.ts` default URL error)
- `Pipeline is inactive` (from `src/routes/webhooks.ts`)
- Pipeline create/update validation messages (from `src/lib/pipelineValidation.ts` and `src/lib/actionConfig.ts`), including:
  - `name is required`
  - `name must be non-empty`
  - `name must be a string`
  - `action_type is required`
  - `action_config is required`
  - `action_config must be an object`
  - `is_active must be a boolean`
  - `Invalid action_type`
  - `action_type must be a string`
  - `action_type must be one of: transform, filter, template`
  - Action-config-specific shapes (examples):
    - `transform action_config must have a non-empty mappings array`
    - `filter action_config must have a conditions array`
    - `template action_config must have a template string`
    - `template action_config.template must be non-empty`
    - `transform mappings[${i}].from must be a string`
    - `filter conditions[${i}].operator must be one of: eq, neq, exists, contains`

### 409 Conflict

No production code paths currently emit `ConflictError` in the routes covered by the integration tests;
`409` is reserved by `src/http/errorMiddleware.ts` in case `ConflictError` is introduced later.

### 500 Internal Server Error

- `Internal Server Error` (from unknown/non-Error failures)

### 403 Forbidden

- `Forbidden` (from `src/http/errorMessagePolicy.ts` -> `UserForbiddenError`)
