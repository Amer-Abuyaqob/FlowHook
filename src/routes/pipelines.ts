/**
 * Pipeline CRUD routes: create, list, get by id, update, delete.
 *
 * Mount this router under a prefix (e.g. /api) so callers use POST /api/pipelines, etc.
 * All routes require API key authentication.
 */
import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { config } from "../config.js";
import { NotFoundError } from "../errors.js";
import { getRouteParam } from "../http/routeParams.js";
import { respondWithJSON } from "../http/json.js";
import { toApiPipeline } from "../lib/pipelineSerialization.js";
import { parseCreateBody, parseUpdateBody } from "../lib/pipelineValidation.js";
import {
  createPipeline,
  deletePipeline,
  getPipelineById,
  listPipelines,
  updatePipeline,
} from "../services/pipeline.js";
import { authMiddleware } from "../auth/authMiddleware.js";

const pipelinesApi = Router();
pipelinesApi.use(authMiddleware);

/**
 * POST / — Create a pipeline.
 * Parses body, creates pipeline, returns 201 with serialized response.
 */
async function createPipelineHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, actionType, actionConfig } = parseCreateBody(req.body);
    const row = await createPipeline(name, actionType, actionConfig);
    respondWithJSON(res, 201, toApiPipeline(row, config.baseUrl));
  } catch (err) {
    next(err);
  }
}

/**
 * GET / — List all pipelines.
 */
async function listPipelinesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rows = await listPipelines();
    respondWithJSON(
      res,
      200,
      rows.map((row) => toApiPipeline(row, config.baseUrl))
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /:id — Get a pipeline by id.
 */
async function getPipelineByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = getRouteParam(req, "id");
    const row = await getPipelineById(id);
    if (!row) {
      next(new NotFoundError("Pipeline not found"));
      return;
    }
    respondWithJSON(res, 200, toApiPipeline(row, config.baseUrl));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /:id — Update a pipeline.
 */
async function updatePipelineHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = getRouteParam(req, "id");
    const updates = parseUpdateBody(req.body);
    const row = await updatePipeline(id, updates);
    respondWithJSON(res, 200, toApiPipeline(row, config.baseUrl));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /:id — Delete a pipeline.
 */
async function deletePipelineHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = getRouteParam(req, "id");
    const deleted = await deletePipeline(id);
    if (!deleted) {
      next(new NotFoundError("Pipeline not found"));
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

pipelinesApi.post("/", createPipelineHandler);
pipelinesApi.get("/", listPipelinesHandler);
pipelinesApi.get("/:id", getPipelineByIdHandler);
pipelinesApi.put("/:id", updatePipelineHandler);
pipelinesApi.delete("/:id", deletePipelineHandler);

const pipelinesRouter = Router();
pipelinesRouter.use("/pipelines", pipelinesApi);

export default pipelinesRouter;
