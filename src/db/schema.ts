/**
 * FlowHook Drizzle schema.
 * Table definitions for pipelines, subscribers, jobs, and delivery_attempts.
 */
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import type { ActionConfig, ActionType, JobStatus } from "./types.js";

/**
 * Pipelines table: webhook sources with action config and active flag.
 *
 * @property id - UUID primary key, auto-generated.
 * @property slug - Unique URL slug for webhook ingestion (e.g. POST /webhooks/:slug).
 * @property name - User-facing pipeline name.
 * @property actionType - One of transform, filter, or template.
 * @property actionConfig - Action-specific JSON config (shape depends on actionType).
 * @property isActive - When false, webhooks to this slug return 404/400.
 * @property createdAt - Creation timestamp.
 * @property updatedAt - Last update timestamp (auto-updated on change).
 */
export const pipelines = pgTable("pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  actionType: text("action_type").$type<ActionType>().notNull(),
  actionConfig: jsonb("action_config").$type<ActionConfig>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Subscribers table: destination URLs and optional headers per pipeline.
 *
 * @property id - UUID primary key, auto-generated.
 * @property pipelineId - FK to pipelines; cascade delete when pipeline is removed.
 * @property url - Destination URL where processed payload is POSTed.
 * @property headers - Optional JSON object of headers to send (e.g. Authorization).
 * @property createdAt - Creation timestamp.
 */
export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipeline_id")
    .notNull()
    .references(() => pipelines.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  headers: jsonb("headers").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Jobs table: queued webhook payloads and processing state.
 *
 * @property id - UUID primary key, auto-generated.
 * @property pipelineId - FK to pipelines; cascade delete when pipeline is removed.
 * @property status - pending | processing | completed | filtered | failed.
 * @property payload - Raw inbound webhook payload (JSONB).
 * @property result - Processed result after action; null if filtered.
 * @property createdAt - Creation timestamp.
 * @property updatedAt - Last update timestamp (auto-updated on change).
 * @property processingStartedAt - When worker claimed the job; null until claimed.
 * @property processingEndedAt - When worker finished; null until done.
 */
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipeline_id")
    .notNull()
    .references(() => pipelines.id, { onDelete: "cascade" }),
  status: text("status").$type<JobStatus>().notNull().default("pending"),
  payload: jsonb("payload").notNull(),
  result: jsonb("result"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  processingStartedAt: timestamp("processing_started_at", {
    withTimezone: true,
  }),
  processingEndedAt: timestamp("processing_ended_at", {
    withTimezone: true,
  }),
});

/**
 * Delivery attempts table: per-subscriber delivery history with retry info.
 *
 * @property id - UUID primary key, auto-generated.
 * @property jobId - FK to jobs; cascade delete when job is removed.
 * @property subscriberId - FK to subscribers; cascade delete when subscriber is removed.
 * @property attemptNumber - 1-based attempt index (1, 2, 3 for retries).
 * @property statusCode - HTTP response code from subscriber; null if network error.
 * @property success - True if statusCode was 2xx.
 * @property errorMessage - Error details on failure.
 * @property createdAt - When this attempt was made.
 */
export const deliveryAttempts = pgTable("delivery_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  subscriberId: uuid("subscriber_id")
    .notNull()
    .references(() => subscribers.id, { onDelete: "cascade" }),
  attemptNumber: integer("attempt_number").notNull(),
  statusCode: integer("status_code"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
