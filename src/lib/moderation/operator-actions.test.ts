import { describe, expect, it } from "vitest";

import {
  ALBUM_FILTERS,
  parseAlbumFilter,
  removalUpdate,
  restoreUpdate,
} from "@/lib/moderation/operator-actions";

// The operator soft-remove/restore payloads ARE the data contract (the admin action just applies
// them via the service-role client). Both return ABSOLUTE state so a re-delivered click is
// idempotent and matches the reports "Action" soft-remove shape.
describe("operator moderation payloads", () => {
  it("removalUpdate soft-removes: status='removed' + a removed_at grace stamp", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    expect(removalUpdate(now)).toEqual({
      status: "removed",
      removed_at: "2026-06-01T12:00:00.000Z",
      removed_by_admin: true,
    });
  });

  it("restoreUpdate un-removes: status='approved' + clears removed_at (so the cron can't reclaim)", () => {
    expect(restoreUpdate()).toEqual({
      status: "approved",
      removed_at: null,
      removed_by_admin: false,
    });
  });

  // QA #8: the flag is the ONLY thing standing between an operator takedown and the reported host
  // quietly restoring it from their own Trash (restore_media refuses a removed_by_admin row). Both
  // operator paths share this helper precisely so one can't be shipped without it.
  it("marks a takedown as operator-made, and releases it on restore", () => {
    expect(removalUpdate().removed_by_admin).toBe(true);
    expect(restoreUpdate().removed_by_admin).toBe(false);
  });
});

// The feed status filter is server-rendered from `?status=`; an unknown/missing value must fall
// back to the default "all" (active) view, never throw.
describe("parseAlbumFilter", () => {
  it("accepts every known filter verbatim", () => {
    for (const f of ALBUM_FILTERS) expect(parseAlbumFilter(f)).toBe(f);
  });

  it("defaults unknown / missing / wrong-case to 'all'", () => {
    expect(parseAlbumFilter(undefined)).toBe("all");
    expect(parseAlbumFilter("")).toBe("all");
    expect(parseAlbumFilter("bogus")).toBe("all");
    expect(parseAlbumFilter("REMOVED")).toBe("all");
  });
});
