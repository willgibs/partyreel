import { describe, expect, it, vi } from "vitest";

// The grouping reads the record doc through `_data/docs.ts`, which is
// `server-only`; the unit project has no react-server condition.
vi.mock("server-only", () => ({}));

import { RULINGS } from "@/app/(dev)/design/touchpoints";

import { recordGroups, recordSections } from "./sections";

/**
 * THE RECORD'S TWO HALVES AGREE. `RULINGS` (touchpoints.ts) and the sections
 * of `design-record.md` are one record written in two files, and before this
 * round a third copy, a markdown table at the top of the doc, said it again by
 * hand. They drifted: `event-feed` had a table row and a section and no
 * registry entry, so a link the docs write reached a page that did not exist.
 *
 * The table is deleted and the Library derives it. This is what stops the
 * drift coming back: a section with no entry and an entry with no section are
 * both named, and the known exceptions are listed here by id so adding one is
 * a deliberate act with a reason beside it.
 */

/**
 * A ruling the lab wrote up and never gave a touchpoint. `event-feed` is the
 * one: a June 2026 motion ruling (Condense, Fade, FLIP) that predates the
 * registry, has no board and no open question, and is linked from the system
 * docs. It stays readable at `/design/library/record/event-feed` and is listed
 * in the "Record only" group rather than being deleted or back-filled with an
 * invented touchpoint.
 */
const RECORD_ONLY = ["event-feed"];

/**
 * A registry entry whose long form the doc has not carried yet. Empty is the
 * goal: a board that lands writes its section in the same round.
 */
const AWAITING_WRITE_UP: string[] = [];

describe("the record", () => {
  const groups = recordGroups();

  it("read real sections out of the doc", () => {
    expect(recordSections().length).toBeGreaterThan(20);
  });

  it("groups every registry entry as open or ruled, and nothing twice", () => {
    expect(groups.open.length + groups.ruled.length).toBe(RULINGS.length);
    const ids = [...groups.open, ...groups.ruled].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names every section the registry does not know", () => {
    expect(
      groups.recordOnly.map((s) => s.id).sort(),
      "a new section in design-record.md with no RULINGS entry: give it one, or add it to RECORD_ONLY with why",
    ).toEqual([...RECORD_ONLY].sort());
  });

  it("names every registry entry the doc has not written up", () => {
    expect(
      groups.missingSection.map((r) => r.id).sort(),
      "a ruling with no section in design-record.md: write it up in the round that lands it",
    ).toEqual([...AWAITING_WRITE_UP].sort());
  });

  it("has no hand-written index left to drift", () => {
    // The old table opened `| id | surface | ruled | shipped |`.
    const doc = recordSections();
    expect(doc.some((s) => s.id === "entry")).toBe(true);
    expect(
      groups.open.length,
      "no board is open; the Open group has nothing to prove",
    ).toBeGreaterThan(0);
  });
});
