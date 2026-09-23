import { describe, expect, it } from "vitest";

import { closesOnLastRemoval } from "@/lib/guest/delete-consequence";

/**
 * WHETHER A GUEST'S OWN LAST REMOVAL CLOSES THE ALBUM (guest by upload, "Own deletes close it").
 * The confirm says so, and the page refreshes onto the server's answer, only where it is true:
 * the upload gate fails open on a FULL album, so there the last removal closes nothing.
 */
describe("closesOnLastRemoval", () => {
  const base = {
    isDemo: false,
    isOwner: false,
    requireUpload: true,
    acceptingUploads: true,
    albumFull: false,
  };

  it("is true on a Require-an-upload-to-view album with uploads open and room left", () => {
    expect(closesOnLastRemoval(base)).toBe(true);
  });

  it("is false on a FULL album: the gate fails open, so nothing closes", () => {
    expect(closesOnLastRemoval({ ...base, albumFull: true })).toBe(false);
  });

  it("is false without the switch, with uploads closed, for the host and in the demo", () => {
    expect(closesOnLastRemoval({ ...base, requireUpload: false })).toBe(false);
    expect(closesOnLastRemoval({ ...base, acceptingUploads: false })).toBe(
      false,
    );
    expect(closesOnLastRemoval({ ...base, isOwner: true })).toBe(false);
    expect(closesOnLastRemoval({ ...base, isDemo: true })).toBe(false);
  });
});
