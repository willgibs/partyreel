import { describe, expect, it } from "vitest";

import {
  EMPTY_LEDGER,
  PRUNE_HOLD_FLOOR_MEDIA,
  PRUNE_HOLD_HISTORY_RUNS,
  PRUNE_HOLD_MULTIPLIER,
  decideHold,
  holdThreshold,
  nextLedger,
  parseLedger,
  usualGoneMedia,
  type PruneLedger,
  type PruneRunRecord,
} from "./prune-ledger";

const NOW = Date.UTC(2026, 9, 5, 6);
const DAY = 86_400_000;
const CURSOR =
  "events/0000000e-0000-4000-8000-000000000001/photo/00000000-0000-4000-8000-000000000002/original.jpg";

const runs = (...gone: number[]): PruneRunRecord[] =>
  gone.map((g, i) => ({
    atMs: NOW - (gone.length - i) * 7 * DAY,
    goneMedia: g,
    live: true,
  }));

describe("parseLedger: what the store held, made safe to act on", () => {
  it("reads nothing stored as the head of the listing, no history and no hold", () => {
    expect(parseLedger(null)).toEqual({ ledger: EMPTY_LEDGER });
    expect(parseLedger(undefined)).toEqual({ ledger: EMPTY_LEDGER });
  });

  it("keeps a well-formed ledger as it was", () => {
    const stored: PruneLedger = {
      v: 1,
      cursor: CURSOR,
      history: runs(3, 4),
      hold: { sinceMs: NOW - DAY, goneMedia: 9000 },
    };
    expect(parseLedger(structuredClone(stored))).toEqual({ ledger: stored });
  });

  it("starts from the head, and says so, when the cursor is not a position in the backup", () => {
    for (const cursor of [
      42,
      "avatars/x",
      "",
      `events/${"a".repeat(2000)}`,
      "events/a\u0000b",
    ]) {
      const { ledger, note } = parseLedger({
        v: 1,
        cursor,
        history: [],
        hold: null,
      });
      expect(ledger.cursor, String(cursor)).toBeNull();
      expect(note).toMatch(/cursor unreadable/);
    }
  });

  it("drops a malformed hold, and says so, so the next anomalous run holds afresh", () => {
    const { ledger, note } = parseLedger({
      v: 1,
      cursor: null,
      history: [],
      hold: { sinceMs: "yesterday", goneMedia: 3 },
    });
    expect(ledger.hold).toBeNull();
    expect(note).toMatch(/hold unreadable/);
  });

  it("keeps only well-formed history, and only the last runs", () => {
    const good = runs(
      ...Array.from({ length: PRUNE_HOLD_HISTORY_RUNS + 3 }, (_, i) => i),
    );
    const { ledger } = parseLedger({
      v: 1,
      cursor: null,
      history: [{ atMs: 1, goneMedia: -5, live: true }, "junk", ...good],
      hold: null,
    });
    expect(ledger.history).toEqual(good.slice(-PRUNE_HOLD_HISTORY_RUNS));
  });

  it("reads a store that is not an object as the empty ledger, and says so", () => {
    expect(parseLedger("cursor")).toEqual({
      ledger: EMPTY_LEDGER,
      note: expect.stringMatching(/unreadable/),
    });
  });
});

describe("the usual and the threshold", () => {
  it("is the median of the recorded runs, so one big clear-out does not move it", () => {
    expect(usualGoneMedia([])).toBe(0);
    expect(usualGoneMedia(runs(5))).toBe(5);
    expect(usualGoneMedia(runs(1, 100, 3))).toBe(3);
    expect(usualGoneMedia(runs(1, 3, 5, 100))).toBe(4);
  });

  it("never holds below the floor, and holds past ten times the usual above it", () => {
    expect(holdThreshold([])).toBe(PRUNE_HOLD_FLOOR_MEDIA);
    expect(holdThreshold(runs(10, 12, 11))).toBe(PRUNE_HOLD_FLOOR_MEDIA);
    expect(holdThreshold(runs(500, 600, 700))).toBe(
      PRUNE_HOLD_MULTIPLIER * 600,
    );
  });
});

describe("decideHold", () => {
  const ledger = (over: Partial<PruneLedger> = {}): PruneLedger => ({
    ...EMPTY_LEDGER,
    history: runs(500, 600, 700),
    ...over,
  });
  const threshold = PRUNE_HOLD_MULTIPLIER * 600;

  it("goes ahead with a usual backlog, and a live run clears an old hold", () => {
    const d = decideHold({
      goneMedia: threshold,
      ledger: ledger({ hold: { sinceMs: NOW - DAY, goneMedia: 99_999 } }),
      nowMs: NOW,
      live: true,
      releasedAtMs: null,
    });
    expect(d.verdict).toBe("proceed");
    expect(d.nextHold).toBeNull();
  });

  it("holds a live backlog past the threshold, from the run that finds it", () => {
    const d = decideHold({
      goneMedia: threshold + 1,
      ledger: ledger(),
      nowMs: NOW,
      live: true,
      releasedAtMs: null,
    });
    expect(d.verdict).toBe("hold");
    expect(d.nextHold).toEqual({ sinceMs: NOW, goneMedia: threshold + 1 });
  });

  it("never releases a hold by itself, however old it is", () => {
    for (const age of [DAY, 7 * DAY, 90 * DAY]) {
      const hold = { sinceMs: NOW - age, goneMedia: threshold + 1 };
      const d = decideHold({
        goneMedia: threshold + 1,
        ledger: ledger({ hold }),
        nowMs: NOW,
        live: true,
        releasedAtMs: null,
      });
      expect(d.verdict, `${age / DAY} days`).toBe("hold");
      expect(d.nextHold).toEqual(hold);
    }
  });

  it("goes ahead once an operator released it after it began", () => {
    const hold = { sinceMs: NOW - 9 * DAY, goneMedia: threshold + 1 };
    const d = decideHold({
      goneMedia: threshold + 1,
      ledger: ledger({ hold }),
      nowMs: NOW,
      live: true,
      releasedAtMs: NOW - 2 * DAY,
    });
    expect(d.verdict).toBe("released");
    expect(d.nextHold).toBeNull();
  });

  it("honours only a release newer than the hold: one pressed before it, or at its instant, keeps it", () => {
    const hold = { sinceMs: NOW - 9 * DAY, goneMedia: threshold + 1 };
    for (const releasedAtMs of [NOW - 30 * DAY, hold.sinceMs]) {
      const d = decideHold({
        goneMedia: threshold + 1,
        ledger: ledger({ hold }),
        nowMs: NOW,
        live: true,
        releasedAtMs,
      });
      expect(d.verdict).toBe("hold");
      expect(d.nextHold).toEqual(hold);
    }
  });

  it("never lets an old release pass a new hold: the run that finds one holds it", () => {
    const d = decideHold({
      goneMedia: threshold + 1,
      ledger: ledger({ hold: null }),
      nowMs: NOW,
      live: true,
      releasedAtMs: NOW - DAY,
    });
    expect(d.verdict).toBe("hold");
    expect(d.nextHold).toEqual({ sinceMs: NOW, goneMedia: threshold + 1 });
  });

  it("only reports in a dry run: it never sets, clears or releases a live hold", () => {
    const standing = { sinceMs: NOW - DAY, goneMedia: 7 };
    const over = decideHold({
      goneMedia: threshold + 1,
      ledger: ledger({ hold: standing }),
      nowMs: NOW,
      live: false,
      releasedAtMs: NOW,
    });
    expect(over.verdict).toBe("hold");
    expect(over.nextHold).toBe(standing);
    const under = decideHold({
      goneMedia: 1,
      ledger: ledger({ hold: standing }),
      nowMs: NOW,
      live: false,
      releasedAtMs: null,
    });
    expect(under.verdict).toBe("proceed");
    expect(under.nextHold).toBe(standing);
  });
});

describe("nextLedger", () => {
  it("appends the run's record and keeps only the last runs", () => {
    const prev: PruneLedger = {
      ...EMPTY_LEDGER,
      history: runs(
        ...Array.from({ length: PRUNE_HOLD_HISTORY_RUNS }, (_, i) => i),
      ),
    };
    const record = { atMs: NOW, goneMedia: 77, live: false };
    const next = nextLedger(prev, { cursor: CURSOR, record, hold: null });
    expect(next.cursor).toBe(CURSOR);
    expect(next.history).toHaveLength(PRUNE_HOLD_HISTORY_RUNS);
    expect(next.history.at(-1)).toEqual(record);
    expect(next.history[0]).toEqual(prev.history[1]);
  });
});
