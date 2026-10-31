import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Real PostgREST on the local Supabase stack (supabase start). Not part of `npm test`:
// run `npx vitest run --config vitest.integration.config.ts` after the seed in tests/integration/seed-export-paging.sql.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 60_000
  }
});
