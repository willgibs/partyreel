/**
 * WHAT THE BACKUP RECONCILE'S CARD SAYS OF ITS PASS (reconcile-view.ts): how far the pass has come and whether this run
 * ended it, when the last whole pass ended, and each thing that waits on a person, read from the report the Worker
 * sends. The count keys are the Worker's (workers/backup/src/reconcile-run.ts), asserted here as its own suite does.
 */
import { describe, expect, it } from "vitest";

import { RECONCILE_KEYS, reconcileView } from "./reconcile-view";

const STARTED = "2026-10-05T05:00:00.000Z";

describe("reconcileView", () => {
  it("pins the keys the Worker writes (its suite asserts the same strings)", () => {
    expect(RECONCILE_KEYS).toEqual({
      checked: "checked",
      copied: "copied",
      failed: "failed",
      tooLarge: "too_large",
      copiesLeft: "copies_left",
      mismatched: "mismatched",
      absent: "absent_from_primary",
      youngAbsent: "young_absent",
      loneFound: "lone_found",
      loneUnjudged: "lone_unjudged",
      passComplete: "pass_complete",
      passWalked: "pass_walked",
      passStartedAt: "pass_started_at",
      lastPassAt: "last_pass_at",
      lastPassWalked: "last_pass_walked",
      stoppedEarly: "stopped_early",
      breakerTripped: "breaker_tripped",
    });
  });

  it("★ says a pass this run ended, and the last whole pass, in words", () => {
    expect(
      reconcileView({
        checked: 5_862,
        copied: 0,
        pass_complete: true,
        pass_walked: 5_862,
        pass_started_at: STARTED,
        last_pass_at: "2026-10-05T05:00:09.000Z",
        last_pass_walked: 5_862,
        absent_from_primary: 654,
        young_absent: 611,
        lone_found: 0,
        primary_missing: 0,
      }),
    ).toEqual({
      pass: {
        tone: "done",
        text: "Complete: 5,862 keys compared with the backup, every one backed up",
      },
      lastPass: { tone: "quiet", text: "Oct 5, 2026, 05:00 UTC, 5,862 keys" },
      lines: [
        {
          tone: "quiet",
          text: "611 young keys in the backup the primary no longer holds, each asked of the app: 0 named by a live row",
        },
      ],
    });
  });

  it("★ reads a pass that spans runs as one carried on, from when it began, and says no pass has ended yet", () => {
    const view = reconcileView({
      checked: 40_000,
      copied: 12,
      pass_complete: false,
      pass_walked: 80_000,
      pass_started_at: STARTED,
      stopped_early: true,
    });
    expect(view?.pass).toEqual({
      tone: "attention",
      text: "In progress: 80,000 keys compared since Oct 5, 2026, 05:00 UTC; the next run carries on (12 copied this run)",
    });
    expect(view?.lastPass).toEqual({
      tone: "attention",
      text: "None has reached the end yet",
    });
  });

  it("★ says every thing that waits on a person, each with its remedy", () => {
    const view = reconcileView({
      checked: 10,
      copied: 3,
      failed: 1,
      too_large: 1,
      mismatched: 2,
      breaker_tripped: true,
      young_absent: 5,
      lone_found: 2,
      lone_unjudged: 3,
      pass_complete: true,
      pass_walked: 10,
      pass_started_at: STARTED,
    });
    expect(view?.pass.text).toBe(
      "Complete: 10 keys compared with the backup, 3 copied that the live queue missed",
    );
    expect(view?.lines).toEqual([
      {
        tone: "attention",
        text: "1 key failed to copy: the next pass tries again (its note says why)",
      },
      {
        tone: "attention",
        text: "1 key past one run's copy reach: copy by hand from partyreel into partyreel-backup (the run's log names each)",
      },
      {
        tone: "attention",
        text: "2 keys differ between the buckets (size or checksum): left as they are, never overwritten; a person decides which copy is good (the run's log names each)",
      },
      {
        tone: "attention",
        text: "2 young keys held by the backup alone: the backup restore copies them back (Held by the backup alone, above)",
      },
      {
        tone: "attention",
        text: "3 young keys not yet judged (the app could not say which a live row names): the next pass asks again",
      },
      {
        tone: "quiet",
        text: "5 young keys in the backup the primary no longer holds, each asked of the app: 2 named by a live row",
      },
    ]);
  });

  it("never says every one was backed up beside a copy it could not make", () => {
    expect(
      reconcileView({
        copied: 0,
        failed: 2,
        pass_complete: true,
        pass_walked: 9,
        pass_started_at: STARTED,
      })?.pass.text,
    ).toBe("Complete: 9 keys compared with the backup");
  });

  it("draws nothing for a run from before the pass, so its raw counts stand", () => {
    expect(
      reconcileView({ capped: false, copied: 0, failed: 0, checked: 3_419 }),
    ).toBeNull();
    expect(reconcileView(null)).toBeNull();
    expect(reconcileView([1])).toBeNull();
  });
});
