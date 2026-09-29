import { describe, expect, it } from "vitest";

import { TRACKER_WORDS } from "@/lib/guest/upload-tracker";
import {
  adoptionUpdate,
  ALBUM_FILTERS,
  operatorRemovalTouches,
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

  // admin-triage r1 (`notice=deleted`): a report's Remove on an item someone else already removed used
  // to skip it, so the host could still restore a reported item. The flag alone makes it the
  // operator's, and nothing else moves: its removal time, and so its purge date, stay put.
  it("makes an existing removal the operator's without touching its clock", () => {
    expect(adoptionUpdate()).toEqual({ removed_by_admin: true });
  });
});

// What the confirm lists for an operator's removal is one home for both paths (Albums' Remove and a
// report's Remove). Every line is true of the moment AFTER the press: build 15's red-team read "her
// uploads list already says Not in the album" on an item still up, in words her list no longer uses.
describe("operatorRemovalTouches: what an operator's removal reaches", () => {
  const touches = (
    from: "album" | "deleted",
    wayBack: "undo" | "albums" | "here",
  ) =>
    operatorRemovalTouches({
      kind: "photo",
      eventName: "Hannah and Theo",
      from,
      wayBack,
    });

  it("quotes the guest's own list in its own words, and never says it already has", () => {
    for (const from of ["album", "deleted"] as const) {
      const lines = touches(from, "undo");
      expect(lines.join(" ")).not.toMatch(/already says|Not in the album/);
      expect(lines).toContain(
        `At an event that reviews uploads, the guest who sent it sees “${TRACKER_WORDS.refused}” in her uploads list`,
      );
    }
    expect(TRACKER_WORDS.refused).toBe("Not approved");
  });

  it("tells the host nothing, and takes it from her Deleted too", () => {
    expect(touches("album", "here")[1]).toBe(
      "Gone from the host's album and her Deleted at once; she is sent nothing",
    );
    expect(touches("deleted", "albums")[1]).toBe(
      "Out of the host's Deleted at once, so she can no longer restore it; she is sent nothing",
    );
  });

  it("says where the operator takes it back, for the one 30-day window, and never past a hold", () => {
    expect(touches("album", "undo")[3]).toBe(
      "Undo on the closed report for 30 days, then the purge deletes it unless it is held",
    );
    expect(touches("deleted", "albums")[3]).toBe(
      "Restorable from Albums until its 30 days run out, then the purge deletes it unless it is held",
    );
    expect(touches("album", "here")[3]).toBe(
      "Restorable here for 30 days, then the purge deletes it unless it is held",
    );
  });

  it("names what and where first", () => {
    expect(
      operatorRemovalTouches({
        kind: "video",
        eventName: "Priya and Dev",
        from: "album",
        wayBack: "here",
      })[0],
    ).toBe("1 video in Priya and Dev");
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
