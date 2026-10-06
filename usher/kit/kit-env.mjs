// kit-env.mjs: what the kit's Node scripts share so they run alike on Will's Mac and a cloud seat (kit-env.sh is the
// zsh half). Nothing here names a machine: the repo is the checkout this file sits in, the env is its .env.local or the
// process's own, and Chrome is CHROME_PATH (a cloud seat's root needs a --no-sandbox wrapper; spawn-prompt-cloud.txt).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The checkout this kit sits in (the primary for the Orchestrator, a worktree for a lane testing the kit). */
export const REPO = execFileSync(
  "git",
  ["-C", HERE, "rev-parse", "--show-toplevel"],
  { encoding: "utf8" },
).trim();

/**
 * A value from this checkout's .env.local when it holds one, else from the primary checkout's (a lane's worktree on the
 * Mac often has none), else the process environment (a cloud seat holds the app's variables there); "" when none has it.
 * Never printed by the kit.
 */
export function envValue(name) {
  const files = [join(REPO, ".env.local")];
  try {
    const common = execFileSync(
      "git",
      ["-C", REPO, "rev-parse", "--path-format=absolute", "--git-common-dir"],
      { encoding: "utf8" },
    ).trim();
    files.push(join(dirname(common), ".env.local"));
  } catch {}
  for (const f of files) {
    try {
      const m = readFileSync(f, "utf8").match(
        new RegExp(`^${name}=(.*)$`, "m"),
      );
      if (m && m[1].trim()) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch {}
  }
  return process.env[name] ?? "";
}

const MAC_CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
/** The Chrome to start: CHROME_PATH, else the Mac's; exits 2 naming the variable when there is none. */
export function chromePath(who = "the kit") {
  const p = process.env.CHROME_PATH || MAC_CHROME;
  if (!existsSync(p)) {
    console.error(
      `${who} needs Chrome at ${p} (set CHROME_PATH; on a cloud seat, the --no-sandbox wrapper)`,
    );
    process.exit(2);
  }
  return p;
}

/**
 * The DevTools port a Chrome started with `--remote-debugging-port=0 --user-data-dir=<profile>` opened, read from the
 * profile's own `DevToolsActivePort` (lab-demo.mjs's way): it can only ever be the Chrome this script started, where a
 * port picked from a pid or at random could land on another lane's. Throws when Chrome exits or never writes it.
 */
export async function devToolsPort(profile, proc, timeoutMs = 20_000) {
  const t0 = Date.now();
  for (;;) {
    if (proc && (proc.exitCode !== null || proc.signalCode !== null))
      throw new Error(
        `Chrome exited (${proc.exitCode ?? proc.signalCode}) before it opened its debugging port`,
      );
    try {
      const n = Number(
        readFileSync(join(profile, "DevToolsActivePort"), "utf8")
          .split("\n")[0]
          .trim(),
      );
      if (Number.isInteger(n) && n > 0) return n;
    } catch {}
    if (Date.now() - t0 > timeoutMs)
      throw new Error("Chrome never wrote DevToolsActivePort");
    await new Promise((r) => setTimeout(r, 100));
  }
}
