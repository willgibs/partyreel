import { describe, expect, it } from "vitest";

import { momentAction } from "@/lib/reel/moment-picker";

// The picker's routing rule has no visual signature: "add" and "remove" both land on the same tile and
// look identical afterwards, so a wrong branch shows up only as toast spam or a silent refusal. Pin it.
describe("momentAction", () => {
  it("routes an approved, not-in-reel item to the SILENT add path", () => {
    // Must be "add" (=> addMany), never "remove" (=> toggle): toggle toasts on every add, and the
    // picker's whole point is adding several moments in a row.
    expect(momentAction({ inReel: false, status: "approved" })).toBe("add");
  });

  it("treats a missing status as approved, like the grid does", () => {
    expect(momentAction({ inReel: false })).toBe("add");
  });

  it("routes any in-reel item to remove, hidden members included", () => {
    expect(momentAction({ inReel: true, status: "approved" })).toBe("remove");
    // Membership is approved + hidden: a hidden member stays a member and must remain removable,
    // otherwise the reel could hold a moment the host cannot get rid of from this surface.
    expect(momentAction({ inReel: true, status: "hidden" })).toBe("remove");
  });

  it("blocks adding a hidden item (add_to_reel refuses non-approved media)", () => {
    expect(momentAction({ inReel: false, status: "hidden" })).toBe("blocked");
  });
});
