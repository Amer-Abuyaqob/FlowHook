/**
 * Delivery utilities for posting processed job results to subscribers.
 *
 * Handles retries, per-attempt persistence, timeout behavior, and summary outcomes for worker finalization.
 */
import { config } from "../config.js";
import { assertDbConnection, db } from "../db/index.js";
import type { DbClient } from "../db/index.js";
import { insertDeliveryAttempt } from "../db/queries/deliveryAttempts.js";
import type { SubscriberRow } from "../db/queries/subscribers.js";

/**
 * Interface for signing payloads before delivery.
 *
 * For future HMAC signing; v1 implementation returns empty string.
 *
 * @property sign - Signs the payload string and returns the signature (or empty string for no-op).
 */
export interface DeliverySigner {
  sign(payload: string): string;
}

/**
 * No-op signer used in v1; returns empty string for any payload.
 */
export const noOpSigner: DeliverySigner = {
  sign(_payload: string): string {
    return "";
  },
};

/**
 * Per-subscriber delivery result details.
 *
 * @property subscriberId - Subscriber identifier.
 * @property success - True when subscriber delivery eventually succeeded.
 * @property attemptsUsed - Number of attempts consumed for this subscriber.
 */
export type SubscriberDeliveryResult = {
  subscriberId: string;
  success: boolean;
  attemptsUsed: number;
};

/**
 * Aggregated delivery summary returned to the worker.
 *
 * @property allSucceeded - True only when every subscriber succeeds.
 * @property results - Per-subscriber outcomes.
 */
export type DeliverySummary = {
  allSucceeded: boolean;
  results: SubscriberDeliveryResult[];
};

type FetchFn = typeof fetch;
type SleepFn = (ms: number) => Promise<void>;
type AttemptRecorder = typeof insertDeliveryAttempt;

/**
 * Optional dependencies for testability.
 *
 * @property fetchFn - Custom fetch implementation for tests.
 * @property sleepFn - Custom sleep implementation for tests.
 * @property insertAttempt - Custom delivery-attempt writer for tests.
 */
export type DeliveryDependencies = {
  fetchFn?: FetchFn;
  sleepFn?: SleepFn;
  insertAttempt?: AttemptRecorder;
};

/**
 * Sleeps for the provided number of milliseconds.
 *
 * @param ms - Delay duration in milliseconds.
 * @returns Promise that resolves after delay.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes one fetch attempt with timeout handling.
 *
 * @param fetchFn - Fetch implementation.
 * @param url - Subscriber URL.
 * @param headers - Request headers.
 * @param body - JSON payload string.
 * @param timeoutMs - Attempt timeout in milliseconds.
 * @returns Response when request completes before timeout.
 */
async function sendAttempt(
  fetchFn: FetchFn,
  url: string,
  headers: Record<string, string>,
  body: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchFn(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Delivers the processed result to all subscribers.
 *
 * @param subscribers - Array of subscriber rows (url, headers, etc.).
 * @param result - Processed action result to deliver.
 * @param jobId - Job UUID (used in Phase 4 for delivery_attempts).
 * @param dependencies - Optional test-only dependency overrides.
 * @returns Delivery summary with strict all-subscriber success signal.
 */
export async function deliverToSubscribers(
  subscribers: SubscriberRow[],
  result: unknown,
  jobId: string,
  dependencies?: DeliveryDependencies
): Promise<DeliverySummary> {
  if (subscribers.length === 0) {
    return { allSucceeded: true, results: [] };
  }

  const fetchFn = dependencies?.fetchFn ?? fetch;
  const sleepFn = dependencies?.sleepFn ?? sleep;
  const insertAttempt = dependencies?.insertAttempt ?? insertDeliveryAttempt;
  const dbClient = db;
  if (!dependencies?.insertAttempt) {
    assertDbConnection(dbClient);
  }
  const payload = JSON.stringify(result);
  const signature = noOpSigner.sign(payload);
  const maxAttempts = config.delivery.maxAttempts;
  const baseDelayMs = config.delivery.baseDelayMs;
  const requestTimeoutMs = config.delivery.requestTimeoutMs;

  const results: SubscriberDeliveryResult[] = [];

  for (const subscriber of subscribers) {
    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(subscriber.headers ?? {}),
    };
    if (signature !== "") {
      baseHeaders["X-FlowHook-Signature"] = signature;
    }

    let attempt = 0;
    let delivered = false;

    while (attempt < maxAttempts && !delivered) {
      attempt += 1;
      let statusCode: number | null = null;
      let errorMessage: string | null = null;
      let success = false;

      try {
        const response = await sendAttempt(
          fetchFn,
          subscriber.url,
          baseHeaders,
          payload,
          requestTimeoutMs
        );
        statusCode = response.status;
        success = response.ok;
        if (!success) {
          errorMessage = `Delivery failed with status ${response.status}`;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errorMessage = message;
      }

      await insertAttempt(dbClient as DbClient, {
        jobId,
        subscriberId: subscriber.id,
        attemptNumber: attempt,
        statusCode,
        success,
        errorMessage,
      });

      if (success) {
        delivered = true;
        break;
      }

      if (attempt < maxAttempts) {
        const delayMs = baseDelayMs * 2 ** (attempt - 1);
        await sleepFn(delayMs);
      }
    }

    results.push({
      subscriberId: subscriber.id,
      success: delivered,
      attemptsUsed: attempt,
    });
  }

  return {
    allSucceeded: results.every((item) => item.success),
    results,
  };
}
