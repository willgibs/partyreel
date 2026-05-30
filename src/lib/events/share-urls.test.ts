import { describe, expect, it } from "vitest";

import { eventShareUrls, previewJoinUrl } from "@/lib/events/share-urls";

describe("event share urls", () => {
  it("builds join + album URLs from an event's tokens", () => {
    const urls = eventShareUrls("https://partyreel.com", {
      qr_token: "abc123",
      share_token: "xyz789",
    });
    expect(urls.joinUrl).toBe("https://partyreel.com/e/abc123");
    expect(urls.albumUrl).toBe("https://partyreel.com/a/xyz789");
  });

  it("tolerates a trailing slash on siteUrl (no double slash)", () => {
    const urls = eventShareUrls("https://partyreel.com/", {
      qr_token: "abc",
      share_token: "xyz",
    });
    expect(urls.joinUrl).toBe("https://partyreel.com/e/abc");
    expect(urls.albumUrl).toBe("https://partyreel.com/a/xyz");
  });

  it("preview URL uses a 32-char placeholder token so density matches the real QR", () => {
    const preview = previewJoinUrl("https://partyreel.com");
    expect(preview).toBe(`https://partyreel.com/e/${"0".repeat(32)}`);
    // Real qr_token length (32 hex) — keep the preview in lockstep.
    expect(preview.split("/e/")[1]).toHaveLength(32);
  });
});
