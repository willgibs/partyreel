import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CONTACT_TOPIC_VALUES,
  CONTACT_TOPICS,
  contactTopicLabel,
} from "@/lib/constants/contact";
import { getAllSlugs, HELP_CATEGORIES } from "@/lib/content/help";

describe("CONTACT_TOPICS", () => {
  it("mirrors the DB CHECK in the topic migration (change one -> change the other)", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260828001000_contact_topic.sql",
      ),
      "utf8",
    );
    const check = /check \(topic in \(([^)]+)\)\)/.exec(sql);
    expect(check).not.toBeNull();
    const dbValues = check![1]
      .split(",")
      .map((v) => v.trim().replace(/^'|'$/g, ""))
      .sort();
    expect(dbValues).toEqual([...CONTACT_TOPIC_VALUES].sort());
  });

  it("keeps values and labels aligned and unique", () => {
    expect(CONTACT_TOPICS.map((t) => t.value)).toEqual([
      ...CONTACT_TOPIC_VALUES,
    ]);
    const labels = CONTACT_TOPICS.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const label of labels) expect(label.length).toBeGreaterThan(0);
    expect(contactTopicLabel("billing")).toBe("Plans & billing");
    expect(contactTopicLabel("legacy-null")).toBeNull();
    expect(contactTopicLabel(null)).toBeNull();
  });

  it("points every fastest-path hint at a real route", () => {
    const helpSlugs = new Set<string>(getAllSlugs());
    const categorySlugs = new Set<string>(HELP_CATEGORIES.map((c) => c.slug));
    for (const topic of CONTACT_TOPICS) {
      if (!topic.hint) continue;
      const { href } = topic.hint;
      expect(href.startsWith("/")).toBe(true);
      const helpAnchor = /^\/help#(.+)$/.exec(href);
      if (helpAnchor) {
        expect(
          categorySlugs.has(helpAnchor[1]),
          `${href}: unknown help category anchor`,
        ).toBe(true);
      }
      const helpArticle = /^\/help\/([^#]+)$/.exec(href);
      if (helpArticle) {
        expect(
          helpSlugs.has(helpArticle[1]),
          `${href}: unknown help article slug`,
        ).toBe(true);
      }
    }
  });
});
