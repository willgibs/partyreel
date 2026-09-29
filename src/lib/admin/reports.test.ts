import { describe, expect, it } from "vitest";

import {
  heldMessage,
  holdReasonFor,
  holdTouches,
  NO_REASON,
  normalizeNote,
  parseReportFilter,
  REPORT_FILTERS,
  REPORT_NOTE_MAX,
  REPORT_STATUS_META,
  REPORT_WORDS,
  sameInstant,
  WAY_BACK_LINE,
  wayBackOf,
  type ReportedItemState,
} from "@/lib/admin/reports";
import { TRIAGE_STATUS_META } from "@/lib/constants/triage";

/**
 * THE REPORTS INBOX'S RULES (admin-triage r1, Will 2026-09-28), pinned where they are decided so the
 * page, the cards and the actions cannot disagree.
 */

describe("Reports keeps its own words (`idiom=shape`)", () => {
  it("says Open, Dismissed and Actioned, in that order, never Support's words", () => {
    expect(
      REPORT_WORDS.statuses.map((s) => REPORT_WORDS.meta[s].label),
    ).toEqual(["Open", "Dismissed", "Actioned"]);
    const support = Object.values(TRIAGE_STATUS_META).map((m) => m.label);
    for (const s of REPORT_WORDS.statuses) {
      expect(support).not.toContain(REPORT_STATUS_META[s].label);
    }
  });

  it("lands a bare or unknown filter on the queue, and reads the four it knows", () => {
    expect(parseReportFilter(undefined)).toBe("open");
    expect(parseReportFilter("")).toBe("open");
    expect(parseReportFilter("reviewed")).toBe("open");
    expect(parseReportFilter("ALL")).toBe("open");
    expect(parseReportFilter(["dismissed", "all"])).toBe("dismissed");
    for (const f of REPORT_FILTERS) expect(parseReportFilter(f)).toBe(f);
  });
});

describe("a report with nothing said (`reason=marked`)", () => {
  it("prints one line, the same on both arms", () => {
    expect(NO_REASON).toBe("No reason provided.");
  });
});

describe("a verdict's note (`verdict=note`)", () => {
  it("is trimmed, and an empty one is no note at all", () => {
    expect(normalizeNote("  Card number legible.  ")).toEqual({
      ok: true,
      note: "Card number legible.",
    });
    expect(normalizeNote("   ")).toEqual({ ok: true, note: null });
    expect(normalizeNote("")).toEqual({ ok: true, note: null });
    expect(normalizeNote(undefined)).toEqual({ ok: true, note: null });
    expect(normalizeNote(null)).toEqual({ ok: true, note: null });
  });

  it("refuses a note past the cap in words rather than cutting it, and anything not text", () => {
    expect(normalizeNote("x".repeat(REPORT_NOTE_MAX))).toMatchObject({
      ok: true,
    });
    const long = normalizeNote("x".repeat(REPORT_NOTE_MAX + 1));
    expect(long.ok).toBe(false);
    expect(long.ok ? "" : long.message).toMatch(/under 2,000 characters/);
    expect(normalizeNote(42).ok).toBe(false);
    expect(normalizeNote({ note: "x" }).ok).toBe(false);
  });
});

describe("one instant, any spelling", () => {
  it("reads PostgREST's microseconds and JavaScript's milliseconds as the same moment", () => {
    expect(
      sameInstant("2026-09-28T20:00:00.123+00:00", "2026-09-28T20:00:00.123Z"),
    ).toBe(true);
    expect(
      sameInstant(
        "2026-09-28T20:00:00.123000+00:00",
        "2026-09-28T20:00:00.123Z",
      ),
    ).toBe(true);
    expect(
      sameInstant("2026-09-28T20:00:00.124Z", "2026-09-28T20:00:00.123Z"),
    ).toBe(false);
    expect(sameInstant(null, "2026-09-28T20:00:00.123Z")).toBe(false);
    expect(sameInstant("not a time", "not a time")).toBe(false);
  });
});

describe("a closed report's way back (`closed=window`)", () => {
  const at = "2026-09-28T20:00:00.123Z";
  const takenDown: ReportedItemState = {
    status: "removed",
    removedByAdmin: true,
    removedAt: "2026-09-28T20:00:00.123+00:00",
    held: false,
  };

  it("offers Undo while the removal THIS verdict made still waits out its window", () => {
    expect(
      wayBackOf({ status: "actioned", resolvedAt: at, item: takenDown }),
    ).toBe("undo");
  });

  it("offers none once the item is gone (purged at the window's end) or back up", () => {
    expect(
      wayBackOf({ status: "actioned", resolvedAt: at, item: null }),
    ).toBeNull();
    expect(
      wayBackOf({
        status: "actioned",
        resolvedAt: at,
        item: {
          ...takenDown,
          status: "approved",
          removedByAdmin: false,
          removedAt: null,
        },
      }),
    ).toBeNull();
  });

  it("never undoes a removal the verdict did not make (the host's, then made the operator's)", () => {
    expect(
      wayBackOf({
        status: "actioned",
        resolvedAt: at,
        item: { ...takenDown, removedAt: "2026-09-20T08:00:00.000Z" },
      }),
    ).toBeNull();
    // ...nor a removal that is not the operator's at all.
    expect(
      wayBackOf({
        status: "actioned",
        resolvedAt: at,
        item: { ...takenDown, removedByAdmin: false },
      }),
    ).toBeNull();
  });

  it("says Held, never Undo, for a held item, whatever the verdict", () => {
    for (const status of ["actioned", "dismissed", "open"] as const) {
      expect(
        wayBackOf({
          status,
          resolvedAt: at,
          item: { ...takenDown, held: true },
        }),
      ).toBe("held");
    }
  });

  it("offers nothing on a dismissal: the item never left", () => {
    expect(
      wayBackOf({
        status: "dismissed",
        resolvedAt: at,
        item: {
          ...takenDown,
          status: "approved",
          removedByAdmin: false,
          removedAt: null,
        },
      }),
    ).toBeNull();
  });

  it("says how long the Undo lasts in the window's own number", () => {
    expect(WAY_BACK_LINE).toContain("30-day window");
    expect(WAY_BACK_LINE).toContain("only Forensics releases a hold");
  });
});

describe("the hold from a report (`escalate=door`)", () => {
  it("starts its reason from the report's reference", () => {
    expect(holdReasonFor("8d2f0b14-6a37-4c51-9f0e-2b7a41c9de83")).toBe(
      "Report 8d2f0b14-6a37-4c51-9f0e-2b7a41c9de83",
    );
  });

  it("says what it reaches: the item, the same uploader's others, the copies, and that nobody is told", () => {
    expect(
      holdTouches({
        kind: "photo",
        eventName: "Hannah and Theo",
        others: 3,
        uploader: "guest",
      }),
    ).toEqual([
      "This photo in Hannah and Theo, and the 3 other uploads this guest sent there",
      "Each original and its forensic record, copied to the preservation store",
      "The host and the guest are sent nothing",
    ]);
    expect(
      holdTouches({
        kind: "video",
        eventName: "Okafor Reunion",
        others: 1,
        uploader: "guest",
      })[0],
    ).toBe(
      "This video in Okafor Reunion, and the 1 other upload this guest sent there",
    );
    expect(
      holdTouches({
        kind: "photo",
        eventName: "Okafor Reunion",
        others: 0,
        uploader: "guest",
      })[0],
    ).toBe("This photo in Okafor Reunion; this guest sent nothing else there");
    expect(
      holdTouches({
        kind: "photo",
        eventName: "Okafor Reunion",
        others: 1204,
        uploader: "host",
      })[0],
    ).toBe(
      "This photo in Okafor Reunion, and the 1,204 other uploads the host added there",
    );
  });

  it("toasts the count the confirm showed", () => {
    expect(heldMessage(1)).toBe("Held and preserved.");
    expect(heldMessage(4)).toBe("Held and preserved 4 items.");
  });
});
