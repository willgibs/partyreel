import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ★ VERCEL INSTALLS WITH THE PNPM THAT WROTE THE LOCKFILE (build 34, 2026-10-01).
 *
 * A lockfile at version 9.0 can be pnpm 9's or pnpm 10's, and with no pin Vercel
 * picks by the project's creation date: pnpm 10 here. pnpm 10 hashes a patch
 * differently from pnpm 9, so its frozen install refused the lockfile pnpm 9
 * wrote for `patches/next@16.2.6.patch` (ERR_PNPM_LOCKFILE_CONFIG_MISMATCH),
 * while local and CI, both on pnpm 9, stayed green: nothing short of a deploy
 * saw it. `packageManager` is the pin's one home. Vercel takes its major
 * without Corepack, and CI's pnpm/action-setup takes the exact version, so the
 * pin must name the pnpm that runs here. Moving to another major means the
 * lockfile is rewritten by that pnpm, and the pin moves with it.
 */

const pin = (
  JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
    packageManager?: string;
  }
).packageManager;

describe("the pnpm pin", () => {
  it("names an exact pnpm in package.json", () => {
    expect(pin).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
  });

  it("is the pnpm running this test, the one that writes the lockfile", () => {
    // `pnpm test` sets the agent ("pnpm/9.14.4 npm/? node/…"); a bare vitest run has no pnpm to compare.
    const running = /^pnpm\/(\d+\.\d+\.\d+)/.exec(
      process.env.npm_config_user_agent ?? "",
    )?.[1];
    if (running) expect(pin).toBe(`pnpm@${running}`);
  });
});
