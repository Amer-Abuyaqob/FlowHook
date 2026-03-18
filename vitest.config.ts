/**
 * Vitest configuration.
 * Loads .env via dotenv so integration tests can use DATABASE_URL.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
  },
});
