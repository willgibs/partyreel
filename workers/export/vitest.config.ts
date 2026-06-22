import { defineConfig } from "vitest/config";

// Unit tests for the Worker's PURE token/layout helpers (export-token.ts) — no Worker runtime needed.
// The end-to-end zip stream is validated by the live smoke test (README) + the live red-team, not here.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
