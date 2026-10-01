import { describe, expect, it } from "vitest";

import {
  addressStrikes,
  askableProof,
  closedStrike,
  closedStrikeWords,
  dismissEndsTheHide,
  entryKeyOf,
  frontOrder,
  heldMessage,
  hideUndoOf,
  holdReasonFor,
  holdTouches,
  laneOf,
  newestFirst,
  NO_REASON,
  normalizeNote,
  parseReportFilter,
  PAST_WINDOW_MESSAGE,
  REOPEN_LINE,
  REOPEN_WINDOW_MS,
  reopenFloor,
  REPORT_FILTERS,
  REPORT_NOTE_MAX,
  REPORT_STATUS_META,
  REPORT_WORDS,
  reporterWho,
  reporterWords,
  sameInstant,
  strikeLapseMs,
  strikeWords,
  WAY_BACK_LINE,
  wayBackOf,
  withinReopenWindow,
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
  /** The page's one clock read, the day after the verdict. */
  const NOW = Date.parse("2026-09-29T12:00:00.000Z");
  /** Just past the dismissal's 30 days. */
  const LATER = Date.parse(at) + REOPEN_WINDOW_MS + 1;
  const takenDown: ReportedItemState = {
    status: "removed",
    removedByAdmin: true,
    removedAt: "2026-09-28T20:00:00.123+00:00",
    held: false,
  };
  const upAgain: ReportedItemState = {
    ...takenDown,
    status: "approved",
    removedByAdmin: false,
    removedAt: null,
  };

  it("offers Undo while the removal THIS verdict made still waits out its window", () => {
    expect(
      wayBackOf({ status: "actioned", resolvedAt: at, item: takenDown }, NOW),
    ).toBe("undo");
  });

  it("offers none once the item is gone (purged at the window's end) or back up", () => {
    expect(
      wayBackOf({ status: "actioned", resolvedAt: at, item: null }, NOW),
    ).toBeNull();
    expect(
      wayBackOf({ status: "actioned", resolvedAt: at, item: upAgain }, NOW),
    ).toBeNull();
  });

  it("never undoes a removal the verdict did not make (the host's, then made the operator's)", () => {
    expect(
      wayBackOf(
        {
          status: "actioned",
          resolvedAt: at,
          item: { ...takenDown, removedAt: "2026-09-20T08:00:00.000Z" },
        },
        NOW,
      ),
    ).toBeNull();
    // ...nor a removal that is not the operator's at all.
    expect(
      wayBackOf(
        {
          status: "actioned",
          resolvedAt: at,
          item: { ...takenDown, removedByAdmin: false },
        },
        NOW,
      ),
    ).toBeNull();
  });

  it("says Held, never Undo, where a held item's removal would come back", () => {
    for (const status of ["actioned", "open"] as const) {
      expect(
        wayBackOf(
          { status, resolvedAt: at, item: { ...takenDown, held: true } },
          NOW,
        ),
      ).toBe("held");
    }
    // A dismissal past its window reopens nothing, so a held item says Held there too.
    expect(
      wayBackOf(
        {
          status: "dismissed",
          resolvedAt: at,
          item: { ...upAgain, held: true },
        },
        LATER,
      ),
    ).toBe("held");
  });

  // Reshaped for build 19's red-team: this said "offers nothing on a dismissal: the item never left",
  // which let a slip close a harm report for good. The item still never left, which is why the way
  // back is the report's alone.
  it("★ reopens a dismissal inside its 30 days, the item untouched, and a hold is no bar", () => {
    for (const item of [upAgain, null, { ...upAgain, held: true }]) {
      expect(
        wayBackOf({ status: "dismissed", resolvedAt: at, item }, NOW),
        `item ${JSON.stringify(item)}`,
      ).toBe("reopen");
    }
  });

  it("★ offers nothing on a dismissal past its window, nor on one with no verdict time", () => {
    expect(
      wayBackOf({ status: "dismissed", resolvedAt: at, item: upAgain }, LATER),
    ).toBeNull();
    expect(
      wayBackOf({ status: "dismissed", resolvedAt: null, item: null }, NOW),
    ).toBeNull();
    // Mark actioned and an album's Action remove nothing, and are not a dismissal: no reopen.
    expect(
      wayBackOf({ status: "actioned", resolvedAt: at, item: null }, NOW),
    ).toBeNull();
  });

  it("measures the window as the reopen's guarded write does: the floor is its last instant", () => {
    const floor = reopenFloor(NOW);
    expect(Date.parse(floor)).toBe(NOW - REOPEN_WINDOW_MS);
    expect(REOPEN_WINDOW_MS).toBe(30 * 24 * 60 * 60 * 1000);
    expect(withinReopenWindow(floor, NOW)).toBe(true);
    expect(
      withinReopenWindow(
        new Date(NOW - REOPEN_WINDOW_MS - 1).toISOString(),
        NOW,
      ),
    ).toBe(false);
    // PostgREST's spelling of the same instant reads the same.
    expect(withinReopenWindow("2026-09-28T20:00:00.123000+00:00", NOW)).toBe(
      true,
    );
    expect(withinReopenWindow("not a time", NOW)).toBe(false);
    expect(PAST_WINDOW_MESSAGE).toMatch(/30 days/);
  });

  it("says how long the Undo lasts in the window's own number", () => {
    expect(REOPEN_LINE).toContain("30-day window");
    expect(WAY_BACK_LINE).toMatch(/a dismissal reopens its report/);
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

  // ★ RESHAPED ON PURPOSE (triage-r2-wiring, Will 2026-09-29: "a hold is for what police should see"; scar
  // kept: every line true of what the act does). The hold takes it down too, by default, so its second line
  // says where each item goes; the quiet hold says nothing leaves.
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
      "Each leaves the album and the host's Deleted at once and stops counting against her storage; restore any from Albums after review",
      "Each original and its forensic record, copied to the preservation store",
      "The host and the guest are sent nothing",
    ]);
    expect(
      holdTouches(
        {
          kind: "photo",
          eventName: "Okafor Reunion",
          others: 0,
          uploader: "guest",
        },
        { takeDown: true },
      )[1],
    ).toMatch(/^It leaves the album and the host's Deleted at once/);
    // The quiet hold: nothing leaves, and what the host does to it looks like any act of hers.
    expect(
      holdTouches(
        {
          kind: "photo",
          eventName: "Okafor Reunion",
          others: 2,
          uploader: "guest",
        },
        { takeDown: false },
      )[1],
    ).toBe(
      "Nothing leaves the album: the host's own removal of one looks like any other",
    );
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

  it("toasts the count the confirm showed, and what it did", () => {
    expect(heldMessage(1)).toBe("Held and preserved.");
    expect(heldMessage(4)).toBe("Held and preserved 4 items.");
    expect(heldMessage(1, { takeDown: true })).toBe(
      "Held, taken down and preserved.",
    );
    expect(heldMessage(4, { takeDown: true })).toBe(
      "Held, taken down and preserved 4 items.",
    );
  });
});

/**
 * ROUND TWO'S RULES (admin-triage r2, Will 2026-09-29): one entry a thing reported, harm in front worst first, the
 * reporter in words true of what she can do, proof never asked of the worst kind, and a false report's hide put
 * back exactly where it found the item.
 */
describe("the review grid's entries and lanes (`look=grid`, `harm=kinds`)", () => {
  it("keys one entry a thing reported: an item, an album's own reports, a person", () => {
    expect(
      entryKeyOf({ media_id: "m1", event_id: "e1", profile_id: null }),
    ).toBe("item:m1");
    expect(
      entryKeyOf({ media_id: null, event_id: "e1", profile_id: null }),
    ).toBe("album:e1");
    expect(
      entryKeyOf({ media_id: null, event_id: null, profile_id: "p1" }),
    ).toBe("person:p1");
  });

  it("puts harm in front, a person under People, and Something else in the sweep", () => {
    expect(laneOf("item", "child")).toBe("front");
    expect(laneOf("album", "consent")).toBe("front");
    expect(laneOf("item", "other")).toBe("sweep");
    expect(laneOf("person", "child")).toBe("people");
  });

  it("orders the front worst kind first, then newest; the sweep newest first", () => {
    const entries = [
      { kind: "consent" as const, newestAt: "2026-09-27T23:00:00Z" },
      { kind: "child" as const, newestAt: "2026-09-27T20:00:00Z" },
      { kind: "consent" as const, newestAt: "2026-09-27T23:30:00Z" },
      { kind: "sexual" as const, newestAt: "2026-09-27T21:00:00Z" },
    ];
    expect(
      [...entries].sort(frontOrder).map((e) => `${e.kind} ${e.newestAt}`),
    ).toEqual([
      "child 2026-09-27T20:00:00Z",
      "sexual 2026-09-27T21:00:00Z",
      "consent 2026-09-27T23:30:00Z",
      "consent 2026-09-27T23:00:00Z",
    ]);
    expect([...entries].sort(newestFirst).map((e) => e.newestAt)[0]).toBe(
      "2026-09-27T23:30:00Z",
    );
  });
});

describe("the reporter, and asking her (`proof=confirm`)", () => {
  it("says whether she can be asked, and on the worst kind whether her address was confirmed", () => {
    expect(
      reporterWords({ signedIn: true, canAsk: true, kind: "consent" }),
    ).toBe("Signed-in guest, can be asked");
    expect(reporterWords({ signedIn: false, canAsk: false })).toBe(
      "Signed-out guest, can't be asked",
    );
    // Proof is never asked of a child-abuse report, so "can be asked" would promise a verb that is not there.
    expect(reporterWords({ signedIn: true, canAsk: true, kind: "child" })).toBe(
      "Signed-in guest, email confirmed",
    );
    expect(
      reporterWords({ signedIn: false, canAsk: false, kind: "child" }),
    ).toBe("Signed-out guest, no confirmed email");
  });

  it("★ tells the album's own host from a guest (build 23's LOW-2)", () => {
    expect(
      reporterWords({
        signedIn: true,
        canAsk: true,
        byHost: true,
        kind: "violence",
      }),
    ).toBe("The host, can be asked");
    // Her report never hides, so on the worst kind nothing implies it did.
    expect(
      reporterWords({
        signedIn: true,
        canAsk: true,
        confirmed: true,
        byHost: true,
        kind: "child",
      }),
    ).toBe("The host");
    expect(reporterWho({ signedIn: true, byHost: true })).toBe("The host");
    expect(reporterWho({ signedIn: true })).toBe("Signed-in guest");
    expect(reporterWho({ signedIn: false })).toBe("Signed-out guest");
  });

  it("★ says what is true after a reopen: sent from a confirmed address, no longer askable (build 23's NIT-8)", () => {
    // Dismissed, then Undo: the close forgot the address, the worst kind's hash remembers it was confirmed.
    expect(
      reporterWords({
        signedIn: true,
        canAsk: false,
        confirmed: true,
        kind: "child",
      }),
    ).toBe("Signed-in guest, email confirmed");
    expect(
      reporterWords({
        signedIn: true,
        canAsk: false,
        confirmed: false,
        kind: "consent",
      }),
    ).toBe("Signed-in guest, can't be asked");
  });

  it("★ offers Ask for proof only to a confirmed reporter, and never on the worst kind", () => {
    expect(askableProof({ kind: "consent", canAsk: true })).toBe(true);
    expect(askableProof({ kind: "consent", canAsk: false })).toBe(false);
    expect(askableProof({ kind: "child", canAsk: true })).toBe(false);
  });
});

describe("a false report's hide, put back (`hideUndoOf`)", () => {
  const HID = "2026-09-27T22:12:00.000Z";
  const item = (
    over: Partial<Parameters<typeof hideUndoOf>[0] & object> = {},
  ) => ({
    status: "removed" as const,
    removedByAdmin: true,
    removedAt: HID,
    held: false,
    ...over,
  });

  it("★ restores an item the hide took out of the album, at the hide's own instant", () => {
    expect(hideUndoOf(item(), HID)).toBe("restore");
    // The same instant in another spelling is still the hide's.
    expect(
      hideUndoOf(item({ removedAt: "2026-09-27T22:12:00.000000+00:00" }), HID),
    ).toBe("restore");
  });

  it("returns an item the hide found in the host's Deleted to her Deleted", () => {
    expect(
      hideUndoOf(item({ removedAt: "2026-09-26T10:00:00.000Z" }), HID),
    ).toBe("return");
  });

  it("★ never puts back a held item, one an operator removed since, or one that is up", () => {
    expect(hideUndoOf(item({ held: true }), HID)).toBeNull();
    expect(
      hideUndoOf(item({ removedAt: "2026-09-28T08:00:00.000Z" }), HID),
    ).toBeNull();
    expect(
      hideUndoOf(
        item({ status: "approved", removedByAdmin: false, removedAt: null }),
        HID,
      ),
    ).toBeNull();
    expect(hideUndoOf(item(), null)).toBeNull();
    expect(hideUndoOf(null, HID)).toBeNull();
  });
});

/**
 * ★ AN ADDRESS AGAINST THE INSTANT HIDE, AND WHAT A DISMISS WOULD MAKE OF IT (crumbs-33, from `hide-strikes`). The
 * numbers are the reading's own (`report_strikes`, the rule's one home); this only says them, and projects one
 * press: strikes lapse oldest first, so the bar lifts when the bar-th newest lapses, and a Dismiss's strikes are
 * the newest of all.
 */
describe("an address's strikes on the queue (`addressStrikes`, `strikeWords`)", () => {
  const RULE = { strikes: 3, freshLapsesAt: "2027-03-30T09:00:00.000Z" };
  const reading = (live: number, lapses: string[]) => ({
    live,
    barred: live >= 3,
    lapses,
  });

  it("★ says when a Dismiss is the third, and until when its reports stop hiding", () => {
    const s = addressStrikes(
      reading(2, ["2027-02-20T21:05:00.000Z", "2026-12-02T19:30:00.000Z"]),
      RULE,
      1,
    );
    expect(s).toEqual({
      live: 2,
      bar: 3,
      barredUntil: null,
      dismiss: { live: 3, barredUntil: "2026-12-02T19:30:00.000Z" },
    });
    expect(dismissEndsTheHide(s)).toBe(true);
    expect(strikeWords(s)).toBe(
      "This address has 2 strikes of 3. A Dismiss makes 3, and its reports stop hiding right away until Dec 2, 2026 UTC.",
    );
  });

  it("counts toward the bar while it is far", () => {
    expect(strikeWords(addressStrikes(reading(0, []), RULE, 1))).toBe(
      "This address has no strikes. A Dismiss makes 1 of 3.",
    );
    const one = addressStrikes(
      reading(1, ["2027-01-15T12:00:00.000Z"]),
      RULE,
      1,
    );
    expect(dismissEndsTheHide(one)).toBe(false);
    expect(strikeWords(one)).toBe(
      "This address has 1 strike of 3. A Dismiss makes 2 of 3.",
    );
  });

  it("★ an address already barred says until when, and how far a Dismiss would push it", () => {
    const barred = addressStrikes(
      reading(3, [
        "2027-03-01T10:00:00.000Z",
        "2027-02-01T10:00:00.000Z",
        "2027-01-10T10:00:00.000Z",
      ]),
      RULE,
      1,
    );
    expect(barred.barredUntil).toBe("2027-01-10T10:00:00.000Z");
    expect(barred.dismiss).toEqual({
      live: 4,
      barredUntil: "2027-02-01T10:00:00.000Z",
    });
    expect(dismissEndsTheHide(barred)).toBe(false);
    expect(strikeWords(barred)).toBe(
      "This address has 3 strikes, so its reports don't hide right away until Jan 10, 2027 UTC. A Dismiss makes 4, until Feb 1, 2027 UTC.",
    );
    // A Dismiss that moves nothing says so by saying no date.
    const same = addressStrikes(
      reading(4, [
        "2027-03-01T10:00:00.000Z",
        "2027-03-01T10:00:00.000Z",
        "2027-03-01T10:00:00.000Z",
      ]),
      RULE,
      1,
    );
    expect(strikeWords(same)).toBe(
      "This address has 4 strikes, so its reports don't hide right away until Mar 1, 2027 UTC. A Dismiss makes 5.",
    );
  });

  it("★ a Dismiss of an entry holding several of one address's reports makes a strike of each", () => {
    const s = addressStrikes(reading(1, ["2027-01-15T12:00:00.000Z"]), RULE, 2);
    expect(s.dismiss).toEqual({
      live: 3,
      barredUntil: "2027-01-15T12:00:00.000Z",
    });
    // Three of one address's reports on one entry: the bar lasts the full lapse from the Dismiss itself.
    expect(addressStrikes(reading(0, []), RULE, 3).dismiss.barredUntil).toBe(
      RULE.freshLapsesAt,
    );
  });

  it("reads the bar from the rule it is handed, never a number of its own", () => {
    const strict = { strikes: 1, freshLapsesAt: "2027-03-30T09:00:00.000Z" };
    expect(addressStrikes(reading(0, []), strict, 1).dismiss.barredUntil).toBe(
      strict.freshLapsesAt,
    );
    expect(strikeWords(addressStrikes(reading(0, []), strict, 1))).toBe(
      "This address has no strikes. A Dismiss makes 1, and its reports stop hiding right away until Mar 30, 2027 UTC.",
    );
  });
});

/**
 * ★ A DISMISSED CHILD-ABUSE REPORT'S CLOSED LINE SAYS WHETHER IT IS STILL A STRIKE, AND UNTIL WHEN (crumbs-36, a board
 * idea from crumbs-33). The open queue says what a Dismiss WOULD make of an address; an operator reading past
 * dismissals saw nothing of what each one cost. The numbers are `report_strikes`'s, the rule's one home: a strike
 * counts for a lapse after its dismissal, and the lapse is read off the answer (`strikeLapseMs`), never copied here.
 * Only counts and instants say it: the address itself never shows.
 */
describe("a closed report's strike (`closedStrike`, `closedStrikeWords`)", () => {
  const DAY = 86_400_000;
  /** The page's one clock read, and the answer's "a strike made now lapses at", a lapse and a hair of latency on. */
  const NOW = Date.parse("2026-09-29T12:00:00.000Z");
  const RULE = { strikes: 3, freshLapsesAt: "2027-03-28T12:00:00.123Z" };
  const dismissed = {
    kind: "child" as const,
    status: "dismissed" as const,
    resolvedAt: "2026-09-15T08:30:00.000Z",
    keptAddress: true,
  };
  /** The address's reading, its newest strikes' lapse instants newest first (the answer's own shape). */
  const reading = (live: number, lapses: string[]) => ({
    live,
    barred: live >= 3,
    lapses,
  });

  it("★ reads the lapse off the rule's own answer, to the minute, and never holds a number of its own", () => {
    expect(strikeLapseMs(RULE, NOW)).toBe(180 * DAY);
    // The same function on a rule that lapses in 90 days: nothing here says 180.
    const short = { strikes: 3, freshLapsesAt: "2026-12-28T12:00:00.987Z" };
    expect(strikeLapseMs(short, NOW)).toBe(90 * DAY);
  });

  it("★ says a live strike, until when, and what the address holds", () => {
    const s = closedStrike(
      dismissed,
      reading(2, ["2027-03-14T08:30:00.000Z", "2027-01-10T10:00:00.000Z"]),
      RULE,
      NOW,
    );
    expect(s).toEqual({
      state: "live",
      at: "2027-03-14T08:30:00.000Z",
      live: 2,
      bar: 3,
      barredUntil: null,
    });
    expect(closedStrikeWords(s!, { canUndo: false })).toBe(
      "A strike on its address until Mar 14, 2027 UTC; the address holds 2 of 3.",
    );
  });

  it("★ the lapse it says is the instant the rule's reading lists for that strike", () => {
    // The answer lists each of the newest strikes' lapse as `resolved_at + the lapse`; the line must not differ.
    const s = closedStrike(
      dismissed,
      reading(1, ["2027-03-14T08:30:00.000Z"]),
      RULE,
      NOW,
    );
    expect(s).toMatchObject({ state: "live", at: "2027-03-14T08:30:00.000Z" });
  });

  it("says that its Undo takes it back, only where the dismissal can still be reopened", () => {
    const s = closedStrike(
      dismissed,
      reading(1, ["2027-03-14T08:30:00.000Z"]),
      RULE,
      NOW,
    )!;
    expect(closedStrikeWords(s, { canUndo: true })).toBe(
      "A strike on its address until Mar 14, 2027 UTC; the address holds 1 of 3. Undo takes it back.",
    );
    expect(closedStrikeWords(s, { canUndo: false })).not.toMatch(/Undo/);
  });

  it("★ says when the address is barred, and until when its reports stop hiding right away", () => {
    const s = closedStrike(
      dismissed,
      reading(3, [
        "2027-03-14T08:30:00.000Z",
        "2027-02-20T21:05:00.000Z",
        "2027-01-10T10:00:00.000Z",
      ]),
      RULE,
      NOW,
    );
    expect(s).toMatchObject({
      live: 3,
      bar: 3,
      barredUntil: "2027-01-10T10:00:00.000Z",
    });
    expect(closedStrikeWords(s!, { canUndo: true })).toBe(
      "A strike on its address until Mar 14, 2027 UTC; the address holds 3 strikes, so its reports don't hide right away until Jan 10, 2027 UTC. Undo takes it back.",
    );
  });

  it("★ says a strike that has lapsed, and when", () => {
    const s = closedStrike(
      { ...dismissed, resolvedAt: "2026-03-01T10:00:00.000Z" },
      reading(0, []),
      RULE,
      NOW,
    );
    expect(s).toEqual({ state: "lapsed", at: "2026-08-28T10:00:00.000Z" });
    expect(closedStrikeWords(s!, { canUndo: false })).toBe(
      "Its strike lapsed Aug 28, 2026 UTC.",
    );
  });

  it("holds a strike to the reading's own count: an address with none live has no live strike", () => {
    // The clock says this dismissal still counts (a few seconds before its lapse), the answer says nothing does: the
    // answer is the rule's, and the line never says live where the rule counts none.
    const edge = {
      ...dismissed,
      resolvedAt: new Date(NOW - 180 * DAY + 5_000).toISOString(),
    };
    const s = closedStrike(edge, reading(0, []), RULE, NOW);
    expect(s?.state).toBe("lapsed");
  });

  it("★ a dismissal that kept no address was never a strike, and says so", () => {
    const s = closedStrike(
      { ...dismissed, keptAddress: false },
      undefined,
      RULE,
      NOW,
    );
    expect(s).toEqual({ state: "none" });
    expect(closedStrikeWords(s!, { canUndo: false })).toBe(
      "Not a strike: it kept no address to count against.",
    );
  });

  it("says nothing of a report the rule does not count: another kind, or a verdict that was not a dismissal", () => {
    const r = reading(2, ["2027-03-14T08:30:00.000Z"]);
    expect(
      closedStrike({ ...dismissed, kind: "violence" }, r, RULE, NOW),
    ).toBeNull();
    expect(
      closedStrike({ ...dismissed, status: "actioned" }, r, RULE, NOW),
    ).toBeNull();
    expect(
      closedStrike({ ...dismissed, status: "open" }, r, RULE, NOW),
    ).toBeNull();
  });

  it("says nothing while the rule cannot be read, except that an addressless dismissal was never a strike", () => {
    const r = reading(2, ["2027-03-14T08:30:00.000Z"]);
    expect(closedStrike(dismissed, r, null, NOW)).toBeNull();
    expect(
      closedStrike({ ...dismissed, keptAddress: false }, undefined, null, NOW),
    ).toEqual({
      state: "none",
    });
  });

  it("never guesses a lapse for a verdict with no time", () => {
    expect(
      closedStrike(
        { ...dismissed, resolvedAt: null },
        reading(1, []),
        RULE,
        NOW,
      ),
    ).toBeNull();
  });
});
