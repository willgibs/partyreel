import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EVENT_TYPES } from "@/lib/constants/events";

/**
 * THE EVENT CARD: one component at both sizes, a photograph slot filled for
 * every type, a link out of every card, and the measured copy scrim that keeps
 * its white copy legible over any photograph. A card that stops being a link
 * still looks exactly like a card, which is why the source is read. How the
 * card looks (the scrim's numbers, the corner, the type step, the hover) is
 * the Library's to show.
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

  it("fills a photograph slot for every type", () => {
    // Every type carries a card still in events.ts (a named stand-in where the
    // manifest has no honest subject yet), and the card reads that one slot.
    for (const type of EVENT_TYPES) {
      expect(type.media.card.trim(), type.slug).not.toBe("");
    }
    expect(card).toContain("type.media.card");
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

  it("wears the measured copy scrim, so its white copy stays legible", () => {
    // CARD_COPY_SCRIM is measured per pixel on every door and every event card
    // at 1440 and 375 (feature-door.tsx carries the readings). A card that
    // spells its own gradient is a card nobody measured.
    expect(card).toContain("CARD_COPY_SCRIM");
  });
});
