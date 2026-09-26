import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE EVENTS DOOR'S SILENT FAILURES:
 *
 *  - A COUNT. There is ONE demo album, so four pages saying four different
 *    numbers about it would be four untrue sentences, and nothing about the
 *    page would look wrong.
 *  - A DEAD DOOR. With no demo configured a button labelled "Explore the demo"
 *    looks exactly like a live one (the DemoCtaLink contract).
 *  - THE RIVER TAKING FOCUS. It is twelve photographs in flight behind the
 *    promise; announced or focusable it would be twelve unlabelled images
 *    between a heading and its button.
 *  - A REEL THAT LOADS BEFORE ANYONE ASKED. The player is poster-first.
 *
 * How the door looks (its columns, its gradient, the poster's size) is the
 * Library's to show.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const source = read("src/components/marketing/sections/events/event-door.tsx");
const river = read("src/components/shared/river/river.tsx");

describe("the events door proof", () => {
  it("never counts the demo album", () => {
    // One real album stands behind every door, so a per-type "N photos from M
    // guests" would be a number the album does not have.
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

  it("shows the reel as a poster, with no bytes until a tap", () => {
    expect(source).toContain("InlineReelPlayer");
    expect(source).not.toContain("autoStart");
  });
});
