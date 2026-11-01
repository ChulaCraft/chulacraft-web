import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The manager contract suite (docs/ops-manager-contract.md). Not part of `npm test`; run it against a
// manager (the mock or mcsv_manager --features fake-backend):
//   MANAGER_URL=http://127.0.0.1:3212 npx vitest run --config vitest.contract.config.ts
// Tokens are signed with MCSV_JWT_PRIVATE_KEY, or the visual tests' key when it is unset.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["tests/contract/**/*.test.ts"],
    testTimeout: 30_000,
    fileParallelism: false
  }
});
