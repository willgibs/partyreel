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
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: "component",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
