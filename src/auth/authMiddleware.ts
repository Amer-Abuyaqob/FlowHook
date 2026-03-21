/**
 * Express middleware that requires valid API key authentication.
 *
 * On success attaches identity to the request; on failure passes
 * UserNotAuthenticatedError to the error middleware.
 */

import type { Request, Response, NextFunction } from "express";
import { UserNotAuthenticatedError } from "../errors.js";
import { validateAuth } from "./validate.js";

/**
 * Middleware that validates the API key via headers and attaches identity.
 *
 * Calls validateAuth; if invalid, passes UserNotAuthenticatedError to next.
 * The global error middleware responds with 401 and { error: "Unauthorized" }.
 *
 * @param req - Express request.
 * @param _res - Unused; error middleware handles the response.
 * @param next - Called with the error on failure, or no args on success.
 * @returns void (async handler; Express supports Promise-returning middleware).
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const result = await validateAuth(req);
  if (!result.valid) {
    next(new UserNotAuthenticatedError("Unauthorized"));
    return;
  }
  req.identity = result.identity;
  next();
}
