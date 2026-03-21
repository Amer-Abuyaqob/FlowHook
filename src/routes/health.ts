/**
 * Health check routes for liveness and readiness probes.
 *
 * Mount this router under a prefix (for example `/api`) so callers use `GET /api/healthz`.
 */
import { Router, type Request, type Response } from "express";
import { setPlainTextUtf8Header } from "../http/headers.js";

/**
 * Sends a minimal successful health response so probes treat the process as up.
 *
 * Plain text keeps responses cheap to parse; UTF-8 matches headers helper and typical probe expectations.
 *
 * @param _req - Express request (unused; the route path is defined on the router).
 * @param res - Express response used to set headers and body.
 * @returns void
 */
function handleHealthz(_req: Request, res: Response): void {
  try {
    setPlainTextUtf8Header(res);
    res.send("OK");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Error:", message);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error");
    }
  }
}

/**
 * Express router exposing the health check endpoint.
 *
 * @example
 * app.use("/api", healthRouter);
 */
const healthRouter = Router();
healthRouter.get("/healthz", handleHealthz);

export default healthRouter;
