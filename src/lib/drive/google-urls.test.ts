/**
 * ONE ALLOWLIST OF GOOGLE'S ADDRESSES (drive-export.md, "Leaks"): every https address the app's Drive code and the
 * Worker can reach is Google's own, named once in `google-urls.ts` (or a page she is sent to at Google), so a token
 * can never be posted anywhere else by a typo or a later edit.
 *
 * ★ AND A GOOGLE ENTRY NEVER FEELS SCARY TO A FIRST-TIME USER (Will, 2026-10-05; drive-export.md, "The connection"):
 * signing up with Google asks only what sign-in needs, and Drive's permission is asked only by the Drive connect, after
 * our promise. So no file but the connect's own (`google-urls.ts`, read by `google.ts`) names a Drive scope, and every
 * `signInWithOAuth` asks for no extra scope, no offline access and no consent screen. Each check is run on a planted
 * violation too, so a check that stopped seeing would fail here.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DRIVE_FILE_SCOPE, DRIVE_SCOPES, GOOGLE_URLS } from "./google-urls";

const ROOT = process.cwd();
const ALLOWED_HOSTS = new Set([
  "accounts.google.com",
  "oauth2.googleapis.com",
  "www.googleapis.com",
  // Pages she is sent to (her Drive's folder, her storage, her connections), never called with a token.
  "drive.google.com",
  "one.google.com",
  "myaccount.google.com",
]);

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === "node_modules" || name === "dist" || name === ".wrangler")
      continue;
    if (statSync(path).isDirectory()) out.push(...filesUnder(path));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name))
      out.push(path);
  }
  return out;
}

const SCANNED = [
  "src/lib/drive",
  "src/app/api/drive",
  "src/app/api/internal/drive",
  "src/components/app/drive",
  "workers/drive/src",
].flatMap((dir) => filesUnder(join(ROOT, dir)));

describe("Google's addresses", () => {
  it("are https and Google's own, every one", () => {
    for (const url of Object.values(GOOGLE_URLS)) {
      const parsed = new URL(url);
      expect(parsed.protocol, url).toBe("https:");
      expect(ALLOWED_HOSTS.has(parsed.hostname), url).toBe(true);
    }
  });

  it("★ are the only addresses the Drive code and the Worker name", () => {
    expect(SCANNED.length).toBeGreaterThan(20);
    for (const file of SCANNED) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/https:\/\/([a-z0-9.-]+)/gi)) {
        const host = match[1]!.toLowerCase();
        // Comments may cite Google's docs; code may not call them.
        if (host === "developers.google.com" || host === "support.google.com")
          continue;
        expect(
          ALLOWED_HOSTS.has(host),
          `${file.replace(ROOT, "")}: ${host}`,
        ).toBe(true);
      }
    }
  });

  it("asks for drive.file and nothing wider", () => {
    expect(DRIVE_SCOPES).toEqual(["openid", "email", DRIVE_FILE_SCOPE]);
    expect(DRIVE_FILE_SCOPE).toBe("https://www.googleapis.com/auth/drive.file");
    for (const file of SCANNED) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /auth\/drive(?:\.readonly|\.metadata|\.appdata)?["'`\s]/,
      );
    }
  });
});

// ── A Google entry never feels scary ────────────────────────────────────────────────────────────

type Source = { path: string; text: string };

/** Every source file of the app and the Worker, tests left out (a fixture may name a scope; code may not). */
const EVERY_SOURCE: Source[] = ["src", "workers/drive/src"]
  .flatMap((dir) => filesUnder(join(ROOT, dir)))
  .map((file) => ({
    path: file.replace(`${ROOT}/`, ""),
    text: readFileSync(file, "utf8"),
  }));

/** The Drive connect's own: where its scopes are named, and the one module that reads them (the consent URL). */
const SCOPE_HOME = "src/lib/drive/google-urls.ts";
const SCOPE_READER = "src/lib/drive/google.ts";

/** The files that name a Drive scope, or read the connect's scope constants, outside the Drive connect. */
function driveScopeOutsiders(sources: readonly Source[]): string[] {
  return sources
    .filter(({ path, text }) => {
      if (path === SCOPE_HOME) return false;
      const names = /\bauth\/drive\b/.test(text);
      const reads =
        path !== SCOPE_READER && /\bDRIVE_(?:FILE_)?SCOPES?\b/.test(text);
      return names || reads;
    })
    .map(({ path }) => path);
}

/** Each `signInWithOAuth(...)` call's argument, its parentheses balanced. */
function oauthCalls(text: string): string[] {
  const calls: string[] = [];
  for (const m of text.matchAll(/\bsignInWithOAuth\s*\(/g)) {
    let depth = 1;
    let i = m.index! + m[0].length;
    const from = i;
    for (; i < text.length && depth > 0; i++) {
      if (text[i] === "(") depth++;
      else if (text[i] === ")") depth--;
    }
    calls.push(text.slice(from, i - 1));
  }
  return calls;
}

/** What a sign-in asks Google for beyond sign-in itself: a scope, offline access, a consent screen. */
function signInExtras(text: string): string[] {
  const extras: string[] = [];
  for (const call of oauthCalls(text)) {
    if (/\bscopes\s*:/.test(call)) extras.push("scopes");
    if (/\baccess_type\b/.test(call)) extras.push("access_type");
    if (/\binclude_granted_scopes\b/.test(call))
      extras.push("include_granted_scopes");
    for (const p of call.matchAll(/\bprompt\s*:\s*["'`]([^"'`]*)["'`]/g))
      if (p[1] !== "select_account") extras.push(`prompt ${p[1]}`);
    if (/\bprompt\s*:\s*[^"'`\s]/.test(call)) extras.push("prompt (computed)");
  }
  return extras;
}

describe("a Google entry for a first-time user", () => {
  it("★ names a Drive scope nowhere but the Drive connect's own", () => {
    expect(EVERY_SOURCE.length).toBeGreaterThan(500);
    expect(EVERY_SOURCE.some((s) => s.path === SCOPE_HOME)).toBe(true);
    expect(driveScopeOutsiders(EVERY_SOURCE)).toEqual([]);
    // Planted: sign-in asking for Drive, and a page reading the connect's scopes.
    expect(
      driveScopeOutsiders([
        {
          path: "src/components/auth/account-door.tsx",
          text: 'options: { scopes: "https://www.googleapis.com/auth/drive.file" }',
        },
        {
          path: "src/components/app/onboarding/welcome.tsx",
          text: 'import { DRIVE_SCOPES } from "@/lib/drive/google-urls";',
        },
        {
          path: SCOPE_READER,
          text: "url.searchParams.set('scope', DRIVE_SCOPES.join(' '));",
        },
      ]),
    ).toEqual([
      "src/components/auth/account-door.tsx",
      "src/components/app/onboarding/welcome.tsx",
    ]);
  });

  it("★ signs up and in with Google asking nothing more than sign-in: no scope, no offline access, no consent", () => {
    const callers = EVERY_SOURCE.filter((s) => oauthCalls(s.text).length > 0);
    expect(callers.map((s) => s.path)).toContain(
      "src/components/auth/account-door.tsx",
    );
    for (const s of callers) expect(signInExtras(s.text), s.path).toEqual([]);
    // Planted: each way a sign-in could start asking for more.
    expect(
      signInExtras(
        'supabase.auth.signInWithOAuth({ provider: "google", options: { scopes: "https://www.googleapis.com/auth/drive.file" } })',
      ),
    ).toEqual(["scopes"]);
    expect(
      signInExtras(
        'supabase.auth.signInWithOAuth({ provider: "google", options: { queryParams: { access_type: "offline", prompt: "consent" } } })',
      ),
    ).toEqual(["access_type", "prompt consent"]);
    expect(
      signInExtras(
        "supabase.auth.signInWithOAuth({ provider: 'google', options: { queryParams: { prompt: wanted } } })",
      ),
    ).toEqual(["prompt (computed)"]);
    // Sign-in's own chooser, hinted, is no extra.
    expect(
      signInExtras(
        'supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: to, ...(hint ? { queryParams: { login_hint: hint, prompt: "select_account" } } : {}) } })',
      ),
    ).toEqual([]);
  });
});
