import { describe, expect, it } from "vitest";

import {
  EVENT_TYPE_SLUGS,
  EVENT_TYPES,
  getEventType,
} from "@/lib/constants/events";

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
});
