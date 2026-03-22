/**
 * Subscriber request body validation.
 *
 * Parses and validates add-subscriber API request bodies.
 */
import { BadRequestError } from "../errors.js";
import {
  assertIsRecord,
  assertValidUrl,
  getRequiredString,
} from "./validation.js";

/**
 * Parsed add-subscriber body.
 *
 * @property url - Valid http(s) URL.
 * @property headers - Optional key-value headers; null if omitted.
 */
export type AddSubscriberBody = {
  url: string;
  headers: Record<string, string> | null;
};

/**
 * Parses and validates the add-subscriber request body.
 *
 * @param body - Raw request body (unknown).
 * @returns Parsed url and headers.
 * @throws {BadRequestError} When body is invalid, url missing, or url format invalid.
 */
export function parseAddSubscriberBody(body: unknown): AddSubscriberBody {
  const obj = assertIsRecord(body, "Invalid request");
  const urlRaw = getRequiredString(obj, "url", "URL is required");
  const url = assertValidUrl(urlRaw, "Invalid URL format");

  const headersRaw = obj["headers"];
  if (headersRaw === undefined || headersRaw === null) {
    return { url, headers: null };
  }

  if (typeof headersRaw !== "object" || Array.isArray(headersRaw)) {
    throw new BadRequestError("Invalid request");
  }

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(headersRaw)) {
    if (typeof v !== "string") {
      throw new BadRequestError("Invalid request");
    }
    headers[k] = v;
  }
  return { url, headers };
}
