import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * partyreel/no-swallowed-db-error — the Pattern-B tripwire (2026-07 QA round).
 *
 * PostgREST builders never REJECT: a dead connection, a revoked grant and a
 * genuinely empty table all resolve the same shape and differ only in `error`.
 * So `const { data } = await supabase.from(…)` reads a BROKEN query as an EMPTY
 * one, and the code downstream acts on that lie. It shipped an export that
 * called a 40 GB album empty, kill switches that re-enabled themselves, and a
 * watermark on a paying host's video.
 *
 * The rule flags any `data`/`count` destructure off an `await` that does not
 * also bind `error`. Fix by wrapping the query in `mustQuery`/`mustCount`
 * (src/lib/db/must-query.ts), or bind `error` and handle it. A deliberate
 * swallow (an authz probe that must fail CLOSED) stays legal via an
 * `eslint-disable-next-line partyreel/no-swallowed-db-error` + a one-line WHY,
 * which is the point: the choice becomes explicit and reviewable.
 *
 * Authored inline (not a published plugin) so it needs no new dependency and
 * lives next to the config it governs. A `no-restricted-syntax` selector could
 * match the same AST, but its disable comment would be the blunt
 * `eslint-disable-next-line no-restricted-syntax` — this way the escape hatch
 * names the rule it is escaping.
 *
 * EXEMPT by construction: nested `data` patterns, i.e. the ubiquitous
 * `const { data: { user } } = await supabase.auth.getUser()` — the GoTrue
 * client's own idiom, where a failure surfaces as a null `user` and every call
 * site already branches on it.
 */
const noSwallowedDbError = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require binding `error` (or using mustQuery/mustCount) when destructuring `data`/`count` off an awaited Supabase query",
    },
    schema: [],
    messages: {
      swallowed:
        "`{{ name }}` is destructured off an await without binding `error`: a FAILED query resolves here as an empty result. Wrap the query in mustQuery()/mustCount() from @/lib/db/must-query, or bind `error` and handle it. If the swallow is deliberate (an authz probe that must fail closed), add an eslint-disable-next-line with the reason.",
    },
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        if (node.init?.type !== "AwaitExpression") return;
        if (node.id?.type !== "ObjectPattern") return;
        const props = node.id.properties.filter((p) => p.type === "Property");
        if (props.some((p) => p.key?.name === "error")) return;
        const target = props.find(
          (p) =>
            (p.key?.name === "data" && p.value?.type !== "ObjectPattern") ||
            p.key?.name === "count",
        );
        if (!target) return;
        context.report({
          node: target,
          messageId: "swallowed",
          data: { name: target.key.name },
        });
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      partyreel: { rules: { "no-swallowed-db-error": noSwallowedDbError } },
    },
    rules: {
      "partyreel/no-swallowed-db-error": "error",
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
  // Vendored third-party source. `src/components/vendor/**` holds packages copied
  // in verbatim under their own licence, with a standing instruction not to
  // restyle them: the whole value of vendoring border-beam was getting the
  // exact thing instead of our approximation of it. Linting code you have
  // contracted not to edit only produces noise, or worse, tempts an edit. Rules
  // that would flag OUR bugs (an effect calling setState, an unused local) are
  // upstream's call here. Anything we build ON one of these lives outside this
  // folder and is linted normally.
  {
    files: ["src/components/vendor/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // The Orchestrator's own folder (Will, 2026-09-20): notes, an atlas and its kit; never app source.
    "usher/**",
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
    // Cloudflare Workers (workers/*) are separately-deployed artifacts (Workers runtime, their own
    // tsconfig/types/deploy), NOT part of the Next app. They're linted within their own package.
    "workers/**",
  ]),
]);

export default eslintConfig;
