// @contract-for: src/components/marketing/sections/events/event-door.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE DOOR PROOF'S CONTRACT.
 *
 * Will ruled `the-proof=door` and said what was wrong with the drawing in the
 * same line (2026-09-19): "The left side is beautiful with the river, but the
 * real car [card] on the right could use a redesign. Good layout, though. I
 * like the asymmetrical two-column, with demo a bit wider." The failures this
 * holds are the silent ones:
 *
 *  - A COUNT COMING BACK. The board's fixtures promised "128 photos from 31
 *    guests" per type. There is ONE demo album, so four pages saying four
 *    different numbers about it would be four lies, and nothing about the page
 *    would look wrong.
 *  - A DEAD DOOR. With no demo configured a button labelled "Explore the demo"
 *    looks exactly like a live one (the DemoCtaLink contract).
 *  - THE RIVER TAKING FOCUS. It is twelve photographs in flight behind the
 *    promise; announced or focusable it would be twelve unlabelled images
 *    between a heading and its one button.
 *
 * ★ NOT PINNED HERE: the ratio, the gradient, the poster's size, the reel it
 * shows. A contract guards function, never a look.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const source = read("src/components/marketing/sections/events/event-door.tsx");
const river = read("src/components/shared/river/river.tsx");

describe("the events door proof", () => {
  it("promises the album without counting it", () => {
    // The shipped sentence, the one /how-it-works already says about the same
    // album (demo-door.tsx), so the site has one voice for one door.
    expect(source).toContain(
      "A real Partyreel album, curated by the host who ran it, open with no sign-up.",
    );
    // No "N photos from M guests" in any form, per type or otherwise.
    const copy = source.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(copy).not.toMatch(/\d+\s+(photos|guests|attendees|uploads)/i);
  });

  it("opens /demo, and only when a demo exists", () => {
    expect(source).toContain('href="/demo"');
    expect(source).toContain("DEMO_EVENT_URL &&");
    // The whole left column is gated, not just the button: the river IS the
    // demo's picture, so an unset env must not leave a door with no handle.
    const gate = source.indexOf("DEMO_EVENT_URL &&");
    const button = source.indexOf('href="/demo"');
    expect(gate).toBeLessThan(button);
  });

  it("keeps the door the wider column", () => {
    // His layout, kept: seven and five, demo a bit wider.
    expect(source).toContain("lg:col-span-7");
    expect(source).toContain("lg:col-span-5");
    expect(source).toContain("lg:grid-cols-12");
  });

  it("leaves the river silent and unfocusable", () => {
    // The engine owns this; the door must not undo it by wrapping the flow in
    // anything interactive.
    expect(river).toContain("aria-hidden");
    // The flow's own element, from its tag to the self-close: nothing on it
    // may make it reachable, and nothing may wrap it in a control (the one
    // control in this column is the button on the floor, checked below).
    const riverTag = source.slice(
      source.indexOf("<River"),
      source.indexOf("/>", source.indexOf("<River")) + 2,
    );
    expect(riverTag).not.toContain("tabIndex");
    expect(riverTag).not.toContain("onClick");
    const beforeRiver = source.slice(
      source.indexOf("lg:col-span-7"),
      source.indexOf("<River"),
    );
    expect(beforeRiver).not.toContain("<Link");
    expect(beforeRiver).not.toContain("<button");
  });

  it("gives the door column exactly one control", () => {
    // A door is one promise and one way through it. Two buttons in the floor
    // is how a proof beat turns back into a CTA band.
    const floor = source.slice(
      source.indexOf("The floor:"),
      source.indexOf("data-mkt-cut", source.indexOf("The floor:")),
    );
    expect(floor.match(/<Button/g)?.length ?? 0).toBe(1);
  });

  it("shows the reel as a poster rather than a bordered card", () => {
    // The redesign he asked for: the player is poster-first (no bytes until
    // a tap) and the box around it is gone.
    expect(source).toContain("InlineReelPlayer");
    expect(source).not.toContain("autoStart");
    const column = source.slice(source.indexOf("And it ends with a reel."));
    expect(column).not.toMatch(/\bborder\b(?!-)/);
  });

  it("never brings the retired reel band back", () => {
    expect(source).not.toContain("ReelAngleBand");
  });
});
