/**
 * THE REEL AS A TIMELINE, AS DATA: her spent frames, the one she is on, the fresh ones, and this visit's shots on the
 * newest spent frames.
 */
import { describe, expect, it } from "vitest";

import { newestCell, reelCells, reelCentre, reelMinute } from "./reel";

const at = (h: number, m: number) => new Date(2026, 5, 13, h, m).getTime();

describe("reelCells", () => {
  it("lays the roll out frame by frame: spent, the one she is on, fresh", () => {
    const cells = reelCells({ cap: 5, used: 2, recording: false, recent: [] });
    expect(cells.map((c) => c.state)).toEqual([
      "exposed",
      "exposed",
      "current",
      "fresh",
      "fresh",
    ]);
    expect(reelCentre(cells)).toBe(3);
  });

  it("puts this visit's shots on the newest spent frames, with their minutes", () => {
    const cells = reelCells({
      cap: 6,
      used: 4,
      recording: false,
      recent: [
        { key: "a", takenAt: at(22, 33), kind: "photo", sending: false },
        {
          key: "b",
          takenAt: at(22, 41),
          kind: "video",
          seconds: 5.6,
          sending: true,
        },
      ],
    });
    expect(cells[0]).toEqual({ n: 1, state: "exposed" });
    expect(cells[1]).toEqual({ n: 2, state: "exposed" });
    expect(cells[2]).toEqual({
      n: 3,
      state: "exposed",
      shotKey: "a",
      minute: "10:33",
    });
    expect(cells[3]).toEqual({
      n: 4,
      state: "exposed",
      shotKey: "b",
      minute: "10:41",
      video: 6,
      sending: true,
    });
  });

  it("turns the frame she is on red while a video rolls", () => {
    const cells = reelCells({ cap: 3, used: 1, recording: true, recent: [] });
    expect(cells[1].state).toBe("rolling");
    expect(reelCentre(cells)).toBe(2);
  });

  it("has no live frame once the roll is spent, and centres on the last", () => {
    const cells = reelCells({ cap: 3, used: 3, recording: false, recent: [] });
    expect(cells.every((c) => c.state === "exposed")).toBe(true);
    expect(reelCentre(cells)).toBe(3);
  });

  it("never draws more of this visit's shots than frames are spent", () => {
    const recent = ["a", "b", "c"].map((key, i) => ({
      key,
      takenAt: at(22, i),
      kind: "photo" as const,
      sending: false,
    }));
    const cells = reelCells({ cap: 4, used: 2, recording: false, recent });
    expect(cells.filter((c) => c.shotKey).map((c) => c.shotKey)).toEqual([
      "b",
      "c",
    ]);
  });

  it("prints the party's minute on a twelve-hour clock", () => {
    expect(reelMinute(at(9, 5))).toBe("9:05");
    expect(reelMinute(at(0, 30))).toBe("12:30");
    expect(reelMinute(at(22, 41))).toBe("10:41");
  });
});

describe("newestCell", () => {
  const recent = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      key: `s${i}`,
      takenAt: Date.UTC(2026, 9, 6, 22, i),
      kind: "photo" as const,
      sending: false,
    }));

  it("is the last frame she spent, one left of the frame she is on, holding this visit's newest shot", () => {
    const cells = reelCells({
      cap: 24,
      used: 6,
      recording: false,
      recent: recent(2),
    });
    expect(newestCell(cells)).toMatchObject({ n: 6, shotKey: "s1" });
    expect(reelCentre(cells) - newestCell(cells)!.n).toBe(1);
  });

  it("is the reel's centre once the roll is spent, and none before a frame is spent", () => {
    const spent = reelCells({
      cap: 3,
      used: 3,
      recording: false,
      recent: recent(3),
    });
    expect(newestCell(spent)).toMatchObject({ n: 3, shotKey: "s2" });
    expect(reelCentre(spent)).toBe(3);
    expect(
      newestCell(reelCells({ cap: 24, used: 0, recording: false, recent: [] })),
    ).toBeUndefined();
    // An earlier visit's frame holds no shot of this one: no door is drawn on it.
    expect(
      newestCell(reelCells({ cap: 24, used: 4, recording: false, recent: [] }))
        ?.shotKey,
    ).toBeUndefined();
  });
});
