import { defineConfig } from "vitest/config";

// Unit tests for the pure data-integrity layer (validators, R2 key construction,
// tier-limit math, request schemas). Node env — no DOM/Supabase/R2 here; the SQL
// RPC contract is verified separately via the Supabase MCP. `resolve.tsconfigPaths`
// wires the `@/*` alias so tests import exactly like app code.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
