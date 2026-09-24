import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FEATURE_PAGE_SLUGS } from "@/lib/constants/feature-pages";
import { isMarketingImageId } from "@/lib/constants/marketing-media";

/**
 * The door registry's contract. Source-scanned where the rule is about the
 * file (the footer-contract precedent) and evaluated where it is about data:
 * every feature page must have a door with a real manifest photograph, or the
 * hub renders a bare ink card for it with no error. The door's LOOK (no lamp,
 * no tilt, no photograph twice) was pinned here until the "less is more"
 * reset (2026-09-12); a contract keeps a component working, never its look.
 */
const source = readFileSync(
  join(
    process.cwd(),
    "src/components/marketing/sections/features/shared/feature-door.tsx",
  ),
  "utf8",
);

/** The `SIGNATURE` map's slug -> image pairs, read off the source. */
function signatureImages(): Record<string, string> {
  const block = source.slice(
    source.indexOf("const SIGNATURE"),
    source.indexOf("/** The reel poster"),
  );
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/^\s{2}(\w+): \{\s*\n\s*image: "([^"]+)"/gm)) {
    out[m[1]] = m[2];
  }
  return out;
}

describe("the feature doors", () => {
  it("gives every registry page a photograph, except the QR plate", () => {
    const images = signatureImages();
    expect(
      Object.keys(images).length,
      "the signature scan found nothing",
    ).toBeGreaterThan(3);
    for (const slug of FEATURE_PAGE_SLUGS) {
      if (slug === "qr") {
        expect(
          images[slug],
          "the QR door is the one made object",
        ).toBeUndefined();
        continue;
      }
      expect(images[slug], `${slug} has no door photograph`).toBeDefined();
    }
  });

  it("only ever points at manifest images", () => {
    for (const [slug, id] of Object.entries(signatureImages())) {
      expect(isMarketingImageId(id), `${slug} -> ${id}`).toBe(true);
    }
  });

  it("keeps the white focus ring, offset inward, on the photographic link", () => {
    // `outline-ring` lands ~1.4:1 on a dark photograph (the footer round's
    // token-redeclaration trap in its keyboard form).
    expect(source).toContain("focus-visible:outline-white");
    expect(source).toContain("focus-visible:-outline-offset-4");
  });
});
