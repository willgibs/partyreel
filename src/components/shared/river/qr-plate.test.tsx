// @contract-for: src/components/shared/river/qr-plate.tsx
// @contract-for: src/components/shared/river/qr-door-frames.ts
// @contract-for: src/components/marketing/sections/features/shared/feature-door.tsx

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QR_DOOR_FRAMES } from "@/components/shared/river/qr-door-frames";
import {
  QR_MODULE_FLOOR_PX,
  QR_PLATE_PAD_SHARE,
  QR_PLATE_SHARE,
  qrPlateFloorPx,
  qrPlateTop,
  QrRiverPlate,
  qrRiverOrigin,
  qrSpanOf,
} from "@/components/shared/river/qr-plate";
import {
  isMarketingImageId,
  MARKETING_IMAGES,
} from "@/lib/constants/marketing-media";

/**
 * THE CODE THE RIVER POURS OUT OF, and the door it stands in.
 *
 * What this guards is the pair of things that stop working silently:
 *
 *  1  it SCANS. The code's size is a CSS `max()` of a floor measured off its
 *     own value and a share of the door, with no measurement anywhere, so a
 *     narrower door, a longer value or a changed share could each quietly take
 *     a module under the ~3px a phone camera needs and leave a grey square
 *     that still looks right in a screenshot;
 *  2  it is an EASTER EGG, not a second door: decorative to assistive tech,
 *     no link, no label, nothing focusable, and the flow is born INSIDE it so
 *     no photograph is ever seen above the object it falls out of.
 *
 * Plus the one fact about the door that is invisible until a camera fails: the
 * plate paints over both scrims and the flow between them. Will's own note on
 * the plate this replaced ("a scrim over a white plate greys it into exactly
 * the square the short value avoids") is the reason, and DOM order is the only
 * thing enforcing it, because nothing in the link sets a z-index but the plate.
 *
 * Function, never look: no height, no alpha, no duration and no copy is pinned
 * here. Move the code, retune the flow, restyle the plate freely.
 */

const DOOR = readFileSync(
  join(
    process.cwd(),
    "src/components/marketing/sections/features/shared/feature-door.tsx",
  ),
  "utf8",
);

/** The value the door ships, and a much longer one, so the arithmetic is held
 *  against a code that is not the one we happen to draw today. */
const SHORT = "https://partyreel.com/demo";
const LONG = "https://partyreel.com/e/abcdefgh-1234-5678-9abc-def012345678";

/**
 * What a module is actually rendered at, in px, at a door this wide: the
 * plate is border-box and its padding is a share of the DOOR, so the code's
 * own edge is the plate's width less the two paddings, over the span. Both
 * numbers are a property of the VALUE, so they are encoded once per value and
 * not once per width (the sweep below is a thousand widths, and the QR encoder
 * is not free).
 */
const CODE = [SHORT, LONG].map((value) => ({
  value,
  floor: qrPlateFloorPx(value),
  span: qrSpanOf(value),
}));

const moduleAt = (width: number, c: (typeof CODE)[number]) =>
  (Math.max(c.floor, QR_PLATE_SHARE * width) - 2 * QR_PLATE_PAD_SHARE * width) /
  c.span;

describe("the code stays scannable at every width, with nothing measured", () => {
  it("never renders a module under the screen-scanning floor", () => {
    // 240 is narrower than any door the site draws (a phone's column is 343,
    // the hub's 331); 1200 is wider than the hub's full-width lead.
    for (let w = 240; w <= 1200; w += 1) {
      for (const c of CODE) {
        expect(
          moduleAt(w, c),
          `${c.value} at a ${w}px door`,
        ).toBeGreaterThanOrEqual(QR_MODULE_FLOOR_PX);
      }
    }
  });

  it("takes the floor from the VALUE, so a longer link makes a bigger plate", () => {
    expect(qrSpanOf(LONG)).toBeGreaterThan(qrSpanOf(SHORT));
    expect(qrPlateFloorPx(LONG)).toBeGreaterThan(qrPlateFloorPx(SHORT));
    // And the floor really is the span's, not a typed constant.
    expect(qrPlateFloorPx(SHORT)).toBe(
      Math.ceil(
        (qrSpanOf(SHORT) * QR_MODULE_FLOOR_PX * QR_PLATE_SHARE) /
          (QR_PLATE_SHARE - 2 * QR_PLATE_PAD_SHARE),
      ),
    );
  });

  it("carries the floor into the CSS, not only into the arithmetic", () => {
    const { container } = render(<QrRiverPlate ratio={5 / 4} value={SHORT} />);
    const plate = container.querySelector(
      "[style*='--rvr-qr-plate']",
    ) as HTMLElement | null;
    expect(plate, "the plate's width never reached the sheet").not.toBeNull();
    const width = plate!.style.getPropertyValue("--rvr-qr-plate");
    // A `max()` of the value's own floor and a share of the door: either half
    // missing and the code silently stops scanning at one end of the range.
    expect(width).toContain(`${qrPlateFloorPx(SHORT)}px`);
    expect(width).toContain(`${(QR_PLATE_SHARE * 100).toFixed(3)}%`);
    expect(plate!.style.getPropertyValue("--rvr-qr-pad")).toContain(
      `${(QR_PLATE_PAD_SHARE * 100).toFixed(3)}%`,
    );
  });

  it("draws the quiet zone inside the box, which is what the arithmetic assumes", () => {
    const { container } = render(<QrRiverPlate ratio={5 / 4} value={SHORT} />);
    const svg = container.querySelector("svg")!;
    // span, not the module count: a code whose quiet zone lived outside the
    // viewBox would render every module a fifth larger than measured here.
    expect(svg.getAttribute("viewBox")).toBe(
      `0 0 ${qrSpanOf(SHORT)} ${qrSpanOf(SHORT)}`,
    );
  });
});

describe("the plate is an object in a picture, never a second door", () => {
  it("is decorative, unlinked and unreachable by a keyboard", () => {
    const { container } = render(<QrRiverPlate ratio={5 / 4} value={SHORT} />);
    const root = container.firstElementChild!;
    expect(root.getAttribute("aria-hidden")).not.toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(
      container.querySelectorAll(
        "a, button, input, select, textarea, [tabindex], [contenteditable]",
      ),
    ).toHaveLength(0);
    // No label of any kind: the door is already one link (Will: "we don't need
    // the 'scan it' label text").
    expect(container.textContent).toBe("");
  });

  it("is one code and one code only", () => {
    const { container } = render(<QrRiverPlate ratio={5 / 4} value={SHORT} />);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });
});

describe("the flow is born inside the object it pours out of", () => {
  it("puts the birth point between the plate's edges at every shape", () => {
    for (const ratio of [0.4286, 2 / 3, 1, 5 / 4, 1.32, 2]) {
      const top = qrPlateTop(ratio);
      const origin = qrRiverOrigin(ratio);
      expect(origin, `ratio ${ratio}`).toBeGreaterThan(top);
      expect(origin, `ratio ${ratio}`).toBeLessThan(top + QR_PLATE_SHARE);
    }
  });

  it("keeps the whole plate inside the door, however short the door is", () => {
    // From 21:9, the widest card the system draws, to a box twice as tall as
    // it is wide. A door shorter than the plate itself is not a shape that
    // exists, and the arithmetic does not pretend to serve one.
    for (let r = 0.43; r <= 2; r += 0.01) {
      expect(qrPlateTop(r), `ratio ${r.toFixed(2)}`).toBeGreaterThanOrEqual(0);
      // It never sits LOWER than the height the ruling asks for, and it never
      // runs off the bottom of a door too short to hold it.
      expect(qrPlateTop(r)).toBeLessThanOrEqual(0.1 * r + 1e-9);
      expect(qrPlateTop(r) + QR_PLATE_SHARE).toBeLessThanOrEqual(r);
    }
  });
});

describe("the pack the door pours", () => {
  it("is manifest photographs, one card each, every one cropped on purpose", () => {
    expect(QR_DOOR_FRAMES.length).toBeGreaterThan(3);
    const byId = new Map(MARKETING_IMAGES.map((i) => [i.src, i.id]));
    const ids = QR_DOOR_FRAMES.map((f) => byId.get(f.src));
    for (const id of ids) {
      expect(id, "a frame that is not in the marketing manifest").toBeDefined();
      expect(isMarketingImageId(id!)).toBe(true);
    }
    // No photograph is ever doubled in view.
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of QR_DOOR_FRAMES) expect(f.position).toMatch(/%\s/);
  });
});

describe("the door's layers", () => {
  it("paints the code over both scrims, with the flow between them", () => {
    // Nothing in the link sets a z-index but the plate, so DOM ORDER is the
    // whole stacking rule: the visual's fade, then the flow, then the card's
    // copy gradient, then the code on top of all of it.
    const restScrim = DOOR.indexOf("from-black/85 via-black/40");
    const flow = DOOR.indexOf("<River");
    const copyScrim = DOOR.indexOf("style={CARD_COPY_SCRIM}");
    const plate = DOOR.indexOf("<QrRiverPlate");
    expect(restScrim, "the visual's own fade").toBeGreaterThan(0);
    expect(flow, "the flow").toBeGreaterThan(restScrim);
    expect(copyScrim, "the card's copy gradient").toBeGreaterThan(flow);
    expect(plate, "the code").toBeGreaterThan(copyScrim);
  });

  it("points the code at the demo rather than at the page it is already on", () => {
    expect(DOOR).toMatch(/QR_DOOR_VALUE\s*=\s*`\$\{SITE_URL\}\/demo`/);
  });
});
