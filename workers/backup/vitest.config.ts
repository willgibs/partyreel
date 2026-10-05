import { defineConfig } from "vitest/config";

// The Worker's tests run in plain Node, no Worker runtime: the pure helpers, the reconcile's, the prune's and the
// restore's engines against fake buckets (src/testing/fake-r2.ts), and the lone copies' table on Node's own SQLite.
// The copy path itself (backupOne's streaming put and multipart) is proved by the live DR drill (README).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
