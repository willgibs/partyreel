/**
 * WHAT THE STORAGE SUMS' CARD SAYS (storage-sums-signal): where the pass stands, when one last ended, and each drifted
 * host's figures in words, only what disagrees, decided from the check's record.
 */
import { describe, expect, it } from "vitest";

import { differsOf, storageSumsView } from "@/app/admin/jobs/storage-sums-view";
import type { DriftFinding } from "@/lib/lifecycle/sweeps/storage-sums-state";

const HOST = "6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b";

function finding(over: Partial<DriftFinding> = {}): DriftFinding {
  return {
    host_id: HOST,
    summary_active: 1_000,
    summary_deleted: 40,
    summary_system: 0,
    walk_active: 1_000,
    walk_deleted: 40,
    walk_system: 0,
    events: 0,
    total: false,
    since: "2026-10-07T04:01:00.000Z",
    ...over,
  };
}

describe("storageSumsView", () => {
  it("reads a whole clean pass as done, and its end as the last full pass", () => {
    expect(
      storageSumsView({
        checked: 3,
        drifted: 0,
        pass_checked: 3,
        pass_complete: true,
        last_pass_at: "2026-10-07T04:01:00.000Z",
        last_pass_checked: 3,
      }),
    ).toEqual({
      pass: {
        tone: "done",
        text: "Complete: 3 hosts checked, every one's sums the walk",
      },
      lastPass: { tone: "quiet", text: "Oct 7, 2026, 04:01 UTC, 3 hosts" },
      hosts: [],
      more: 0,
    });
  });

  it("★ reads a pass in progress, and no pass ever ended, as waiting on someone", () => {
    const view = storageSumsView({
      checked: 50,
      pass_checked: 900,
      pass_complete: false,
      pass_started_at: "2026-10-05T04:00:00.000Z",
      stopped_early: true,
      remaining: 100,
      resume_after: HOST,
    });
    expect(view?.pass).toEqual({
      tone: "attention",
      text: "In progress: 900 hosts checked since Oct 5, 2026, 04:00 UTC, 100 left; the next run carries on",
    });
    expect(view?.lastPass).toEqual({
      tone: "attention",
      text: "None has reached the last host yet",
    });
  });

  it("lists each drifted host with what disagrees, and counts the rest", () => {
    const view = storageSumsView({
      checked: 3,
      drifted: 3,
      pass_checked: 3,
      pass_complete: true,
      unlisted: 2,
      findings: [finding({ summary_active: 1_012 })],
    });
    expect(view?.pass).toEqual({
      tone: "attention",
      text: "Complete: 3 hosts checked, 3 hosts drifted (below)",
    });
    expect(view?.hosts).toEqual([
      {
        hostId: HOST,
        differs: ["Albums 1,012 B by the sums, 1,000 B walked"],
        since: "2026-10-07T04:01:00.000Z",
      },
    ]);
    expect(view?.more).toBe(2);
  });

  it("has nothing to say of a row that is not the check's record", () => {
    expect(storageSumsView(null)).toBeNull();
    expect(storageSumsView({ checked: 2 })).toBeNull();
  });
});

describe("differsOf", () => {
  it("says every part that disagrees, and something even when the figures agree", () => {
    expect(
      differsOf(finding({ summary_active: 5_242_880, walk_active: 5_242_881 })),
    ).toEqual([
      "Albums 5 MB (5,242,880 B) by the sums, 5 MB (5,242,881 B) walked",
    ]);
    expect(
      differsOf(finding({ summary_system: 7, events: 1, total: true })),
    ).toEqual([
      "The system's share 7 B by the sums, 0 B walked",
      "1 of her event rows differs from her items by event",
      "Her total differs from her event rows",
    ]);
    expect(differsOf(finding())).toEqual([
      "Her sum rows differ from her items",
    ]);
  });
});
