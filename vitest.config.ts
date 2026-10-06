import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Two test worlds, one runner (vitest `projects`):
//
//   unit      - the pure data-integrity layer (validators, R2 keys, tier math,
//               schemas). Node env, no DOM/Supabase/R2; the SQL RPC contract is
//               verified separately via the Supabase MCP. Exactly the original
//               config - the V1-program component work must never disturb it.
//   component - the behavior PINS for the complex client components
//               (media-lightbox gesture physics, the guest-upload queue
//               machine, likes-provider), added in program Phase 2 so later
//               decomposition phases refactor against a tripwire. jsdom + RTL;
//               browser-API gaps are polyfilled in vitest.setup.ts. Pins assert
//               BEHAVIOR (attributes, callbacks, payloads, storage), never
//               class names/styles, so visual phases don't break them.
//
// Projects do NOT inherit vite-level root options, so `resolve`/`plugins` are
// declared per project.
export default defineConfig({
  test: {
    // `pnpm test:coverage` (test-slim): lines, branches and functions per file across both projects, so a lane that
    // deletes a test proves in one command that it lost nothing. Coverage is a root option (never a project's) and
    // runs only when `--coverage` asks, so `pnpm test` is unchanged.
    coverage: {
      provider: "v8",
      include: ["src/**"],
      reporter: ["text-summary", "json-summary"],
    },
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: "unit",
          environment: "node",
          // Worker threads, not forks (test-slim, measured about 9% off a full run with every test green). Set per
          // project: vitest 4's projects inherit no root option without `extends: true`.
          pool: "threads",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: "component",
          environment: "jsdom",
          pool: "threads",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
