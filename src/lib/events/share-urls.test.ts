import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  eventUrl,
  preferredEventUrl,
  previewJoinUrl,
} from "@/lib/events/share-urls";

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

describe("preferredEventUrl", () => {
  it("prefers the custom slug when set", () => {
    expect(
      preferredEventUrl("https://partyreel.com", {
        qrToken: "abc123",
        customSlug: "sarahs-wedding",
      }),
    ).toBe("https://partyreel.com/e/sarahs-wedding");
  });

  it("falls back to the qr_token when there's no slug", () => {
    expect(
      preferredEventUrl("https://partyreel.com", {
        qrToken: "abc123",
        customSlug: null,
      }),
    ).toBe("https://partyreel.com/e/abc123");
  });

  it("tolerates a trailing slash on siteUrl", () => {
    expect(
      preferredEventUrl("https://partyreel.com/", {
        qrToken: "abc123",
        customSlug: "my-party",
      }),
    ).toBe("https://partyreel.com/e/my-party");
  });
});

describe("the surfaces that SHOW the readable link", () => {
  // The hub page hands its readable link to the link row and the code
  // mini-modal; the print sheet builds the line under its codes. Both used to
  // type `<site>/<slug>` by hand, a path with no route (a slug resolves only
  // under /e/), so a host read a link that did not open.
  const PAGES = [
    ["the event hub", "src/app/(app)/dashboard/[eventId]/page.tsx"],
    ["the print sheet", "src/app/(print)/dashboard/[eventId]/print/page.tsx"],
  ] as const;

  it.each(PAGES)(
    "%s builds it with preferredEventUrl, never by hand",
    (_label, path) => {
      const source = readFileSync(join(process.cwd(), path), "utf8");
      expect(source).toContain("preferredEventUrl(");
      expect(source).not.toMatch(/siteUrl\}\/\$\{[^}]*custom_slug/);
    },
  );
});
