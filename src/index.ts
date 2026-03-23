/**
 * HTTP server entry: Express app factory, static web UI under {@link APP_ROUTE}, and REST API under `/api`.
 *
 * Running `node dist/index.js` serves assets from `dist/client`; `tsx` dev serves from `src/app`.
 */
import "./types/express-augment.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { config } from "./config.js";
import { errorMiddleware } from "./http/errorMiddleware.js";
import healthRouter from "./routes/health.js";
import pipelinesRouter from "./routes/pipelines.js";
import webhooksRouter from "./routes/webhooks.js";

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
 * URL path prefix for the static web UI (mount path for `express.static`).
 */
export const APP_ROUTE = "/app";

/**
 * Resolves the directory containing static web assets for the {@link APP_ROUTE} UI.
 *
 * @returns Absolute path to `dist/client` when running from compiled `dist/`, or `src/app` during local development.
 */
function getClientStaticDir(): string {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  return path.basename(thisDir) === "dist"
    ? path.join(thisDir, "client")
    : path.join(thisDir, "app");
}

/**
 * Registers the static web UI: redirects `/` to `{@link APP_ROUTE}/` and serves files from the client directory.
 *
 * @param app - Express application instance.
 * @returns void
 */
function registerWebUi(app: express.Express): void {
  app.get("/", (_req, res) => {
    res.redirect(302, `${APP_ROUTE}/`);
  });
  app.use(APP_ROUTE, express.static(getClientStaticDir()));
}

/**
 * Builds the Express application with JSON middleware, web UI, and API routes.
 *
 * @returns Configured Express application instance (not listening yet).
 * @example
 * const app = createApp();
 */
export function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  registerWebUi(app);
  registerApiRoutes(app);
  app.use(errorMiddleware);
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
  app.use(API_PREFIX, pipelinesRouter);
  app.use("/webhooks", webhooksRouter);
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
