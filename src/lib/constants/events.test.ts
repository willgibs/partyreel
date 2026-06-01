import { describe, expect, it } from "vitest";

import {
  EVENTS_HUB,
  EVENT_TYPE_SLUGS,
  EVENT_TYPES,
  getEventType,
} from "@/lib/constants/events";
import { EVENT_PRESENTATION } from "@/lib/constants/events-layout";

describe("event-type constants", () => {
  it("has unique slugs and complete text fields", () => {
    expect(new Set(EVENT_TYPE_SLUGS).size).toBe(EVENT_TYPE_SLUGS.length);
    expect(EVENT_TYPES.length).toBeGreaterThan(0);
    for (const eventType of EVENT_TYPES) {
      for (const field of [
        eventType.slug,
        eventType.navLabel,
        eventType.teaser,
        eventType.headline,
        eventType.subhead,
        eventType.intro,
        eventType.ctaTitle,
        eventType.ogTitle,
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

  it("getEventType resolves known slugs and rejects unknown", () => {
    for (const slug of EVENT_TYPE_SLUGS) {
      expect(getEventType(slug)?.slug).toBe(slug);
    }
    expect(getEventType("not-an-event-type")).toBeUndefined();
  });

  it("every event type has an /events presentation (no type renders unstyled)", () => {
    for (const eventType of EVENT_TYPES) {
      expect(EVENT_PRESENTATION[eventType.slug]).toBeDefined();
    }
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
