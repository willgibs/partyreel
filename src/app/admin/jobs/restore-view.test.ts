/**
 * WHAT THE BACKUP RESTORE'S CARD SAYS OF ITS LAST PASS (restore-view.ts): its mode, what it copied back, what it could
 * not and why (each a line that waits on a person), and what it left alone, read from the report the Worker sends. The
 * count keys are the Worker's (workers/backup/src/restore-run.ts), asserted here as its own suite asserts them.
 */
import { describe, expect, it } from "vitest";

import { RESTORE_MODE_WORDS, restoreView } from "./restore-view";

describe("restoreView", () => {
  it("★ says what a pass copied back, and every key it could not, each why", () => {
    expect(
      restoreView({
        restore_mode: "on",
        restored: 3,
        restored_bytes: 12 * 1024 * 1024,
        checked: 9,
        failed: 1,
        too_large: 1,
        backup_missing: 1,
        present: 2,
        unnamed: 1,
        primary_missing: 3,
      }),
    ).toEqual({
      mode: "on",
      modeWords: RESTORE_MODE_WORDS.on,
      lines: [
        { tone: "done", text: "Restored 3 keys (12 MB)" },
        {
          tone: "attention",
          text: "1 key failed to copy: the next pass tries again (its note says why)",
        },
        {
          tone: "attention",
          text: "1 key over the 4.99 GB one conditional write takes: copy by hand",
        },
        {
          tone: "attention",
          text: "1 key gone from the backup too: a row names an object neither bucket holds",
        },
        {
          tone: "quiet",
          text: "2 keys in the primary already, left as they are",
        },
        { tone: "quiet", text: "1 key named by no live row, left alone" },
      ],
    });
  });

  it("reads a dry run's keys as waiting on RESTORE_MODE, and a pass cut short as work left", () => {
    expect(
      restoreView({ restore_mode: "dryrun", would_restore: 2, checked: 2 })
        ?.lines,
    ).toEqual([
      {
        tone: "attention",
        text: "Would restore 2 keys: RESTORE_MODE on copies them back",
      },
    ]);
    expect(
      restoreView({
        restore_mode: "on",
        restored: 2000,
        checked: 2000,
        remaining: 40,
        stopped_early: true,
      })?.lines.at(-1),
    ).toEqual({
      tone: "attention",
      text: "Stopped with 40 keys to go: the next pass carries on",
    });
  });

  it("says when nothing was held, and says nothing more of a switched-off pass than its mode", () => {
    expect(
      restoreView({ restore_mode: "on", restored: 0, checked: 0 })?.lines,
    ).toEqual([
      { tone: "quiet", text: "Nothing was held by the backup alone" },
    ]);
    expect(restoreView({ restore_mode: "off", primary_missing: 4 })).toEqual({
      mode: "off",
      modeWords: RESTORE_MODE_WORDS.off,
      lines: [],
    });
  });

  it("draws nothing for a report that is not a pass's (a pause's skipped row, an older Worker's)", () => {
    for (const counts of [
      null,
      undefined,
      [],
      "x",
      {},
      { restored: 2 },
      { restore_mode: "live" },
    ]) {
      expect(restoreView(counts), JSON.stringify(counts)).toBeNull();
    }
  });

  it("reads a number it cannot trust as none, never as a count", () => {
    expect(
      restoreView({ restore_mode: "on", restored: "3", failed: -1, checked: 0 })
        ?.lines,
    ).toEqual([
      { tone: "quiet", text: "Nothing was held by the backup alone" },
    ]);
  });
});
