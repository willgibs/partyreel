import { defineConfig } from "vitest/config";

// Unit tests for the Worker's PURE helpers only (strategy.ts) — no Worker runtime needed.
// The copy paths + reconciliation are validated by the live DR drill (see README), not here.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
