/**
 * Slug utilities for pipeline names.
 *
 * Provides generateSlug, validateSlug, and ensureUniqueSlug used by the Pipeline Service.
 */
import type { DbClient } from "../db/index.js";
import { existsPipelineWithSlug } from "../db/queries/pipelines.js";

/** Regex for valid slug format: lowercase alphanumeric segments separated by hyphens. */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Fallback slug when input yields an empty string after normalization. */
const EMPTY_SLUG_FALLBACK = "unnamed";

/**
 * Generates a URL-safe slug from a human-readable name.
 *
 * @param name - Raw name (e.g. "My Stripe Orders").
 * @returns Normalized slug (e.g. "my-stripe-orders"), or "unnamed" if result is empty.
 * @example
 * generateSlug("My Stripe Orders") // "my-stripe-orders"
 * generateSlug("  Hello   World  ") // "hello-world"
 */
export function generateSlug(name: string): string {
  const trimmed = name.toLowerCase().trim();
  const withHyphens = trimmed.replace(/[^a-z0-9]+/g, "-");
  const collapsed = withHyphens.replace(/-+/g, "-");
  const trimmedHyphens = collapsed.replace(/^-|-$/g, "");
  return trimmedHyphens || EMPTY_SLUG_FALLBACK;
}

/**
 * Validates that a string conforms to the slug format.
 *
 * @param slug - String to validate.
 * @returns True if slug matches ^[a-z0-9]+(?:-[a-z0-9]+)*$.
 * @example
 * validateSlug("my-pipeline") // true
 * validateSlug("My-Pipeline") // false
 */
export function validateSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

/**
 * Finds a unique slug by appending -1, -2, etc. until an unused slug is found.
 *
 * @param slug - Base slug (assumed to be already in use).
 * @param db - Connected Drizzle client.
 * @returns First available suffixed slug (e.g. "slug-1", "slug-2").
 */
async function findUniqueSuffixedSlug(
  slug: string,
  db: DbClient
): Promise<string> {
  let suffix = 1;
  while (true) {
    const candidate = `${slug}-${suffix}`;
    const used = await existsPipelineWithSlug(db, candidate);
    if (!used) {
      return candidate;
    }
    suffix += 1;
  }
}

/**
 * Returns a slug guaranteed to be unique in the pipelines table.
 * If the base slug exists, appends -1, -2, etc. until an unused slug is found.
 *
 * @param slug - Base slug to check.
 * @param db - Connected Drizzle client.
 * @returns Resolved slug (same as input if unique, otherwise suffixed).
 */
export async function ensureUniqueSlug(
  slug: string,
  db: DbClient
): Promise<string> {
  const used = await existsPipelineWithSlug(db, slug);
  if (!used) {
    return slug;
  }
  return findUniqueSuffixedSlug(slug, db);
}
