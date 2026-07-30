import { describe, expect, it } from "vitest";

import {
  PRESERVATION_PREFIX,
  isValidMediaKey,
  mediaObjectKey,
  parseEventIdFromKey,
  parseExtFromKey,
  parseKindFromKey,
  parseMediaIdFromKey,
  parseVariantFromKey,
  preservedForensicsKey,
  preservedOriginalKey,
  reelOutputKey,
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

/**
 * ADR-0023 ruling 3: rendered reel .mp4 bytes are DELIBERATELY exempt from the host's storage
 * meter, and that exemption is only safe because the artifact count is bounded at ONE PER EVENT.
 * The bound is structural (a stable key, so a re-render overwrites in place) rather than metered,
 * so nothing else would notice if the key ever gained a hash, timestamp, or version segment: the
 * old objects would simply accumulate, uncharged and unswept, for as long as a host kept
 * re-rendering. This is the pin the ADR promises. If per-event reels ever become plural, the ADR
 * must be revisited BEFORE this test is changed.
 */
describe("reelOutputKey (ADR-0023: one artifact per event, unmetered)", () => {
  const EVENT_A = "11111111-2222-3333-4444-555555555555";
  const EVENT_B = "99999999-8888-7777-6666-555555555555";

  it("is the exact stable shape, with no render-varying segment", () => {
    expect(reelOutputKey(EVENT_A)).toBe(`events/${EVENT_A}/reel/reel.mp4`);
  });

  it("collapses any number of re-renders onto ONE key (overwrite, never accumulate)", () => {
    const renders = Array.from({ length: 50 }, () => reelOutputKey(EVENT_A));
    expect(new Set(renders).size).toBe(1);
  });

  it("depends on nothing but the event id (no clock, no randomness, no config)", () => {
    // A key built from Date.now()/a config hash/a render id would differ across these calls.
    const first = reelOutputKey(EVENT_A);
    const second = reelOutputKey(EVENT_A);
    expect(second).toBe(first);
    // Substituting the event id back out must leave a FIXED template: nothing else can vary.
    expect(first.replace(EVENT_A, "{eventId}")).toBe(
      "events/{eventId}/reel/reel.mp4",
    );
  });

  it("still namespaces per event (one artifact each, never a shared one)", () => {
    expect(reelOutputKey(EVENT_B)).not.toBe(reelOutputKey(EVENT_A));
    expect(reelOutputKey(EVENT_A).startsWith(`events/${EVENT_A}/`)).toBe(true);
  });

  it("stays non-media-shaped so the orphan sweep leaves it alone", () => {
    // parseMediaIdFromKey null = "not ours, never delete"; event-deletion appends this key
    // explicitly instead (see cron/purge sweepExpiredEvents).
    expect(parseMediaIdFromKey(reelOutputKey(EVENT_A))).toBeNull();
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

describe("isValidMediaKey (QA Pattern A: event-namespace binding)", () => {
  const EVENT_ID = "11111111-2222-3333-4444-555555555555";
  const OTHER_EVENT = "99999999-8888-7777-6666-555555555555";
  const MEDIA_ID = "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d";
  const key = mediaObjectKey({
    eventId: EVENT_ID,
    mediaId: MEDIA_ID,
    kind: "photo",
    variant: "preview",
    ext: "webp",
  });

  it("accepts a key inside the event's namespace", () => {
    expect(isValidMediaKey(key, EVENT_ID)).toBe(true);
  });

  it("rejects another event's key (the cross-event preview plant)", () => {
    expect(isValidMediaKey(key, OTHER_EVENT)).toBe(false);
  });

  it("mirrors the SQL prefix check: the id must be a complete segment", () => {
    // A prefix-of-the-uuid event id must NOT match (events/<uuid> vs events/<uuid>-suffix).
    expect(isValidMediaKey(key, EVENT_ID.slice(0, -1))).toBe(false);
    // Traversal-ish junk never validates.
    expect(isValidMediaKey(`events/../${EVENT_ID}/x`, EVENT_ID)).toBe(false);
    expect(isValidMediaKey("", EVENT_ID)).toBe(false);
  });
});

describe("parseKindFromKey / parseVariantFromKey (QA #6: the key is the issuance record)", () => {
  const EVENT_ID = "11111111-2222-3333-4444-555555555555";
  const MEDIA_ID = "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d";

  it("round-trips kind and variant out of keys mediaObjectKey built", () => {
    const original = mediaObjectKey({
      eventId: EVENT_ID,
      mediaId: MEDIA_ID,
      kind: "video",
      variant: "original",
      ext: "mp4",
    });
    const preview = mediaObjectKey({
      eventId: EVENT_ID,
      mediaId: MEDIA_ID,
      kind: "photo",
      variant: "preview",
      ext: "webp",
    });
    expect(parseKindFromKey(original)).toBe("video");
    expect(parseVariantFromKey(original)).toBe("original");
    expect(parseKindFromKey(preview)).toBe("photo");
    expect(parseVariantFromKey(preview)).toBe("preview");
  });

  it("returns null for the wrong segment count or prefix (never guess)", () => {
    for (const junk of [
      "",
      `events/${EVENT_ID}/original.jpg`, // too few segments
      `events/${EVENT_ID}/photo/${MEDIA_ID}/extra/original.jpg`, // too many
      `uploads/${EVENT_ID}/photo/${MEDIA_ID}/original.jpg`, // wrong prefix
      reelOutputKey(EVENT_ID), // deliberately non-media-shaped
      `${PRESERVATION_PREFIX}${EVENT_ID}/${MEDIA_ID}/original.jpg`,
    ]) {
      expect(parseKindFromKey(junk), junk).toBeNull();
      expect(parseVariantFromKey(junk), junk).toBeNull();
    }
  });

  it("returns null for an unknown kind or variant segment (refuse, never repair)", () => {
    expect(
      parseKindFromKey(`events/${EVENT_ID}/audio/${MEDIA_ID}/original.mp3`),
    ).toBeNull();
    expect(
      parseVariantFromKey(`events/${EVENT_ID}/photo/${MEDIA_ID}/thumb.jpg`),
    ).toBeNull();
    // Dotfile / extension-less last segments have no parseable variant.
    expect(
      parseVariantFromKey(`events/${EVENT_ID}/photo/${MEDIA_ID}/.jpg`),
    ).toBeNull();
    expect(
      parseVariantFromKey(`events/${EVENT_ID}/photo/${MEDIA_ID}/original`),
    ).toBeNull();
  });

  it("handles traversal-ish junk in the segments", () => {
    expect(
      parseKindFromKey(`events/${EVENT_ID}/../${MEDIA_ID}/original.jpg`),
    ).toBeNull();
    expect(
      parseVariantFromKey(`events/${EVENT_ID}/photo/${MEDIA_ID}/..`),
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
