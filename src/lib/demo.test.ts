/**
 * Pins for the demo's pure exports. `lib/demo.ts` reads `env` at module scope
 * (like `site.ts`, its own header comment says so), so it is not directly
 * Vitest-importable without a stand-in — mocked here exactly like the
 * precedent (`footer-door-contract.test.tsx`), except this file wants the
 * REAL implementations under test, so only `@/lib/env` is faked.
 *
 * The `phone=pair` broadcast itself (a Supabase Realtime channel) is UI
 * wiring, verified live (this lane's Handoff) rather than pinned here — what's
 * pure and worth freezing in this file is the channel name, the event name,
 * the two data-URL <-> File conversions the sender and receiver each run, and
 * `pickAboveAlbumState`: the manifest's own explicit ask ("the turn card only
 * in the demo"), which lives here rather than in event-experience.tsx because
 * THAT file transitively imports a Next.js Server Action
 * (live-gallery.tsx's `removeMyUploadGuestAction`) that a plain Vitest run
 * cannot resolve at all (see pickAboveAlbumState's own comment).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_DEMO_QR_TOKEN: undefined,
    NEXT_PUBLIC_SITE_URL: undefined,
  },
}));

import {
  DEMO_PAIR_EVENT,
  DEMO_PAIR_PARAM,
  fileToPairThumbnail,
  newPairId,
  pairChannelName,
  pairThumbnailToFile,
  pickAboveAlbumState,
} from "@/lib/demo";

describe("pairChannelName", () => {
  it("keys the ephemeral channel by the pair id, never the qr_token", () => {
    expect(pairChannelName("abc-123")).toBe("demo-pair:abc-123");
  });
});

describe("newPairId / DEMO_PAIR_PARAM / DEMO_PAIR_EVENT", () => {
  it("mints a fresh id each call", () => {
    expect(newPairId()).not.toBe(newPairId());
  });

  it("names are stable strings (the two sides must agree on both)", () => {
    expect(DEMO_PAIR_PARAM).toBe("pair");
    expect(DEMO_PAIR_EVENT).toBe("arrived");
  });
});

describe("fileToPairThumbnail", () => {
  it("never touches canvas for a non-image file (a video)", async () => {
    const video = new File([new Uint8Array([1, 2, 3])], "clip.mp4", {
      type: "video/mp4",
    });
    await expect(fileToPairThumbnail(video)).resolves.toBeNull();
  });
});

describe("pairThumbnailToFile", () => {
  it("round-trips a data URL back into a File the gallery can hold", async () => {
    // A 1x1 transparent GIF — small enough to write by hand, real enough to
    // decode as an actual image type end to end.
    const dataUrl =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7";
    const file = await pairThumbnailToFile(dataUrl);
    expect(file.name).toBe("from-a-phone.jpg");
    expect(file.type).toBe("image/gif");
    expect(file.size).toBeGreaterThan(0);
  });

  it("accepts a custom filename", async () => {
    const dataUrl = "data:image/jpeg;base64,dGVzdA==";
    const file = await pairThumbnailToFile(dataUrl, "custom.jpg");
    expect(file.name).toBe("custom.jpg");
  });
});

describe("pickAboveAlbumState", () => {
  const base = {
    isDemo: true,
    pairedAsPhone: false,
    pairedArrivals: 0,
    demoUploaded: false,
  };

  it("is never anything but none for a real event, whatever else is true", () => {
    expect(
      pickAboveAlbumState({
        ...base,
        isDemo: false,
        pairedAsPhone: true,
        pairedArrivals: 3,
        demoUploaded: true,
      }),
    ).toBe("none");
  });

  it("is none for a fresh demo visit (no upload, no pairing)", () => {
    expect(pickAboveAlbumState(base)).toBe("none");
  });

  it("is the turn card once this tab's own (simulated) upload lands", () => {
    expect(pickAboveAlbumState({ ...base, demoUploaded: true })).toBe("turn");
  });

  it("is the laptop's line once a paired arrival lands, even with an unrelated own upload", () => {
    expect(
      pickAboveAlbumState({ ...base, demoUploaded: true, pairedArrivals: 1 }),
    ).toBe("paired-laptop");
  });

  it("is the phone's line once this tab has sent a paired upload out", () => {
    expect(
      pickAboveAlbumState({
        ...base,
        demoUploaded: true,
        pairedArrivals: 2,
        pairedAsPhone: true,
      }),
    ).toBe("paired-phone");
  });
});
