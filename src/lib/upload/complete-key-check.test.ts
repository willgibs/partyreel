/**
 * The complete seam's key/kind/ext binding, tested through the pure checker (the `server-only`
 * pipeline calls it verbatim and maps any problem to a bad_key refusal). The keys here are built
 * with the real mediaObjectKey so the tests break if the layout ever drifts.
 */
import { describe, expect, it } from "vitest";

import { extForMime } from "@/lib/media/limits";
import { classifyMime } from "@/lib/media/validators";
import { mediaObjectKey } from "@/lib/r2/keys";
import { checkCompleteKeyConsistency } from "@/lib/upload/complete-key-check";

const EVENT_ID = "11111111-2222-3333-4444-555555555555";
const MEDIA_ID = "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d";

/** Exactly what presign mints for a given content_type (kind + ext derived server-side). */
function mintedPair(contentType: string) {
  const kind = classifyMime(contentType)!;
  const ext = extForMime(contentType)!;
  return {
    key: mediaObjectKey({
      eventId: EVENT_ID,
      mediaId: MEDIA_ID,
      kind,
      variant: "original",
      ext,
    }),
    previewKey: mediaObjectKey({
      eventId: EVENT_ID,
      mediaId: MEDIA_ID,
      kind,
      variant: "preview",
      ext: "webp",
    }),
    kind,
    ext,
  };
}

describe("checkCompleteKeyConsistency", () => {
  it("accepts exactly what presign minted (photo and video, with and without preview)", () => {
    for (const mime of ["image/jpeg", "video/mp4", "image/heic"]) {
      const { key, previewKey, kind, ext } = mintedPair(mime);
      expect(
        checkCompleteKeyConsistency({ key, previewKey, kind, ext }),
        mime,
      ).toBeNull();
      expect(
        checkCompleteKeyConsistency({ key, previewKey: null, kind, ext }),
        mime,
      ).toBeNull();
      expect(
        checkCompleteKeyConsistency({ key, previewKey: undefined, kind, ext }),
        mime,
      ).toBeNull();
    }
  });

  it("refuses the variant swap (the preview metered as the original)", () => {
    const { key, previewKey, kind, ext } = mintedPair("image/jpeg");
    // key and preview_key swapped wholesale:
    expect(
      checkCompleteKeyConsistency({ key: previewKey, previewKey: key, kind, ext }),
    ).toBe("key_not_original");
    // only the preview slot wrong (a second original in it):
    expect(
      checkCompleteKeyConsistency({ key, previewKey: key, kind, ext }),
    ).toBe("preview_not_preview");
  });

  it("refuses the kind swap (video bytes completed as a photo row)", () => {
    // Presign classified video/mp4 and minted a video key; the completion echoes image/jpeg
    // (kind=photo, ext=jpg) to dodge the free-tier photos-only gate.
    const minted = mintedPair("video/mp4");
    expect(
      checkCompleteKeyConsistency({
        key: minted.key,
        previewKey: null,
        kind: classifyMime("image/jpeg")!,
        ext: extForMime("image/jpeg"),
      }),
    ).toBe("key_kind_mismatch");
  });

  it("refuses an ext that disagrees with the minted key (content_type drift)", () => {
    // Same kind (photo) but a different photo mime than presign minted: jpg key, png completion.
    const minted = mintedPair("image/jpeg");
    expect(
      checkCompleteKeyConsistency({
        key: minted.key,
        previewKey: null,
        kind: classifyMime("image/png")!,
        ext: extForMime("image/png"),
      }),
    ).toBe("key_ext_mismatch");
    // A mime presign could never have minted a key for (ext unmapped) can never complete.
    expect(
      checkCompleteKeyConsistency({
        key: minted.key,
        previewKey: null,
        kind: minted.kind,
        ext: null,
      }),
    ).toBe("key_ext_mismatch");
  });

  it("refuses a preview whose kind or ext isn't the minted one", () => {
    const photo = mintedPair("image/jpeg");
    const video = mintedPair("video/mp4");
    // A video-side preview attached to a photo completion:
    expect(
      checkCompleteKeyConsistency({
        key: photo.key,
        previewKey: video.previewKey,
        kind: photo.kind,
        ext: photo.ext,
      }),
    ).toBe("preview_kind_mismatch");
    // A non-webp "preview" (previews are always the client-generated WebP):
    expect(
      checkCompleteKeyConsistency({
        key: photo.key,
        previewKey: mediaObjectKey({
          eventId: EVENT_ID,
          mediaId: MEDIA_ID,
          kind: "photo",
          variant: "preview",
          ext: "jpg",
        }),
        kind: photo.kind,
        ext: photo.ext,
      }),
    ).toBe("preview_ext_not_webp");
  });

  it("refuses non-media-shaped keys outright", () => {
    const { kind, ext } = mintedPair("image/jpeg");
    for (const junk of [
      "",
      "events/x/photo/original.jpg",
      `events/${EVENT_ID}/photo/${MEDIA_ID}/original.jpg/extra`,
      "../../etc/passwd",
    ]) {
      expect(
        checkCompleteKeyConsistency({ key: junk, previewKey: null, kind, ext }),
        junk,
      ).toBe("key_not_original");
    }
  });
});
