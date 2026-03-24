/**
 * Worker entry point. Polls jobs, runs actions, delivers to subscribers.
 *
 * Exits with code 1 if DATABASE_URL is not set.
 */
import { db } from "./db/index.js";
import { runWorkerLoop } from "./services/worker.js";

/**
 * Bootstraps the worker and runs the processing loop.
 *
 * @returns Promise that never resolves on success; exits with code 1 if db is unavailable.
 */
async function main(): Promise<void> {
  if (!db) {
    console.error("Error:", "Database connection is not available");
    process.exit(1);
  }
  await runWorkerLoop();
}

main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error("Error:", message);
  process.exit(1);
});
