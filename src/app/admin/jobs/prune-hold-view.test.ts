/**
 * WHAT THE BACKUP PRUNE'S CARD SAYS OF A HOLD (durability-backups.md, "The deletion-aware prune"): read from the
 * prune's last report (the Worker reports a standing hold on every run, `held_since` exact) and the operator's
 * release stamp, judged as the Worker judges it: a release counts only when pressed after the hold began. A hold
 * with no such release offers Release the hold; a hold released says the next run goes ahead; anything else is no
 * hold at all.
 */
import { describe, expect, it } from "vitest";

import { pruneHoldView } from "@/app/admin/jobs/prune-hold-view";

const SINCE = "2026-10-12T06:00:01.250Z";
const SINCE_MS = Date.parse(SINCE);
const HELD = {
  remaining: 4_002,
  gone_media: 2_001,
  hold_threshold: 2_000,
  held_since: SINCE,
  held_media: 2_001,
  breaker_tripped: true,
  mode: "live",
};

describe("pruneHoldView", () => {
  it("offers the release for a standing hold, with what it held", () => {
    expect(pruneHoldView({ counts: HELD, releasedAtMs: null })).toEqual({
      kind: "held",
      heldSinceMs: SINCE_MS,
      heldMedia: 2_001,
      heldKeys: 4_002,
      threshold: 2_000,
    });
  });

  it("says released once a release was pressed after the hold began, to the millisecond", () => {
    expect(pruneHoldView({ counts: HELD, releasedAtMs: SINCE_MS + 1 })).toEqual(
      { kind: "released", releasedAtMs: SINCE_MS + 1 },
    );
  });

  it("still offers it when the only release predates the hold: a new hold needs a new press", () => {
    for (const releasedAtMs of [SINCE_MS - 86_400_000, SINCE_MS]) {
      expect(pruneHoldView({ counts: HELD, releasedAtMs })?.kind).toBe("held");
    }
  });

  it("offers it from a run that aborted while the hold stood, with the count the hold kept", () => {
    expect(
      pruneHoldView({
        counts: {
          scanned: 4_000,
          mode: "live",
          deleted: 0,
          held_since: SINCE,
          held_media: 2_001,
        },
        releasedAtMs: null,
      }),
    ).toEqual({
      kind: "held",
      heldSinceMs: SINCE_MS,
      heldMedia: 2_001,
      heldKeys: null,
      threshold: null,
    });
  });

  it("shows no hold for a run that reported none, or a report it cannot read", () => {
    for (const counts of [
      { deleted: 41, mode: "live" },
      { would_hold: true, mode: "dryrun" },
      { breaker_tripped: true },
      { held_since: "yesterday" },
      { held_since: 1_791_000_000_000 },
      null,
      [],
    ]) {
      expect(
        pruneHoldView({ counts, releasedAtMs: null }),
        JSON.stringify(counts),
      ).toBeNull();
    }
  });
});
