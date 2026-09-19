// @contract-for: src/components/marketing/sections/events/event-object.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EVENT_TYPES,
  type EventObjectKind,
  getEventType,
} from "@/lib/constants/events";
import { isMarketingImageId } from "@/lib/constants/marketing-media";

/**
 * THE OBJECT HERO'S CONTRACT: the object is a DOOR, and only when there is
 * something behind it.
 *
 * Will ruled `hero-theme=object` because it "conveys more about how we actually
 * help that event (such as incorporating the QR)", so a lit object with a
 * decorative code in it would be the ruling missed entirely, and one with a
 * code that points nowhere would be worse. Both fail silently: a drawn QR looks
 * exactly like a real one in a screenshot, and a dead `/demo` link looks exactly
 * like a live one until somebody taps it.
 *
 * Source-scanned where the rule is about the file (the footer-contract
 * precedent) and evaluated where it is about data. It cannot be a render test:
 * `lib/demo.ts` reads `lib/env.ts`, which is deliberately not Vitest-importable.
 *
 * ★ NOT PINNED HERE: how any object LOOKS. A contract guards function, and Will
 * retunes a still life without asking a test.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const source = read(
  "src/components/marketing/sections/events/event-object.tsx",
);
const typePage = read("src/app/(marketing)/(cinema)/events/[slug]/page.tsx");
const hubPage = read("src/app/(marketing)/(cinema)/events/page.tsx");

describe("the event object hero", () => {
  it("renders a REAL code, server-side, not a drawn one", () => {
    // `FooterQr` computes the matrix during the server render (qrcode-generator
    // is DOM-free), so the object costs no client JS. A lucide <QrCode /> or a
    // hand-drawn cell grid here would be a picture of the product's one
    // genuinely scannable object.
    expect(source).toContain("FooterQr");
    expect(source).not.toMatch(/\bQrCode\b/);
    expect(source).not.toContain("badgeQrCells");
  });

  it("encodes /demo rather than the event link", () => {
    // Will's river-card ruling `opens=short`: 25 modules against 33, so a plate
    // this size stays well above the screen-scanning floor. /demo is a 307 to
    // the configured event.
    expect(source).toContain("`${SITE_URL}/demo`");
    expect(source).not.toContain("DEMO_EVENT_URL}`");
    expect(source).toContain('href="/demo"');
  });

  it("shows no code and no dead link when no demo is configured", () => {
    // The DemoCtaLink contract. Every code in this file is behind the gate:
    // the plate returns null on its own, and each object drops the piece that
    // would have held it rather than standing a labelled hole on the table.
    const plate = source.slice(
      source.indexOf("function DemoCode"),
      source.indexOf("function ScanLine"),
    );
    expect(plate).toContain("if (!DEMO_EVENT_URL) return null;");
    // The three pieces built around a code each gate themselves too, so an
    // unset env never leaves an empty card, tent or sleeve row.
    expect(source.match(/\{DEMO_EVENT_URL &&/g)?.length ?? 0).toBeGreaterThan(
      2,
    );
  });

  it("gives the code an accessible name, and never hides it from a reader", () => {
    // The drawn parts are aria-hidden; the link is not. A focusable control
    // inside an aria-hidden subtree is the keyboard trap this refuses.
    expect(source).toContain('aria-label="Open the live demo album"');
    const linkOpen = source.indexOf("<Link");
    const beforeLink = source.slice(0, linkOpen);
    expect(beforeLink).not.toMatch(/aria-hidden[\s\S]{0,200}$/);
  });

  it("knows an object for every type, and takes its stills from events.ts", () => {
    // The switch is exhaustive on EventObjectKind rather than on the slug: a
    // fifth type without an object of its own is a typecheck error instead of
    // an empty hero. This checks the other half, that every kind in the data
    // has a branch in the file.
    for (const type of EVENT_TYPES) {
      expect(source, `${type.slug} -> ${type.object}`).toContain(
        `kind === "${type.object}"`,
      );
    }
    // And no still is named here: every photograph arrives as a prop.
    expect(source).not.toMatch(/"(wedding|party|reception|festival|concert)-/);
  });

  it("stands under the page's ONE h1, through PageHero", () => {
    // The object is the hero's STAGE (PageHero's `children`), never a hero of
    // its own: a page with a second h1 loses its outline with no visual change.
    expect(source).not.toMatch(/<h1\b/);
    for (const [name, page] of [
      ["type page", typePage],
      ["hub", hubPage],
    ] as const) {
      expect(page, name).toContain("<PageHero");
      expect(page, name).not.toMatch(/<h1\b/);
    }
  });
});

describe("the per-type media slots", () => {
  it("names only manifest photographs, in every slot", () => {
    // A typo here renders nothing and throws at request time on one page only.
    for (const type of EVENT_TYPES) {
      const slots = [
        ["card", [type.media.card]],
        ["turn", [type.media.turn]],
        ["object", type.media.object],
        ["statement", type.media.statement ?? []],
      ] as const;
      for (const [slot, ids] of slots) {
        for (const id of ids) {
          expect(
            isMarketingImageId(id),
            `${type.slug}.media.${slot} -> ${id}`,
          ).toBe(true);
        }
      }
    }
  });

  it("gives the album object enough leaves to be an album", () => {
    // The wedding spread draws two leaves of three. Fewer and it silently
    // renders a short leaf, which reads as a broken grid rather than a book.
    const album = EVENT_TYPES.filter((t) => t.object === "album");
    expect(album.length).toBeGreaterThan(0);
    for (const type of album) {
      expect(type.media.object.length, type.slug).toBe(6);
    }
  });

  it("gives the sleeve object its two faces", () => {
    // The trip wallet fans two photographs and one print back; a single still
    // would put the same frame beside itself the day a second one lands.
    for (const type of EVENT_TYPES.filter((t) => t.object === "sleeve")) {
      expect(type.media.object.length, type.slug).toBeGreaterThanOrEqual(2);
    }
  });

  it("draws the badges rather than photographing them", () => {
    // The conference object is the one with no photograph in it, on purpose:
    // the manifest has no honest conference subject and the ruling is that a
    // picture never promises the wrong event.
    for (const type of EVENT_TYPES.filter((t) => t.object === "badges")) {
      expect(type.media.object, type.slug).toEqual([]);
    }
  });

  it("gives a type with no statement prints a product pane to stand beside", () => {
    // `media.statement: null` is the "the visual is the product" call, and the
    // pane it renders needs at least one still so no cell is an empty plate.
    for (const type of EVENT_TYPES) {
      if (type.media.statement !== null) {
        expect(type.media.statement.length, type.slug).toBe(2);
        continue;
      }
      const fallback =
        type.media.object.length > 0 ? type.media.object : [type.media.card];
      expect(fallback.length, type.slug).toBeGreaterThan(0);
    }
  });

  it("keeps every object kind reachable from the data", () => {
    // A kind nobody uses is a branch nobody looks at; one the data uses and the
    // file does not know is an empty hero. Both directions, once.
    const used = new Set<EventObjectKind>(EVENT_TYPES.map((t) => t.object));
    expect(used.size).toBe(EVENT_TYPES.length);
    expect(getEventType("weddings")?.object).toBe("album");
  });
});
