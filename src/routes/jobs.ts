/**
 * Job query routes: list and get-by-id with delivery attempts.
 *
 * Mount under `/api` so callers use GET /api/jobs and GET /api/jobs/:id. All routes require API key.
 */
import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { authMiddleware } from "../auth/authMiddleware.js";
import { NotFoundError } from "../errors.js";
import { respondWithJSON } from "../http/json.js";
import { getRouteParam } from "../http/routeParams.js";
import { parseJobListQuery } from "../lib/jobQueryValidation.js";
import { toApiJob, toApiJobDetail } from "../lib/jobSerialization.js";
import { assertValidUuid } from "../lib/validation.js";
import { getJobWithAttempts, listJobsByParams } from "../services/job.js";

const jobsApi = Router();
jobsApi.use(authMiddleware);

/**
 * GET / — List jobs with optional filters query params.
 */
async function listJobsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filters = parseJobListQuery(req.query as Record<string, unknown>);
    const rows = await listJobsByParams(filters);
    respondWithJSON(res, 200, rows.map(toApiJob));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /:id — Job detail including delivery_attempts.
 */
async function getJobByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = getRouteParam(req, "id");
    assertValidUuid(id, "Invalid request");
    const found = await getJobWithAttempts(id);
    if (!found) {
      next(new NotFoundError("Job not found"));
      return;
    }
    respondWithJSON(res, 200, toApiJobDetail(found.job, found.attempts));
  } catch (err) {
    next(err);
  }
}

jobsApi.get("/", listJobsHandler);
jobsApi.get("/:id", getJobByIdHandler);

const jobsRouter = Router();
jobsRouter.use("/jobs", jobsApi);

export default jobsRouter;
