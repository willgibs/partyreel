import { describe, expect, it } from "vitest";

import {
  eventAlbumSlug,
  EVENTS_HUB,
  EVENT_TYPE_SLUGS,
  EVENT_TYPES,
  getEventType,
} from "@/lib/constants/events";
import { isMarketingImageId } from "@/lib/constants/marketing-media";

describe("event-type constants", () => {
  it("has unique slugs and complete text fields", () => {
    expect(new Set(EVENT_TYPE_SLUGS).size).toBe(EVENT_TYPE_SLUGS.length);
    expect(EVENT_TYPES.length).toBeGreaterThan(0);
    for (const eventType of EVENT_TYPES) {
      for (const field of [
        eventType.slug,
        eventType.navLabel,
        eventType.singularLabel,
        eventType.teaser,
        eventType.headline,
        eventType.subhead,
        eventType.intro,
        eventType.ctaTitle,
        eventType.ogTitle,
        eventType.reelAngle,
        // The wiring round's own slots: a blank one renders an empty lockup
        // line, an unnamed album or a headless statement, and all three look
        // like a layout bug rather than missing copy.
        eventType.subheadShort,
        eventType.albumName,
        eventType.statement.claim,
        eventType.statement.line,
        eventType.object,
      ]) {
        expect(field.trim()).not.toBe("");
      }
      expect(eventType.nestedThemes.length).toBeGreaterThan(0);
      expect(eventType.howItHelps.length).toBeGreaterThan(0);
      for (const help of eventType.howItHelps) {
        expect(help.title.trim()).not.toBe("");
        expect(help.body.trim()).not.toBe("");
      }
      expect(eventType.faq.length).toBeGreaterThan(0);
      for (const item of eventType.faq) {
        expect(item.q.trim()).not.toBe("");
        expect(item.a.trim()).not.toBe("");
      }
    }
  });

  it("keeps the phone's subhead genuinely shorter than the full one", () => {
    // Will (2026-09-19, `the-phone`): "The copy on this one is too bulky now,
    // pushing the visual down too far (sub hero particularly)." A short line
    // that is not short is the lockup unchanged with twice the copy to keep.
    for (const eventType of EVENT_TYPES) {
      expect(
        eventType.subheadShort.length,
        `${eventType.slug}: the phone's line is not shorter`,
      ).toBeLessThan(eventType.subhead.length);
      expect(eventType.subheadShort.length, eventType.slug).toBeLessThan(90);
    }
  });

  it("points every media slot at a real manifest photograph", () => {
    // events.ts is the ONE home for a per-type still (five components named
    // their own before the wiring round). A typo here throws at request time on
    // one page only, which is the worst place to find it.
    for (const eventType of EVENT_TYPES) {
      const ids = [
        eventType.media.card,
        eventType.media.turn,
        ...eventType.media.object,
        ...(eventType.media.statement ?? []),
      ];
      for (const id of ids) {
        expect(isMarketingImageId(id), `${eventType.slug} -> ${id}`).toBe(true);
      }
    }
    for (const id of EVENTS_HUB.heroPrints) {
      expect(isMarketingImageId(id), `hub -> ${id}`).toBe(true);
    }
  });

  it("gives the hub one print per type, in EVENT_TYPES order", () => {
    // The hub's object has to say ANY event, so its pile is one frame per type
    // rather than four of whatever photographs well.
    expect(EVENTS_HUB.heroPrints).toHaveLength(EVENT_TYPES.length);
    expect(new Set(EVENTS_HUB.heroPrints).size).toBe(EVENT_TYPES.length);
  });

  it("derives an album slug from an album name, and never an empty one", () => {
    expect(eventAlbumSlug("Maya and Jay")).toBe("maya-and-jay");
    expect(eventAlbumSlug("Summit 2026")).toBe("summit-2026");
    // Punctuation collapses rather than leaving a hanging dash in an address.
    expect(eventAlbumSlug("  Sam's 30th!  ")).toBe("sam-s-30th");
    for (const eventType of EVENT_TYPES) {
      expect(eventAlbumSlug(eventType.albumName), eventType.slug).toMatch(
        /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      );
    }
  });

  it("getEventType resolves known slugs and rejects unknown", () => {
    for (const slug of EVENT_TYPE_SLUGS) {
      expect(getEventType(slug)?.slug).toBe(slug);
    }
    expect(getEventType("not-an-event-type")).toBeUndefined();
  });

  it("contains no em-dashes (copy policy guard for this file)", () => {
    // Does NOT cover the [slug] OG image (JSX, not in EVENT_TYPES) — the repo
    // em-dash grep-gate guards that file.
    expect(JSON.stringify(EVENT_TYPES)).not.toContain("—");
  });

  it("EVENTS_HUB has complete hero, benefits, and faq copy", () => {
    for (const field of [
      EVENTS_HUB.eyebrow,
      EVENTS_HUB.headline,
      EVENTS_HUB.subhead,
      EVENTS_HUB.overview,
    ]) {
      expect(field.trim()).not.toBe("");
    }
    expect(EVENTS_HUB.benefits.length).toBeGreaterThan(0);
    for (const benefit of EVENTS_HUB.benefits) {
      expect(benefit.title.trim()).not.toBe("");
      expect(benefit.body.trim()).not.toBe("");
    }
    expect(EVENTS_HUB.faq.length).toBeGreaterThan(0);
    for (const item of EVENTS_HUB.faq) {
      expect(item.q.trim()).not.toBe("");
      expect(item.a.trim()).not.toBe("");
    }
  });
});
