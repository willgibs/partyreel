/**
 * THE WORKER'S DAILY HEARTBEAT (`export-ends`; `admin-observability.md`, Backend jobs: a job that persists
 * no run looks exactly like a healthy one once it stops).
 *
 * Once a day the Worker checks the three things a download needs from it: that it runs at all, that it can
 * read the bucket (`list`, one key), and that its signing secret is the app's (the ping is signed with it,
 * and the app verifies it before it records a thing). The app records the run as the `export` job
 * (`app/admin/jobs/catalog.ts`), whose switch is the exports' own `export_enabled`, so a dead, bucket-less
 * or mis-keyed Worker reads Missed or Failed on `/admin/jobs` and `/admin/exports` before a host finds out.
 *
 * ★ A CRON HAS NO TOKEN, SO ITS ADDRESS IS CONFIGURED (`HEARTBEAT_URLS`, space-separated, tried in order):
 * every app that could take it writes the one shared database, so the first that answers 2xx is enough.
 * partyreel.com first; the launch-prep alias behind it while partyreel.com's app has no report path yet.
 */
import { reportAddress, sendReport } from "./report";

export type HeartbeatEnv = {
  PRIMARY: {
    list(options: { limit?: number; prefix?: string }): Promise<unknown>;
  };
  EXPORT_SIGNING_SECRET?: string;
  EXPORT_MODE?: string;
  HEARTBEAT_URLS?: string;
};

/** The addresses the heartbeat may go to, in order; anything that is not a report address is dropped. */
export function heartbeatAddresses(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/\s+/)
    .map(reportAddress)
    .filter((url): url is string => url !== null);
}

/** One heartbeat: read the bucket, then hand the signed result to the first app that takes it. */
export async function beat(
  env: HeartbeatEnv,
  nowMs = Date.now(),
): Promise<boolean> {
  let r2: "ok" | "error" = "ok";
  try {
    await env.PRIMARY.list({ prefix: "events/", limit: 1 });
  } catch (error) {
    r2 = "error";
    console.error(
      JSON.stringify({ at: "export-heartbeat", r2: String(error) }),
    );
  }
  const mode = (env.EXPORT_MODE ?? "on") === "off" ? "off" : "on";
  for (const url of heartbeatAddresses(env.HEARTBEAT_URLS)) {
    const taken = await sendReport(url, env.EXPORT_SIGNING_SECRET, {
      v: 1,
      kind: "heartbeat",
      at: nowMs,
      mode,
      r2,
    });
    if (taken) return true;
  }
  // Nobody took it: the app's card goes Missed on its own, and the dashboard keeps this line.
  console.error(
    JSON.stringify({
      at: "export-heartbeat",
      error: "no app took the heartbeat",
    }),
  );
  return false;
}
