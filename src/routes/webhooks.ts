/**
 * Webhook ingestion route for unprotected pipeline endpoints.
 *
 * Mount this router at `/webhooks` so callers use `POST /webhooks/:slug`.
 */
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { BadRequestError, NotFoundError } from "../errors.js";
import { getRouteParam } from "../http/routeParams.js";
import { respondWithJSON } from "../http/json.js";
import { enqueueJob } from "../services/job.js";
import { getPipelineBySlug } from "../services/pipeline.js";

const webhooksRouter = Router();

/**
 * Handles `POST /webhooks/:slug` by looking up the pipeline, validating it is active,
 * and enqueueing the inbound payload as a `pending` job.
 *
 * @param req - Express request.
 * @param res - Express response.
 * @param next - Express next handler for errors.
 * @returns Promise that resolves when the response is sent.
 */
async function ingestWebhookHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slug = getRouteParam(req, "slug");
    const pipeline = await getPipelineBySlug(slug);

    if (!pipeline) {
      next(new NotFoundError("Pipeline not found"));
      return;
    }

    if (!pipeline.isActive) {
      next(new BadRequestError("Pipeline is inactive"));
      return;
    }

    const jobId = await enqueueJob(pipeline.id, req.body);
    res.set("Job-Id", jobId);
    respondWithJSON(res, 202, { jobId });
  } catch (err) {
    next(err);
  }
}

webhooksRouter.post("/:slug", ingestWebhookHandler);

export default webhooksRouter;
