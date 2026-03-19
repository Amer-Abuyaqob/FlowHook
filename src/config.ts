/**
 * Application configuration loaded from environment variables.
 * Single source of truth for PORT, DATABASE_URL, and API_KEY.
 */
import "dotenv/config";

/**
 * Typed application configuration.
 *
 * @property port - HTTP server port (default 3000).
 * @property databaseUrl - PostgreSQL connection string (required).
 * @property apiKey - API key for authenticated endpoints (required).
 */
export type Config = {
  port: number;
  databaseUrl: string;
  apiKey: string;
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
 * Loads and validates configuration from environment variables.
 *
 * @returns Validated config object.
 * @throws {Error} When DATABASE_URL or API_KEY is missing.
 */
function loadConfig(): Config {
  return {
    port: parsePort(process.env.PORT),
    databaseUrl: requireEnv(process.env.DATABASE_URL, "DATABASE_URL"),
    apiKey: requireEnv(process.env.API_KEY, "API_KEY"),
  };
}

/** Application config (loaded at module init). */
export const config = loadConfig();
