/**
 * Delivery to subscribers; Phase 2 is no-op stub.
 *
 * Provides DeliverySigner interface for future HMAC support and deliverToSubscribers for the worker.
 */
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
 * No-op signer used in Phase 2; returns empty string for any payload.
 *
 * Phase 4 will replace with HMAC implementation that adds X-FlowHook-Signature header.
 */
export const noOpSigner: DeliverySigner = {
  sign(_payload: string): string {
    return "";
  },
};

/**
 * Delivers the processed result to all subscribers.
 *
 * Phase 2 stub: does nothing. Phase 4 will POST JSON + headers to each subscriber and record delivery_attempts.
 *
 * @param subscribers - Array of subscriber rows (url, headers, etc.).
 * @param result - Processed action result to deliver.
 * @param jobId - Job UUID (used in Phase 4 for delivery_attempts).
 * @returns Promise that resolves when done (immediately in stub).
 */
export async function deliverToSubscribers(
  _subscribers: SubscriberRow[],
  _result: unknown,
  _jobId: string
): Promise<void> {
  return Promise.resolve();
}
