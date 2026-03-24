/**
 * Application configuration loaded from environment variables.
 * Single source of truth for PORT, DATABASE_URL, API_KEY, and BASE_URL.
 */
import "dotenv/config";

/**
 * Database configuration.
 *
 * @property url - PostgreSQL connection string; undefined when not set.
 */
export type DbConfig = {
  url: string | undefined;
};

/**
 * Worker configuration.
 *
 * @property pollIntervalMs - Poll interval in milliseconds for the job worker (default 1000).
 */
export type WorkerConfig = {
  pollIntervalMs: number;
};

/**
 * Delivery configuration.
 *
 * @property maxAttempts - Maximum number of delivery attempts per subscriber (default 3).
 * @property baseDelayMs - Base retry delay in milliseconds for exponential backoff (default 1000).
 * @property requestTimeoutMs - HTTP request timeout for each delivery attempt in milliseconds (default 5000).
 */
export type DeliveryConfig = {
  maxAttempts: number;
  baseDelayMs: number;
  requestTimeoutMs: number;
};

/**
 * Typed application configuration.
 *
 * @property port - HTTP server port (default 3000).
 * @property db - Database config; url is undefined when DATABASE_URL is not set.
 * @property apiKey - API key for authenticated endpoints (required).
 * @property baseUrl - Base URL for webhook endpoints; defaults to http://localhost:PORT when not set.
 * @property worker - Worker poll interval for job processing.
 * @property delivery - Delivery retry and timeout settings.
 */
export type Config = {
  port: number;
  db: DbConfig;
  apiKey: string;
  baseUrl: string;
  worker: WorkerConfig;
  delivery: DeliveryConfig;
};

/**
 * Parses PORT from env; returns default 3000 if missing or invalid.
 *
 * @param value - Raw env value (e.g. process.env.PORT).
 * @returns Parsed port number.
 * @internal Exported for unit testing.
 */
export function parsePort(value: string | undefined): number {
  if (value === undefined || value === "") return 3000;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) return 3000;
  return n;
}

/**
 * Returns the value if non-empty; throws otherwise.
 *
 * @param value - Raw env value.
 * @param name - Env var name for error message.
 * @returns Trimmed non-empty string.
 * @throws {Error} When value is missing or empty.
 * @internal Exported for unit testing.
 */
export function requireEnv(value: string | undefined, name: string): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return trimmed;
}

/**
 * Returns trimmed value or undefined when missing or empty.
 *
 * @param value - Raw env value.
 * @returns Trimmed non-empty string, or undefined.
 * @internal Exported for unit testing.
 */
export function getOptionalEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Parses WORKER_POLL_INTERVAL_MS from env; returns default 1000 if missing or invalid.
 *
 * @param value - Raw env value (e.g. process.env.WORKER_POLL_INTERVAL_MS).
 * @returns Parsed positive integer (milliseconds).
 * @internal Exported for unit testing.
 */
export function parseWorkerPollIntervalMs(value: string | undefined): number {
  const defaultMs = 1000;
  if (value === undefined || value === "") return defaultMs;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return defaultMs;
  return n;
}

/**
 * Parses a positive integer with fallback default when missing or invalid.
 *
 * @param value - Raw env value.
 * @param defaultValue - Fallback when parsing fails.
 * @returns Parsed positive integer or the default value.
 * @internal Exported for unit testing.
 */
export function parsePositiveIntOrDefault(
  value: string | undefined,
  defaultValue: number
): number {
  if (value === undefined || value === "") return defaultValue;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return defaultValue;
  return n;
}

/**
 * Loads and validates configuration from environment variables.
 *
 * @returns Validated config object.
 * @throws {Error} When API_KEY is missing.
 */
function loadConfig(): Config {
  const port = parsePort(process.env.PORT);
  const baseUrlEnv = getOptionalEnv(process.env.BASE_URL);
  const workerPollIntervalMs = parseWorkerPollIntervalMs(
    process.env.WORKER_POLL_INTERVAL_MS
  );
  const deliveryMaxAttempts = parsePositiveIntOrDefault(
    process.env.DELIVERY_MAX_ATTEMPTS,
    3
  );
  const deliveryBaseDelayMs = parsePositiveIntOrDefault(
    process.env.DELIVERY_BASE_DELAY_MS,
    1000
  );
  const deliveryRequestTimeoutMs = parsePositiveIntOrDefault(
    process.env.DELIVERY_REQUEST_TIMEOUT_MS,
    5000
  );
  return {
    port,
    db: { url: getOptionalEnv(process.env.DATABASE_URL) },
    apiKey: requireEnv(process.env.API_KEY, "API_KEY"),
    baseUrl: baseUrlEnv ?? `http://localhost:${port}`,
    worker: { pollIntervalMs: workerPollIntervalMs },
    delivery: {
      maxAttempts: deliveryMaxAttempts,
      baseDelayMs: deliveryBaseDelayMs,
      requestTimeoutMs: deliveryRequestTimeoutMs,
    },
  };
}

/** Application config (loaded at module init). */
export const config = loadConfig();
