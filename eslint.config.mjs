import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Treat a leading underscore as "intentionally unused" — lets documented
      // stubs keep their named param shape (e.g. lib/r2/presign.ts) without
      // sprinkling eslint-disable comments. Standard TS convention.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Agent-tooling state, NOT app source: background-agent git worktrees live under
    // .claude/worktrees/<name>/ (each a full repo copy incl. its own .next dev build).
    // The root-anchored ".next/**" above doesn't catch those nested builds, so without
    // this `pnpm lint` would walk thousands of generated chunks. Skills/config here
    // aren't app source either.
    ".claude/**",
  ]),
]);

export default eslintConfig;
