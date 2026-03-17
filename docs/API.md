# Chirpy API Documentation

RESTful JSON API for the Chirpy microblogging service. All API endpoints use `application/json` for request and response bodies unless noted.

---

## Base URL

```
http://localhost:{PORT}
```

Replace `{PORT}` with your configured port (default: `8080`).

---

## Authentication

Chirpy uses two authentication schemes:

### Bearer Token (JWT)

Used for user-authenticated requests (chirps, profile updates). Obtain a JWT via `POST /api/login`. JWTs expire after **1 hour**.

```http
Authorization: Bearer <JWT>
```

### Bearer Token (Refresh Token)

Used for `POST /api/refresh` and `POST /api/revoke`. The refresh token is returned on login and is valid for **60 days**.

```http
Authorization: Bearer <refresh-token>
```

### API Key (Polka webhooks)

Used for Polka payment webhooks. Compare against your `POLKA_KEY` environment variable.

```http
Authorization: ApiKey <POLKA_KEY>
```

---

## Error Format

All error responses (4xx, 5xx) return JSON:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Meaning                                          |
| ------ | ------------------------------------------------ |
| 400    | Bad Request – Invalid or missing input           |
| 401    | Unauthorized – Missing or invalid credentials    |
| 403    | Forbidden – Valid credentials but not allowed    |
| 404    | Not Found – Resource does not exist              |
| 409    | Conflict – State conflict (e.g. duplicate email) |
| 500    | Internal Server Error – Unexpected server error  |

**Note:** `POST /api/polka/webhooks` returns `401` with an empty body when the API key is missing or invalid.

---

## Endpoints

### Health & Admin

#### `GET /api/healthz`

Readiness/health check. Returns `OK` as plain text.

| Auth | Response                |
| ---- | ----------------------- |
| None | 200 – `OK` (plain text) |

---

#### `GET /admin/metrics`

Returns an HTML page with the `/app` visit count.

| Auth | Response   |
| ---- | ---------- |
| None | 200 – HTML |

---

#### `POST /admin/reset`

Resets the database (deletes all users and chirps) and the visit counter. **Only available when `PLATFORM=dev`.**

| Auth | Response                                                    |
| ---- | ----------------------------------------------------------- |
| None | 200 – `OK: Everything been reset successfully` (plain text) |
| —    | 403 – `Reset endpoint is only available in development`     |

---

### Users

#### `POST /api/users`

Register a new user.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

| Field    | Type   | Required | Notes              |
| -------- | ------ | -------- | ------------------ |
| email    | string | Yes      | Non-empty; trimmed |
| password | string | Yes      | Non-empty          |

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "isChirpyRed": false,
  "createdAt": "2025-03-14T12:00:00.000Z",
  "updatedAt": "2025-03-14T12:00:00.000Z"
}
```

| Status | Error message                               |
| ------ | ------------------------------------------- |
| 201    | Created                                     |
| 400    | `Email is required`, `Password is required` |
| 409    | `Email already in use`                      |

---

#### `POST /api/login`

Authenticate and receive access and refresh tokens.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "isChirpyRed": false,
  "createdAt": "2025-03-14T12:00:00.000Z",
  "updatedAt": "2025-03-14T12:00:00.000Z",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

| Status | Error message                               |
| ------ | ------------------------------------------- |
| 200    | Success                                     |
| 400    | `Email is required`, `Password is required` |
| 401    | `incorrect email or password`               |

---

#### `PUT /api/users`

Update the authenticated user's email and password. Requires JWT.

**Headers:** `Authorization: Bearer <JWT>`

**Request body:**

```json
{
  "email": "newemail@example.com",
  "password": "new-password"
}
```

**Response (200):**

Same shape as user object (id, email, isChirpyRed, createdAt, updatedAt).

| Status | Error message                               |
| ------ | ------------------------------------------- |
| 200    | Success                                     |
| 400    | `Email is required`, `Password is required` |
| 401    | `Authorization header is required`, etc.    |
| 404    | `User not found`                            |
| 409    | `Email already in use`                      |

---

### Auth (Token management)

#### `POST /api/refresh`

Exchange a valid refresh token for a new JWT access token. Requires refresh token in `Authorization: Bearer`.

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Status | Error message                                                                |
| ------ | ---------------------------------------------------------------------------- |
| 200    | Success                                                                      |
| 401    | `Invalid or expired refresh token`, `Authorization header is required`, etc. |

---

#### `POST /api/revoke`

Revoke a refresh token. Requires refresh token in `Authorization: Bearer`. Always returns 204 on success.

| Auth                   | Response                                       |
| ---------------------- | ---------------------------------------------- |
| Bearer (refresh token) | 204 No Content                                 |
| —                      | 401 – `Authorization header is required`, etc. |

---

### Chirps

#### `GET /api/chirps`

List chirps. Public (no auth required). Optionally filter and sort.

**Query parameters:**

| Name     | Type   | Required | Default | Description                                   |
| -------- | ------ | -------- | ------- | --------------------------------------------- |
| sort     | string | No       | `asc`   | `asc` (oldest first) or `desc` (newest first) |
| authorId | string | No       | —       | Filter by author UUID                         |

**Example:** `GET /api/chirps?sort=desc&authorId=550e8400-e29b-41d4-a716-446655440000`

**Response (200):**

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2025-03-14T12:00:00.000Z",
    "updatedAt": "2025-03-14T12:00:00.000Z",
    "body": "Hello, Chirpy!",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
]
```

| Status | Error message |
| ------ | ------------- |
| 200    | Success       |

---

#### `GET /api/chirps/:chirpId`

Get a single chirp by ID. Public.

**Response (200):**

Same shape as one chirp object in the list above.

| Status | Error message     |
| ------ | ----------------- |
| 200    | Success           |
| 404    | `Chirp not found` |

---

#### `POST /api/chirps`

Create a chirp. Requires JWT. User is identified from the JWT. Body text is limited to 140 characters; profane words are replaced with `****`.

**Headers:** `Authorization: Bearer <JWT>`

**Request body:**

```json
{
  "body": "Your chirp text here (max 140 chars)"
}
```

**Response (201):**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2025-03-14T12:00:00.000Z",
  "updatedAt": "2025-03-14T12:00:00.000Z",
  "body": "Your chirp text here (max 140 chars)",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Status | Error message                                                                   |
| ------ | ------------------------------------------------------------------------------- |
| 201    | Created                                                                         |
| 400    | `Body is required and must be a string`, `Chirp is too long. Max length is 140` |
| 401    | `Authorization header is required`, etc.                                        |
| 404    | `User not found`                                                                |

---

#### `DELETE /api/chirps/:chirpId`

Delete a chirp. Requires JWT. **Only the chirp author** may delete.

**Headers:** `Authorization: Bearer <JWT>`

**Response (204):** No content.

| Status | Error message                            |
| ------ | ---------------------------------------- |
| 204    | Success                                  |
| 401    | `Authorization header is required`, etc. |
| 403    | `You may only delete your own chirps`    |
| 404    | `Chirp not found`                        |

---

### Polka Webhooks

#### `POST /api/polka/webhooks`

Processes Polka payment events. Requires `Authorization: ApiKey <POLKA_KEY>`. Handles `user.upgraded` to grant Chirpy Red membership; other events return 204 and are ignored.

**Headers:** `Authorization: ApiKey <POLKA_KEY>`

**Request body (user.upgraded):**

```json
{
  "event": "user.upgraded",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

| Status | Body                                                                    | Meaning                        |
| ------ | ----------------------------------------------------------------------- | ------------------------------ |
| 204    | None                                                                    | Success; or event ignored      |
| 401    | Empty                                                                   | Missing or invalid API key     |
| 404    | `{ "error": "User not found" }`                                         | User does not exist            |
| 400    | `{ "error": "data.userId is required and must be a non-empty string" }` | Invalid body for user.upgraded |

---

## Static Assets

#### `GET /app` and `GET /app/*`

Serves static files from `./src/app`. Each request increments the metrics counter shown at `GET /admin/metrics`.

| Auth | Response                       |
| ---- | ------------------------------ |
| None | 200 – Static file (HTML, etc.) |

---

_Last updated: March 2025_
