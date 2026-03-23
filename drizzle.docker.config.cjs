/**
 * Minimal Drizzle config for Docker migrations.
 * Uses process.env.DATABASE_URL (set by docker-compose); no app config import.
 */
"use strict";

module.exports = {
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
};
