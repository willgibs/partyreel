import { describe, expect, it } from "vitest";

import { JOBS, jobHealth, type JobHealth } from "@/app/admin/jobs/catalog";
import { HEALTH_BADGE, healthRow, runBadge, runRow } from "@/lib/admin/tone";

/**
 * HOW FAR A STATE'S COLOUR TRAVELS (admin-wiring, 2026-09-20; `colour=rows`
 * with his note, "Makes it a bit harder to miss").
 *
 * The portal had one state colour, red, so healthy, paused, running and
 * never-run all shared a grey. Four voices now, and the strongest of them
 * reaches the row. What is pinned is that the two halves cannot disagree (a
 * chip and the row under it are one decision, read from one module), that every
 * health the catalog can produce has a voice, and that the tint is RARE.
 */

describe("every state has a voice", () => {
  it("covers every health the catalog can return", () => {
    // `jobHealth` is the one producer, and a new state added there without a
    // chip here would render as undefined: a chip with no variant at all.
    const states: JobHealth[] = [
      "ok",
      "running",
      "paused",
      "missed",
      "failed",
      "attention",
      "never",
    ];
    for (const state of states) {
      expect(HEALTH_BADGE[state], `${state} has no chip`).toBeTruthy();
    }
    expect(Object.keys(HEALTH_BADGE).sort()).toEqual([...states].sort());
  });

  it("speaks the four the board ruled, and keeps paused out of them", () => {
    expect(HEALTH_BADGE.ok).toBe("success");
    // Blue: the board's fourth colour, for the one state that is neither good
    // nor bad but in progress.
    expect(HEALTH_BADGE.running).toBe("info");
    expect(HEALTH_BADGE.failed).toBe("destructive");
    expect(HEALTH_BADGE.missed).toBe("warning");
    // Pausing is a decision an operator made, not a state of the machine, and
    // colouring it would make a switch look broken.
    expect(HEALTH_BADGE.paused).toBe("outline");
    expect(HEALTH_BADGE.never).toBe("outline");
  });
});

describe("the tint is rare, on purpose", () => {
  it("reaches the row only where finding it by scrolling is the point", () => {
    expect(healthRow("failed")).toBe("destructive");
    expect(healthRow("missed")).toBe("warning");
    // Green on every healthy row would hide the one red among forty.
    expect(healthRow("ok")).toBeUndefined();
    expect(healthRow("running")).toBeUndefined();
    expect(healthRow("paused")).toBeUndefined();
    expect(healthRow("never")).toBeUndefined();
  });

  it("tints a failed RUN and nothing else in the run table", () => {
    expect(runRow("error")).toBe("destructive");
    for (const status of ["ok", "running", "skipped"]) {
      expect(runRow(status)).toBeUndefined();
    }
  });

  it("gives a run's outcome a chip, and an unknown status a quiet one", () => {
    expect(runBadge("ok")).toBe("success");
    expect(runBadge("error")).toBe("destructive");
    expect(runBadge("running")).toBe("info");
    expect(runBadge("skipped")).toBe("outline");
    expect(runBadge("something-new")).toBe("outline");
  });
});

describe("the chip and the row read one module", () => {
  it("never gives a row a tone its chip does not have", () => {
    // Both halves come from the same table, so a failure cannot be red in a
    // chip and amber in the row beneath it.
    for (const def of JOBS) {
      const health = jobHealth({
        def,
        enabled: false,
        lastRun: null,
        lastFinishedAtMs: null,
        nowMs: Date.now(),
      });
      const row = healthRow(health);
      if (row) expect(row).toBe(HEALTH_BADGE[health]);
    }
  });
});
