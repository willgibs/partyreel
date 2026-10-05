/**
 * ONE ALLOWLIST OF GOOGLE'S ADDRESSES (drive-export.md, "Leaks"): every https address the app's Drive code and the
 * Worker can reach is Google's own, named once in `google-urls.ts` (or a page she is sent to at Google), so a token
 * can never be posted anywhere else by a typo or a later edit.
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
    if (name === "node_modules" || name === "dist" || name === ".wrangler") continue;
    if (statSync(path).isDirectory()) out.push(...filesUnder(path));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(path);
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
        if (host === "developers.google.com" || host === "support.google.com") continue;
        expect(ALLOWED_HOSTS.has(host), `${file.replace(ROOT, "")}: ${host}`).toBe(true);
      }
    }
  });

  it("asks for drive.file and nothing wider", () => {
    expect(DRIVE_SCOPES).toEqual(["openid", "email", DRIVE_FILE_SCOPE]);
    expect(DRIVE_FILE_SCOPE).toBe("https://www.googleapis.com/auth/drive.file");
    for (const file of SCANNED) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/auth\/drive(?:\.readonly|\.metadata|\.appdata)?["'`\s]/);
    }
  });
});
