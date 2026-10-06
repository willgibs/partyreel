import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ABOUT_PRESS_KIT } from "@/lib/constants/about";
import {
  CONTACT_DIRECTORY,
  CONTACT_TOPIC_VALUES,
  CONTACT_TOPICS,
  contactTopicLabel,
} from "@/lib/constants/contact";
import { getAllSlugs, HELP_CATEGORIES } from "@/lib/content/help";
import { entries } from "@/testing/source-tree";

const CINEMA = join(process.cwd(), "src/app/(marketing)/(cinema)");

/** A marketing route that is a real page (the hints and the directory link no other kind). */
function pageExists(path: string): boolean {
  return existsSync(join(CINEMA, path, "page.tsx"));
}

/**
 * A door may name an anchor on a real page (the press kit band, `/about#press`): the page
 * must exist AND something in its folder must carry that id, or the link lands at the top of
 * the page with nothing to say why. The id may sit in the page or a piece beside it
 * (about/press-kit-band.tsx), so the whole folder is read.
 */
function pageHasAnchor(path: string, fragment: string): boolean {
  const dir = join(CINEMA, path);
  const ids = new Set<string>();
  for (const file of entries(dir)
    .map((entry) => entry.name)
    .filter((f) => f.endsWith(".tsx"))) {
    const src = readFileSync(join(dir, file), "utf8");
    for (const m of src.matchAll(/\bid="([\w-]+)"/g)) ids.add(m[1]);
    // The band writes its id from the constant the doors' address is built from.
    if (src.includes("id={ABOUT_PRESS_KIT.id}")) ids.add(ABOUT_PRESS_KIT.id);
  }
  return ids.has(fragment);
}

/** Every href a topic's hint shows, with the topic that shows it. */
const HINT_LINKS = CONTACT_TOPICS.flatMap((topic) =>
  (topic.hint?.links ?? []).map((link) => ({ topic: topic.value, ...link })),
);

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

  it("points every hint link at a real route, help anchor or help article", () => {
    const helpSlugs = new Set<string>(getAllSlugs());
    const categorySlugs = new Set<string>(HELP_CATEGORIES.map((c) => c.slug));
    expect(HINT_LINKS.length).toBeGreaterThan(0);
    for (const { href } of HINT_LINKS) {
      expect(href.startsWith("/"), `${href}: not a site path`).toBe(true);
      const helpAnchor = /^\/help#(.+)$/.exec(href);
      const helpArticle = /^\/help\/([^#]+)$/.exec(href);
      if (helpAnchor) {
        expect(
          categorySlugs.has(helpAnchor[1]),
          `${href}: unknown help category anchor`,
        ).toBe(true);
      } else if (helpArticle) {
        expect(
          helpSlugs.has(helpArticle[1]),
          `${href}: unknown help article slug`,
        ).toBe(true);
      } else {
        const [path, fragment] = href.slice(1).split("#");
        expect(pageExists(path), `${href}: no such page`).toBe(true);
        if (fragment)
          expect(pageHasAnchor(path, fragment), `${href}: no such anchor`).toBe(
            true,
          );
      }
    }
  });

  // contact-page r1 `urgency` (Will: "custom per topic instead of one generic
  // 'try troubleshooting'"): the rule is on the data, so a later edit that
  // collapses two topics onto one shelf link fails here, naming the pair.
  it("gives each topic its own answers, never one shared shelf", () => {
    for (const topic of CONTACT_TOPICS) {
      if (topic.value === "other") {
        expect(topic.hint, "Something else has no path to name").toBeNull();
        continue;
      }
      expect(topic.hint, `${topic.value} has no hint`).not.toBeNull();
      const { text, links } = topic.hint!;
      expect(text.length, `${topic.value}: empty note`).toBeGreaterThan(0);
      // Two lines in the card at its narrowest; longer is an essay under a field.
      expect(text.length, `${topic.value}: note too long`).toBeLessThanOrEqual(
        100,
      );
      expect(links.length, `${topic.value}: links`).toBeGreaterThanOrEqual(1);
      expect(links.length, `${topic.value}: links`).toBeLessThanOrEqual(4);
      const hrefs = links.map((l) => l.href);
      expect(new Set(hrefs).size, `${topic.value}: repeated href`).toBe(
        hrefs.length,
      );
      const labels = links.map((l) => l.label);
      expect(new Set(labels).size, `${topic.value}: repeated label`).toBe(
        labels.length,
      );
    }
    const firsts = CONTACT_TOPICS.flatMap((t) =>
      t.hint ? [{ topic: t.value, href: t.hint.links[0].href }] : [],
    );
    expect(
      new Set(firsts.map((f) => f.href)).size,
      `two topics open on the same link: ${JSON.stringify(firsts)}`,
    ).toBe(firsts.length);
    // The generic shelf link was the complaint; a specific article is the fix.
    for (const { topic, href } of HINT_LINKS) {
      expect(href, `${topic} links a bare help shelf`).not.toMatch(
        /^\/help(#troubleshooting)?$/,
      );
    }
  });

  // The only true timing for a note is REPLY_LINE (no topic runs a faster
  // queue), and the promise-neutralization doctrine keeps published copy to
  // outcomes: a hint that says "within a day" or "priority" would invent a
  // service level. The product's own timings ("the moment payment clears")
  // are not reply promises and stay legal.
  it("makes no reply-timing promise of its own in a hint", () => {
    const PROMISE =
      /\b(within|hours?|days?|minutes?|asap|urgent|priority|faster)\b/i;
    for (const topic of CONTACT_TOPICS) {
      if (!topic.hint) continue;
      expect(topic.hint.text, `${topic.value}: a timing promise`).not.toMatch(
        PROMISE,
      );
    }
  });
});

describe("CONTACT_DIRECTORY", () => {
  it("opens only real pages, each once", () => {
    expect(CONTACT_DIRECTORY.length).toBeGreaterThan(0);
    const hrefs = CONTACT_DIRECTORY.map((d) => d.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    const titles = CONTACT_DIRECTORY.map((d) => d.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const entry of CONTACT_DIRECTORY) {
      expect(entry.href.startsWith("/"), `${entry.href}: not a site path`).toBe(
        true,
      );
      const [path, fragment] = entry.href.slice(1).split("#");
      expect(pageExists(path), `${entry.href}: no such page`).toBe(true);
      if (fragment)
        expect(
          pageHasAnchor(path, fragment),
          `${entry.href}: no such anchor`,
        ).toBe(true);
      expect(entry.body.length, `${entry.title}: empty line`).toBeGreaterThan(
        0,
      );
    }
  });
});
