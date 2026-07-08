import { describe, expect, it } from "vitest";

import {
  excludeHeld,
  isUnderLegalHold,
  partitionEventsByHold,
} from "@/lib/forensics/legal-hold";

describe("isUnderLegalHold / excludeHeld", () => {
  it("treats any non-null legal_hold_at as held", () => {
    expect(isUnderLegalHold({ legal_hold_at: null })).toBe(false);
    expect(isUnderLegalHold({ legal_hold_at: "2026-07-07T00:00:00Z" })).toBe(
      true,
    );
  });

  it("drops held rows from a hard-delete candidate set, keeping the rest intact", () => {
    const rows = [
      { id: "a", legal_hold_at: null },
      { id: "b", legal_hold_at: "2026-07-07T00:00:00Z" },
      { id: "c", legal_hold_at: null },
    ];
    expect(excludeHeld(rows).map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("passes an all-clear set through unchanged", () => {
    const rows = [{ id: "a", legal_hold_at: null }];
    expect(excludeHeld(rows)).toEqual(rows);
  });
});

describe("partitionEventsByHold", () => {
  it("blocks ONLY the events that contain held media", () => {
    const { purgeable, blocked } = partitionEventsByHold(
      ["e1", "e2", "e3"],
      [{ event_id: "e2" }, { event_id: "e2" }],
    );
    expect(purgeable).toEqual(["e1", "e3"]);
    expect(blocked).toEqual(["e2"]);
  });

  it("purges everything when nothing is held", () => {
    const { purgeable, blocked } = partitionEventsByHold(["e1", "e2"], []);
    expect(purgeable).toEqual(["e1", "e2"]);
    expect(blocked).toEqual([]);
  });

  it("blocks everything when every event holds evidence", () => {
    const { purgeable, blocked } = partitionEventsByHold(
      ["e1"],
      [{ event_id: "e1" }],
    );
    expect(purgeable).toEqual([]);
    expect(blocked).toEqual(["e1"]);
  });
});
