/**
 * Augments Express Request with optional identity from auth middleware.
 *
 * Import this module once (e.g. in index.ts) so the declaration merging takes effect.
 */

import type { Identity } from "../auth/validate.js";

declare global {
  /* eslint-disable @typescript-eslint/no-namespace -- Express declaration merging requires namespace */
  namespace Express {
    interface Request {
      /** Set by authMiddleware when authentication succeeds. */
      identity?: Identity;
    }
  }
  /* eslint-enable @typescript-eslint/no-namespace */
}

export {};
