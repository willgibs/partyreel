/**
 * ★ A REMOTE BASE RUNS ON VERCEL (2026-10-04). Every page a lab script presses on the alias or partyreel.com is a
 * server render billed against Hobby's 4 Active CPU-hours a rolling 30 days, and a break pauses every function of the
 * team (Vercel unlocked the account once already). Local first: a remote run reads the team's load
 * (`usher/kit/vercel-usage.mjs`) and refuses past its line unless `LAB_VERCEL_OK=1` says Will asked for this run.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function guardRemoteBase(base, label) {
  if (LOCAL.test(base)) return;
  const reading = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("../usher/kit/vercel-usage.mjs", import.meta.url))],
    { encoding: "utf8" },
  );
  process.stdout.write(reading.stdout ?? "");
  if (reading.status === 0 || reading.status === 2) return;
  if (process.env.LAB_VERCEL_OK === "1") {
    console.log(`${label}: past the Vercel line, run on Will's word (LAB_VERCEL_OK=1)`);
    return;
  }
  console.error(
    `${label} refuses a Vercel base past the line above: run it against a local server ` +
      "(`pnpm build && pnpm start`), or set LAB_VERCEL_OK=1 when Will asks for this run by name.",
  );
  process.exit(2);
}
