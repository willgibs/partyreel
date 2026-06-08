import { describe, expect, it } from "vitest";

import {
  mediaObjectKey,
  parseExtFromKey,
  parseMediaIdFromKey,
} from "@/lib/r2/keys";

describe("mediaObjectKey", () => {
  it("builds the canonical layout", () => {
    expect(
      mediaObjectKey({
        eventId: "evt",
        mediaId: "med",
        kind: "photo",
        variant: "original",
        ext: "jpg",
      }),
    ).toBe("events/evt/photo/med/original.jpg");
  });

  it("always lives under the event prefix (cross-event-write defense)", () => {
    const key = mediaObjectKey({
      eventId: "abc",
      mediaId: "m",
      kind: "video",
      variant: "original",
      ext: "mp4",
    });
    expect(key.startsWith("events/abc/")).toBe(true);
  });
});

describe("parseMediaIdFromKey", () => {
  const MEDIA_ID = "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d";

  it("round-trips the mediaId out of a key mediaObjectKey built", () => {
    const original = mediaObjectKey({
      eventId: "11111111-2222-3333-4444-555555555555",
      mediaId: MEDIA_ID,
      kind: "photo",
      variant: "original",
      ext: "jpg",
    });
    const preview = mediaObjectKey({
      eventId: "11111111-2222-3333-4444-555555555555",
      mediaId: MEDIA_ID,
      kind: "video",
      variant: "preview",
      ext: "mp4",
    });
    expect(parseMediaIdFromKey(original)).toBe(MEDIA_ID);
    expect(parseMediaIdFromKey(preview)).toBe(MEDIA_ID);
  });

  it("returns null for keys that aren't our layout (never delete the unknown)", () => {
    expect(parseMediaIdFromKey("")).toBeNull();
    // Wrong prefix.
    expect(
      parseMediaIdFromKey(`uploads/x/photo/${MEDIA_ID}/original.jpg`),
    ).toBeNull();
    // Too few segments.
    expect(parseMediaIdFromKey(`events/${MEDIA_ID}/original.jpg`)).toBeNull();
    // Too many segments.
    expect(
      parseMediaIdFromKey(`events/evt/photo/${MEDIA_ID}/extra/original.jpg`),
    ).toBeNull();
    // mediaId segment isn't a UUID.
    expect(
      parseMediaIdFromKey("events/evt/photo/not-a-uuid/original.jpg"),
    ).toBeNull();
  });
});

describe("parseExtFromKey", () => {
  it("pulls the lowercased extension from the last segment", () => {
    expect(parseExtFromKey("events/e/photo/m/original.JPG")).toBe("jpg");
    expect(parseExtFromKey("events/e/video/m/original.mp4")).toBe("mp4");
    expect(parseExtFromKey("events/e/video/m/original.mov")).toBe("mov");
  });

  it("returns null when there is no clean extension", () => {
    expect(parseExtFromKey("")).toBeNull();
    expect(parseExtFromKey("events/e/photo/m/original")).toBeNull(); // no dot
    expect(parseExtFromKey("no-slashes-no-dot")).toBeNull();
    expect(parseExtFromKey("events/e/photo/m/.hidden")).toBeNull(); // dotfile, no name
  });
});
