/**
 * Subscriber routes: add and remove destination URLs for a pipeline.
 *
 * Mount this router at `/:id/subscribers` on the pipelines router so callers use
 * POST /api/pipelines/:id/subscribers and DELETE /api/pipelines/:id/subscribers/:subscriberId.
 * All routes require API key authentication (inherited from parent).
 */
import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { NotFoundError } from "../errors.js";
import { getRouteParam } from "../http/routeParams.js";
import { respondWithJSON } from "../http/json.js";
import { toApiSubscriber } from "../lib/subscriberSerialization.js";
import { parseAddSubscriberBody } from "../lib/subscriberValidation.js";
import { addSubscriber, removeSubscriber } from "../services/subscriber.js";

/** mergeParams: true so req.params.id from parent (/:id/subscribers) is available. */
const router = Router({ mergeParams: true });

/**
 * POST / — Add a subscriber to the pipeline (pipeline id from req.params.id).
 */
async function addSubscriberHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pipelineId = getRouteParam(req, "id");
    const { url, headers } = parseAddSubscriberBody(req.body);
    const row = await addSubscriber(pipelineId, url, headers);
    respondWithJSON(res, 201, toApiSubscriber(row));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /:subscriberId — Remove a subscriber from the pipeline.
 */
async function deleteSubscriberHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pipelineId = getRouteParam(req, "id");
    const subscriberId = getRouteParam(req, "subscriberId");
    const deleted = await removeSubscriber(pipelineId, subscriberId);
    if (!deleted) {
      next(new NotFoundError("Subscriber not found"));
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

router.post("/", addSubscriberHandler);
router.delete("/:subscriberId", deleteSubscriberHandler);

export default router;
