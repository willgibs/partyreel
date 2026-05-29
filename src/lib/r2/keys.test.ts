import { describe, expect, it } from "vitest";

import { mediaObjectKey } from "@/lib/r2/keys";

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
