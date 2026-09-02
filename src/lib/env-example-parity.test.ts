import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * .env.example ↔ env.ts PARITY (the launch-runbook round, 2026-09-02).
 *
 * env.ts is the only place the app reads `process.env`, and .env.example is the
 * only instruction a human (or a fresh worktree) gets for filling `.env.local`
 * and the Vercel project env. They had drifted by THIRTEEN keys: the whole
 * Stripe price set (eight, including the annual trio the cutover depends on),
 * CRON_SECRET, the Resend pair, CONTACT_NOTIFY_EMAIL, UNLOCK_COOKIE_SECRET and
 * DESIGN_PREVIEW_KEY were readable in code and invisible in the template, so a
 * clean environment came up with the routes that need them failing closed and
 * nothing saying why.
 *
 * The pin, four ways:
 *   1. every var env.ts reads is declared in .env.example;
 *   2. nothing is declared there that no build- or runtime code reads (the
 *      three build-time Sentry vars are the ONLY exception, and each must
 *      still be read by next.config.ts, so the allow-list cannot rot);
 *   3. every declaration carries its own one-line comment (a section divider
 *      does not count) so the template stays self-explaining;
 *   4. the committed template carries no value shaped like a real credential.
 *
 * env.ts is deliberately NOT edited to satisfy this test: it is the source, the
 * template is the copy. Adding a var means adding it in three places (.env.local,
 * the Vercel project env, env.ts) and here.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const envTs = read("src/lib/env.ts");
const example = read(".env.example");
const nextConfig = read("next.config.ts");

// Next only inlines NEXT_PUBLIC_* by matching the literal text, so every read in
// env.ts is a literal `process.env.KEY` and this scan sees all of them. Comments
// are stripped first: env.ts's own doc comment writes `process.env.NEXT_PUBLIC_*`,
// which is prose about the rule, not a read.
const envTsCode = envTs
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");
const readVars = [
  ...new Set(
    [...envTsCode.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)].map(
      (m) => m[1],
    ),
  ),
].sort();

const lines = example.split("\n");
const declarations = lines
  .map((line, index) => ({
    line,
    index,
    key: /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1],
  }))
  .filter((d): d is { line: string; index: number; key: string } =>
    Boolean(d.key),
  );
const declaredVars = [...new Set(declarations.map((d) => d.key))].sort();

// Build-time only: next.config.ts reads these for the Sentry source-map upload;
// they never reach the app runtime, so env.ts must not carry them.
const BUILD_TIME_ONLY = ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"];

// Deliberately narrow shapes (the content-policy fence's doctrine: a false
// positive trains people to ignore the guard). Prefix + enough entropy to be a
// real value, so `sk_test_` in prose and `price_xxx` as a placeholder stay legal.
const CREDENTIAL_SHAPES: { why: string; re: RegExp }[] = [
  { why: "Stripe key", re: /^(sk|rk)_(test|live)_[A-Za-z0-9]{12,}/ },
  { why: "Stripe webhook secret", re: /^whsec_[A-Za-z0-9]{12,}/ },
  { why: "Stripe price id", re: /^price_[A-Za-z0-9]{12,}/ },
  { why: "Resend key", re: /^re_[A-Za-z0-9]{12,}/ },
  { why: "Supabase key", re: /^sb_(publishable|secret)_[A-Za-z0-9]{12,}/ },
  { why: "JWT", re: /^eyJ[A-Za-z0-9_-]{12,}/ },
  {
    why: "live Supabase project ref",
    re: /^https:\/\/[a-z]{15,}\.supabase\.co/,
  },
];

describe(".env.example parity with env.ts", () => {
  it("scanned both files", () => {
    // A scan that finds nothing passes every rule below in silence.
    expect(
      readVars.length,
      "no process.env reads found in env.ts",
    ).toBeGreaterThan(20);
    expect(
      declaredVars.length,
      "no keys found in .env.example",
    ).toBeGreaterThan(20);
  });

  it("declares every var env.ts reads", () => {
    const missing = readVars.filter((key) => !declaredVars.includes(key));
    expect(
      missing,
      `env.ts reads these, .env.example never mentions them:\n${missing.join("\n")}`,
    ).toEqual([]);
  });

  it("declares nothing the app does not read", () => {
    const extra = declaredVars.filter(
      (key) => !readVars.includes(key) && !BUILD_TIME_ONLY.includes(key),
    );
    expect(
      extra,
      `.env.example declares these, nothing reads them:\n${extra.join("\n")}`,
    ).toEqual([]);
    // The allow-list cannot rot: each build-time var stays read by next.config.ts.
    for (const key of BUILD_TIME_ONLY) {
      expect(
        nextConfig,
        `${key} is allow-listed but next.config.ts no longer reads it`,
      ).toContain(`process.env.${key}`);
    }
  });

  it("gives every declaration its own one-line comment", () => {
    const bare = declarations
      .filter((d) => {
        const above = lines[d.index - 1] ?? "";
        return !above.startsWith("#") || above.startsWith("# ---");
      })
      .map((d) => d.key);
    expect(
      bare,
      `These keys have no comment of their own directly above them ` +
        `(a "# --- section ---" divider does not count):\n${bare.join("\n")}`,
    ).toEqual([]);
  });

  it("carries no value shaped like a real credential", () => {
    const found: string[] = [];
    for (const { line, index, key } of declarations) {
      const value = line.slice(key.length + 1).trim();
      for (const { why, re } of CREDENTIAL_SHAPES) {
        if (re.test(value))
          found.push(`.env.example:${index + 1} ${key} [${why}]`);
      }
    }
    expect(
      found,
      `Real-looking values in the COMMITTED template (placeholders only):\n${found.join("\n")}`,
    ).toEqual([]);
  });
});
