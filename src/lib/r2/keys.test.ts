import { describe, expect, it } from "vitest";

import {
  PRESERVATION_PREFIX,
  mediaObjectKey,
  parseEventIdFromKey,
  parseExtFromKey,
  parseMediaIdFromKey,
  preservedForensicsKey,
  preservedOriginalKey,
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

describe("preservation keys (ADR-0020)", () => {
  const EVENT_ID = "11111111-2222-3333-4444-555555555555";
  const MEDIA_ID = "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d";

  it("builds the segregated layout", () => {
    expect(
      preservedOriginalKey({
        eventId: EVENT_ID,
        mediaId: MEDIA_ID,
        ext: "jpg",
      }),
    ).toBe(`preservation/${EVENT_ID}/${MEDIA_ID}/original.jpg`);
    expect(
      preservedForensicsKey({ eventId: EVENT_ID, mediaId: MEDIA_ID }),
    ).toBe(`preservation/${EVENT_ID}/${MEDIA_ID}/forensics.json`);
  });

  it("stays OUTSIDE the events/ prefix so no delete path can touch it", () => {
    const key = preservedOriginalKey({
      eventId: EVENT_ID,
      mediaId: MEDIA_ID,
      ext: "mp4",
    });
    // The orphan sweep lists only "events/"; a preservation key is never scanned…
    expect(key.startsWith("events/")).toBe(false);
    expect(key.startsWith(PRESERVATION_PREFIX)).toBe(true);
    // …and even if one were, the sweep's recognizer refuses it ("not ours → never delete").
    expect(parseMediaIdFromKey(key)).toBeNull();
    expect(
      parseMediaIdFromKey(
        preservedForensicsKey({ eventId: EVENT_ID, mediaId: MEDIA_ID }),
      ),
    ).toBeNull();
  });
});

describe("parseEventIdFromKey", () => {
  const EVENT_ID = "11111111-2222-3333-4444-555555555555";

  it("round-trips the eventId out of a media key", () => {
    const key = mediaObjectKey({
      eventId: EVENT_ID,
      mediaId: "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d",
      kind: "photo",
      variant: "original",
      ext: "jpg",
    });
    expect(parseEventIdFromKey(key)).toBe(EVENT_ID);
  });

  it("returns null for non-media-shaped keys", () => {
    expect(parseEventIdFromKey("")).toBeNull();
    expect(
      parseEventIdFromKey("events/not-a-uuid/photo/m/original.jpg"),
    ).toBeNull();
    expect(
      parseEventIdFromKey(`preservation/${EVENT_ID}/m/original.jpg`),
    ).toBeNull();
    expect(parseEventIdFromKey(`events/${EVENT_ID}/reel/reel.mp4`)).toBeNull();
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
