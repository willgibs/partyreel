import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { marketingImage } from "@/lib/constants/marketing-media";

import { PrivacyLens, PrivacyLensPools } from "./lens-stage";
import {
  keyframeNames,
  LENS_KEYFRAMES,
  lensVars,
  PANE_SIZES,
  PRIVACY_STILL,
  REACHES,
  VEIL_SIZES,
} from "./privacy-lens";

/**
 * THE STAGE'S MARKUP, and the page's wiring of it. How it looks is judged in a
 * browser (the frames and the contrast are the Handoff's numbers); these hold
 * what a swap or a refactor could break without a visible change: the picture is
 * hidden from assistive technology (the words are the page's), its two copies of
 * the photograph are one still at two sizes, the veil is a filtered layer of its
 * own that the pane's sharp photograph is never inside, and the hero hands the
 * stage its sizes.
 */

describe("the privacy hero's stage", () => {
  it("is decorative, and writes the pane's keyframes once", () => {
    const { container } = render(<PrivacyLens />);
    const stage = container.querySelector(".pvl-stage");
    expect(stage).not.toBeNull();
    expect(stage).toHaveAttribute("aria-hidden", "true");
    const styles = container.querySelectorAll("style");
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toBe(LENS_KEYFRAMES);
    for (const reach of REACHES)
      for (const name of Object.values(keyframeNames(reach)))
        expect(styles[0].textContent).toContain(`@keyframes ${name}{`);
  });

  it("carries the photograph twice, one still at two sizes, with no alt text to read aloud", () => {
    const { container } = render(<PrivacyLens />);
    const images = [...container.querySelectorAll("img")];
    // The veil's photograph and the pane's own: the same box cover-fit the same way.
    expect(images).toHaveLength(2);
    expect(container.querySelectorAll(".pvl-lens img")).toHaveLength(1);
    expect(container.querySelectorAll(".pvl-photo img")).toHaveLength(1);
    const photo = marketingImage(PRIVACY_STILL);
    for (const img of images) {
      expect(img).toHaveAttribute("alt", "");
      expect(decodeURIComponent(img.getAttribute("src") ?? "")).toContain(
        photo.src,
      );
    }
    // The veil is blurred past recognising anything, so it asks for a small file; the pane is sharp.
    expect(
      container.querySelector(".pvl-photo img")?.getAttribute("sizes"),
    ).toBe(VEIL_SIZES);
    expect(
      container.querySelector(".pvl-lens img")?.getAttribute("sizes"),
    ).toBe(PANE_SIZES);
  });

  it("veils the photograph in a layer of its own, and the pane's photograph is never inside it", () => {
    const { container } = render(<PrivacyLens />);
    // The filter is on `.pvl-photo`: a pane inside it would be blurred, the thing it exists to show.
    const veil = container.querySelector(".pvl-photo");
    expect(veil?.querySelector(".pvl-lens, .pvl-view")).toBeNull();
    expect(veil?.closest(".pvl-lens")).toBeNull();
    // No live backdrop filter under the moving pane (the lightbox's `glass-behind` is not worn here).
    expect(container.querySelector(".glass-behind, .glass")).toBeNull();
    expect(container.querySelector(".pvl-tint")).not.toBeNull();
  });

  it("stacks, bottom to top: the veil, its tint, the pane, the falls", () => {
    const { container } = render(<PrivacyLens />);
    const order = [...(container.querySelector(".pvl-stage")?.children ?? [])]
      .map((el) => el.className)
      .filter((c) => c.startsWith("pvl-"))
      .map((c) => c.split(" ")[0]);
    expect(order).toEqual(["pvl-photo", "pvl-tint", "pvl-track", "pvl-falls"]);
  });

  it("hands the words two pools, hidden from assistive technology", () => {
    const { container } = render(<PrivacyLensPools />);
    const pools = container.querySelectorAll("[aria-hidden='true']");
    expect(pools).toHaveLength(2);
    expect(container.querySelector(".pvl-pool")).not.toBeNull();
    expect(container.querySelector(".pvl-eyebrow-pool")).not.toBeNull();
  });
});

describe("the privacy page's hero", () => {
  const page = readFileSync(
    join(
      process.cwd(),
      "src/app/(marketing)/(cinema)/features/privacy/page.tsx",
    ),
    "utf8",
  ).replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  it("is the shared lockup over the lens, in the hero the bands are the padding of", () => {
    expect(page).toContain("backdrop={<PrivacyLens />}");
    expect(page).toContain('className="pvl-hero"');
    expect(page).toContain("style={lensVars()}");
    expect(page).toContain("<PrivacyLensPools />");
    // Still the one PageHero, still the cut entrance, the h1 untouched (the LCP rule).
    expect(page).toContain('entrance="cut"');
    expect(page.match(/<PageHero/g)).toHaveLength(1);
  });

  it("writes every custom property the stage's sheet reads", () => {
    const vars = Object.keys(lensVars());
    for (const name of [
      "--pvl-hdr",
      "--pvl-d",
      "--pvl-gap",
      "--pvl-band",
      "--pvl-edge",
      "--pvl-cycle-wide",
      "--pvl-cycle-narrow",
    ])
      expect(vars).toContain(name);
  });
});
