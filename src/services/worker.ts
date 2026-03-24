/**
 * Worker processing loop: polls for pending jobs, runs pipeline actions, updates status,
 * and delivers to subscribers (Phase 2: delivery is stub).
 */
import { assertDbConnection, db } from "../db/index.js";
import { updateJob } from "../db/queries/jobs.js";
import { config } from "../config.js";
import { claimNextJob } from "./job.js";
import { getPipelineById } from "./pipeline.js";
import { getSubscribersByPipelineId } from "./subscriber.js";
import { runAction } from "./actions/index.js";
import { deliverToSubscribers } from "../lib/delivery.js";

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - Duration in milliseconds.
 * @returns Promise that resolves after the delay.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Claims and processes one job if available.
 *
 * @returns True if a job was processed, false if none available.
 * @throws {Error} When database connection is not available.
 */
export async function processOneJob(): Promise<boolean> {
  assertDbConnection(db);

  const job = await claimNextJob();
  if (job === null) {
    return false;
  }

  const pipeline = await getPipelineById(job.pipelineId);
  if (!pipeline) {
    console.error("Error:", "Pipeline not found");
    await updateJob(db, job.id, {
      status: "failed",
      processingEndedAt: new Date(),
    });
    return true;
  }

  const subscribers = await getSubscribersByPipelineId(job.pipelineId);

  try {
    const outcome = await runAction(
      pipeline.actionType,
      pipeline.actionConfig,
      job.payload
    );

    if ("filtered" in outcome) {
      await updateJob(db, job.id, {
        status: "filtered",
        result: null,
        processingEndedAt: new Date(),
      });
    } else {
      await updateJob(db, job.id, {
        status: "completed",
        result: outcome.result,
        processingEndedAt: new Date(),
      });
      await deliverToSubscribers(subscribers, outcome.result, job.id);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Error:", message);
    await updateJob(db, job.id, {
      status: "failed",
      processingEndedAt: new Date(),
    });
  }

  return true;
}

/**
 * Infinite loop: claim jobs, process or sleep, repeat.
 *
 * @returns Promise that never resolves.
 */
export async function runWorkerLoop(): Promise<never> {
  while (true) {
    const processed = await processOneJob();
    if (!processed) {
      await sleep(config.worker.pollIntervalMs);
    }
  }
}
