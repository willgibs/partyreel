/**
 * Pins for the demo's pure exports. `lib/demo.ts` reads `env` at module scope
 * (like `site.ts`, its own header comment says so), so it is not directly
 * Vitest-importable without a stand-in — mocked here exactly like the
 * precedent (`footer-door-contract.test.tsx`), except this file wants the
 * REAL implementations under test, so only `@/lib/env` is faked.
 *
 * The `phone=pair` broadcast itself (a Supabase Realtime channel) is UI
 * wiring, pinned where it is driven (event-experience's own tests) — what's
 * pure and worth freezing here is the channel name, the event name, and the
 * two data-URL <-> File conversions the sender and receiver each run.
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
