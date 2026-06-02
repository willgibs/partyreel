import { describe, expect, it } from "vitest";

import { eventUrl, previewJoinUrl } from "@/lib/events/share-urls";

describe("eventUrl", () => {
  it("builds the absolute /e/<qr_token> link", () => {
    expect(eventUrl("https://partyreel.com", "abc123")).toBe(
      "https://partyreel.com/e/abc123",
    );
  });

  it("tolerates a trailing slash on siteUrl (no double slash)", () => {
    expect(eventUrl("https://partyreel.com/", "xyz")).toBe(
      "https://partyreel.com/e/xyz",
    );
  });
});

describe("previewJoinUrl", () => {
  it("uses a 32-char placeholder token so density matches the real QR", () => {
    const preview = previewJoinUrl("https://partyreel.com");
    expect(preview).toBe(`https://partyreel.com/e/${"0".repeat(32)}`);
    expect(preview.split("/e/")[1]).toHaveLength(32);
  });
});
