/**
 * FlowHook API entry point.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { config } from "./config.js";
import healthRouter from "./routes/health.js";

/**
 * True when this file is the process entry script (not when imported by tests or other modules).
 *
 * @returns Whether `main()` should run for this process.
 */
function isMainModule(): boolean {
  const entryPath = process.argv[1];
  if (!entryPath) return false;
  const thisFile = path.resolve(fileURLToPath(import.meta.url));
  return thisFile === path.resolve(entryPath);
}

/**
 * URL prefix for REST API routes; combined with paths on each mounted router (e.g. `/api` + `/healthz`).
 */
const API_PREFIX = "/api";

/**
 * Creates and configures the Express application with JSON parsing and registered routes.
 *
 * @returns Express application instance that is not yet listening for connections.
 * @example
 * const app = createApp();
 */
export function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  registerApiRoutes(app);
  return app;
}

/**
 * Mounts API feature routers under {@link API_PREFIX}.
 *
 * @param app - Express application instance.
 * @returns void
 */
function registerApiRoutes(app: express.Express): void {
  app.use(API_PREFIX, healthRouter);
}

/**
 * Starts the HTTP server by creating the app and listening on the configured port.
 *
 * @returns Promise that resolves after `listen` is invoked; async shape reserved for future `await runMigrations()` (or similar) before listen.
 * @example
 * await main();
 */
export async function main(): Promise<void> {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`FlowHook is listening on port ${config.port}`);
  });
}

if (isMainModule()) {
  main().catch((e: unknown) => {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Error:", message);
    process.exit(1);
  });
}
