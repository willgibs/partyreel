// @contract-for: src/components/marketing/sections/events/event-type-card.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EVENT_TYPES } from "@/lib/constants/events";

/**
 * THE EVENT CARD'S CONTRACT: one anatomy, a photograph under every one of them,
 * and a link out of every one of them.
 *
 * Will, `the-cards=frame` (2026-09-19): "all events should have a photograph
 * (weddings, parties) rather than an artifact (conferences, trips)... only
 * approving the photograph as full bg component here." The two ways that breaks
 * are both silent: a type whose card falls back to an artifact looks fine in
 * isolation and wrong in the grid, and a card that stops being a link still
 * looks exactly like a card.
 *
 * ★ NOT PINNED HERE: the scrim's numbers, the corner, the type step, the hover.
 * A contract guards function, never a look.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const card = read(
  "src/components/marketing/sections/events/event-type-card.tsx",
);
const directory = read(
  "src/components/marketing/sections/events/type-directory.tsx",
);
const teaser = read("src/components/marketing/sections/home/events-teaser.tsx");

describe("the event card", () => {
  it("is the same component at both sizes", () => {
    // The hub's directory and the home row were two components with two
    // opinions about one object, which is how the conference tile ended up an
    // artifact in one place and a photograph in the other.
    for (const [name, code] of [
      ["the hub directory", directory],
      ["the home teaser", teaser],
    ] as const) {
      expect(code, name).toContain("EventCard");
      expect(code, name).not.toContain("EventTypeCard");
    }
    expect(directory).toContain('size="directory"');
    expect(teaser).toContain('size="teaser"');
  });

  it("puts a photograph under every card, and no artifact inside one", () => {
    // Every type carries a card still in events.ts (a named stand-in where the
    // manifest has no honest subject yet), and the card reads that one slot.
    for (const type of EVENT_TYPES) {
      expect(type.media.card.trim(), type.slug).not.toBe("");
    }
    expect(card).toContain("type.media.card");
    // The two artifacts are what the ruling replaced; neither may come back
    // inside a card at either size.
    for (const [name, code] of [
      ["the card", card],
      ["the hub directory", directory],
      ["the home teaser", teaser],
    ] as const) {
      expect(code, name).not.toContain("AttendeeBadge");
      expect(code, name).not.toContain("SharedRoll");
    }
  });

  it("is a link to its own type page", () => {
    expect(card).toContain("href={`/events/${type.slug}`}");
    expect(card).toContain("<Link");
  });

  it("names no still of its own", () => {
    // The whole point of the media slots: a generated set lands in events.ts
    // and nowhere else (ASSETS rows 24 and 25).
    expect(card).not.toMatch(/"(wedding|party|reception|festival|concert)-/);
    expect(directory).not.toMatch(
      /"(wedding|party|reception|festival|concert)-/,
    );
    expect(teaser).not.toMatch(/"(wedding|party|reception|festival|concert)-/);
  });

  it("wears the ruled copy scrim rather than a fresh ramp", () => {
    // CARD_COPY_SCRIM is measured per pixel on every door and every event card
    // at 1440 and 375 (feature-door.tsx carries the readings). A card that
    // spells its own gradient is a card nobody measured.
    expect(card).toContain("CARD_COPY_SCRIM");
  });

  it("keeps the tilt on the hub and off the home row", () => {
    // Will kept the 2x2 because it "introduces each event card more fully and
    // not all at once"; the home row is a supporting beat and the tilt came off
    // it by ruling one round earlier.
    expect(directory).toContain("TiltCard");
    expect(teaser).not.toContain("TiltCard");
  });
});
