/**
 * Vitest configuration.
 * Loads .env via dotenv so integration tests can use DATABASE_URL.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["node_modules/", "dist/", "**/*.test.ts", "**/*.config.ts"],
    },
  },
});
