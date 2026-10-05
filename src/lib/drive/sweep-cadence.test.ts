/**
 * ★ THE DRIVE SWEEP'S CADENCE IS ONE DECISION (drive-export.md, "The sweep"): every sweep is a Vercel function, so its
 * clock was set by its measured cost (fifteen minutes). The deployed Worker's cron, the local walk's and /admin/jobs'
 * card name the same clock, so the missed-run rule judges the real one; and the heartbeat, written on the first sweep
 * an hour on, still lands inside the card's Overdue line.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { JOBS, MISSED_GRACE_MULTIPLIER } from "@/app/admin/jobs/catalog";

const ROOT = process.cwd();
const cronOf = (file: string) =>
  /"crons":\s*\[\s*"([^"]+)"\s*\]/.exec(
    readFileSync(join(ROOT, "workers", "drive", file), "utf8"),
  )?.[1];

describe("the Drive sweep's clock", () => {
  it("is the same in the deployed Worker, the local walk and the jobs card", () => {
    const deployed = cronOf("wrangler.jsonc");
    expect(deployed).toBe("*/15 * * * *");
    expect(cronOf("wrangler.walk.jsonc")).toBe(deployed);
    expect(JOBS.find((j) => j.id === "drive_export")?.cron).toBe(deployed);
  });

  it("keeps the hourly heartbeat inside the Overdue line (a run is late at half a cadence over)", () => {
    const job = JOBS.find((j) => j.id === "drive_export")!;
    const stepMinutes = Number(/^\*\/(\d+) /.exec(job.cron ?? "")?.[1]);
    // The route writes a heartbeat on the first sweep 55 minutes or more after the last one.
    const latestHeartbeatMs = (55 + stepMinutes) * 60_000;
    expect(latestHeartbeatMs).toBeLessThan(
      job.expectedEveryMs * MISSED_GRACE_MULTIPLIER,
    );
    const route = readFileSync(
      join(ROOT, "src", "app", "api", "internal", "drive", "sweep", "route.ts"),
      "utf8",
    );
    expect(route).toContain("const HEARTBEAT_EVERY_MS = 55 * 60 * 1000;");
  });
});
