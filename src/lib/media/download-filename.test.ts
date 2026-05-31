import { describe, expect, it } from "vitest";

import { buildDownloadFilename } from "@/lib/media/download-filename";

const MEDIA_ID = "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d";
const photoKey = `events/11111111-2222-3333-4444-555555555555/photo/${MEDIA_ID}/original.jpg`;
const videoKey = `events/11111111-2222-3333-4444-555555555555/video/${MEDIA_ID}/original.mp4`;

describe("buildDownloadFilename", () => {
  it("slugs the event name and appends a short id + the key's extension", () => {
    expect(
      buildDownloadFilename({
        eventName: "Sarah's Wedding",
        key: photoKey,
        type: "photo",
      }),
    ).toBe("sarahs-wedding-0a8b3c2d.jpg");
  });

  it("strips diacritics and collapses punctuation/emoji to single hyphens", () => {
    expect(
      buildDownloadFilename({
        eventName: "Tom & Café 🎉",
        key: photoKey,
        type: "photo",
      }),
    ).toBe("tom-cafe-0a8b3c2d.jpg");
  });

  it("falls back to 'partyreel' when the name slugs to nothing", () => {
    expect(
      buildDownloadFilename({
        eventName: "🎉🎊",
        key: videoKey,
        type: "video",
      }),
    ).toBe("partyreel-0a8b3c2d.mp4");
  });

  it("derives the extension from the key (e.g. .mov)", () => {
    const movKey = `events/e/video/${MEDIA_ID}/original.mov`;
    expect(
      buildDownloadFilename({
        eventName: "Road Trip",
        key: movKey,
        type: "video",
      }),
    ).toBe("road-trip-0a8b3c2d.mov");
  });

  it("falls back to a type-based extension when the key has none", () => {
    expect(
      buildDownloadFilename({
        eventName: "Bare",
        key: "no-ext",
        type: "photo",
      }),
    ).toBe("bare.jpg");
    expect(
      buildDownloadFilename({
        eventName: "Bare",
        key: "no-ext",
        type: "video",
      }),
    ).toBe("bare.mp4");
  });

  it("omits the id suffix when the key has no parseable mediaId", () => {
    expect(
      buildDownloadFilename({
        eventName: "No Id",
        key: "events/e/photo/not-a-uuid/original.png",
        type: "photo",
      }),
    ).toBe("no-id.png");
  });
});
