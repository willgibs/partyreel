/**
 * ONE EXPORT, AS FAR AS ANYONE SAW IT (`outcome-word.ts`, `export-ends`): a mint is never "Downloaded" on its
 * own word any more; the row says the Worker's (saved, short, stopped, failed, nothing left, downloading, its
 * check), or only "Started" where no word came, and tints only what went wrong.
 */
import { describe, expect, it } from "vitest";

import type { WorkerWord } from "@/lib/db/queries/exports";

import { outcomeWord } from "./outcome-word";

const SILENT: WorkerWord = {
  checkedAt: null,
  checkFound: null,
  streamStartedAt: null,
  streamEndedAt: null,
  streamOutcome: null,
  streamFiles: null,
  streamMissing: [],
};
const AT = "2026-10-01T12:00:00.000000+00:00";

const minted = (worker: Partial<WorkerWord>) =>
  outcomeWord({
    outcome: "minted",
    itemCount: 2000,
    worker: { ...SILENT, ...worker },
  });

describe("an export's outcome on /admin/exports", () => {
  it("★ a mint with no word from the Worker says it started, never that it downloaded", () => {
    expect(minted({})).toEqual({ label: "Started", badge: "outline" });
  });

  it("says the Worker's word on the stream, tinting only what did not arrive whole", () => {
    const ended = (
      o: WorkerWord["streamOutcome"],
      more: Partial<WorkerWord> = {},
    ) =>
      minted({
        streamStartedAt: AT,
        streamEndedAt: AT,
        streamOutcome: o,
        ...more,
      });
    expect(ended("saved")).toEqual({ label: "Saved", badge: "success" });
    expect(ended("short", { streamMissing: ["a", "b"] })).toEqual({
      label: "Short, 2 gone",
      badge: "warning",
      row: "warning",
    });
    expect(ended("stopped", { streamFiles: 812 })).toEqual({
      label: "Stopped at 812 of 2,000",
      badge: "warning",
    });
    expect(ended("failed", { streamFiles: 3 })).toEqual({
      label: "Failed at 3 of 2,000",
      badge: "destructive",
      row: "destructive",
    });
    expect(minted({ streamEndedAt: AT, streamOutcome: "empty" })).toEqual({
      label: "Nothing left",
      badge: "warning",
      row: "warning",
    });
    expect(minted({ streamStartedAt: AT })).toEqual({
      label: "Downloading",
      badge: "info",
    });
  });

  it("says what the Worker's check found where no stream followed", () => {
    expect(minted({ checkedAt: AT, checkFound: 2000 })).toEqual({
      label: "Checked",
      badge: "outline",
    });
    expect(minted({ checkedAt: AT, checkFound: 1994 })).toEqual({
      label: "Checked, 1,994 of 2,000",
      badge: "warning",
      row: "warning",
    });
    expect(minted({ checkedAt: AT, checkFound: 0 })).toMatchObject({
      label: "Nothing left",
    });
    expect(minted({ checkedAt: AT, checkFound: null })).toEqual({
      label: "Check failed",
      badge: "destructive",
      row: "destructive",
    });
  });

  it("keeps the mint's own refusals in their words", () => {
    for (const [outcome, label] of [
      ["rejected_mode", "Paused"],
      ["rejected_cap", "Too large"],
      ["rejected_empty", "Empty"],
      ["rate_limited", "Rate limited"],
      ["something_new", "something_new"],
    ]) {
      expect(outcomeWord({ outcome, itemCount: 0, worker: SILENT })).toEqual({
        label,
        badge: "warning",
        row: "warning",
      });
    }
  });
});
