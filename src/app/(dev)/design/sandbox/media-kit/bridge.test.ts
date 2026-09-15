import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BRIDGE,
  BRIDGE_BY_ID,
  MIX_LICENSED,
  routeOutcome,
  STAGE_POSTS,
  STAGE_SLUGS,
} from "./bridge";
import { candidate } from "./candidates";
import { STAND_INS } from "./kit";
import { master } from "./shoot";

import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { coverFor } from "@/lib/content/blog-covers";

/**
 * THE BRIDGE, PINNED TO THE REAL BLOG (the media-kit track, round two).
 *
 * The board transcribes each post's cover and crop so it can stay a client
 * component (MDX frontmatter needs node:fs). This test recomputes both from the
 * real files and the real resolver, so a transcription that drifts fails the
 * suite rather than misleading a ruling.
 *
 * ★ It also pins the finding round one got wrong: every post carries an explicit
 * `cover:`, so `blog-covers.ts`'s fallback pool never fires in production and
 * every miscast cover was chosen by a person out of eleven frames.
 */

const BLOG = join(process.cwd(), "content", "blog");

function frontmatter(slug: string): Record<string, string> {
  const text = readFileSync(join(BLOG, `${slug}.mdx`), "utf8");
  const block = text.split("---")[1] ?? "";
  const out: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-z]+): *(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return out;
}

const SLUGS = readdirSync(BLOG)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => f.replace(/\.mdx$/, ""));

describe("the per-post bridge", () => {
  it("covers every published post, exactly once", () => {
    expect(BRIDGE.length).toBe(SLUGS.length);
    expect([...BRIDGE.map((p) => p.slug)].sort()).toEqual([...SLUGS].sort());
  });

  it("every post's title, cover and crop match the real post", () => {
    for (const post of BRIDGE) {
      const fm = frontmatter(post.slug);
      expect(fm.title, post.slug).toBe(post.title);
      expect(fm.cover, post.slug).toBe(post.cover);
      const resolved = coverFor(post.slug, fm.cover);
      expect(resolved.imageId, post.slug).toBe(post.cover);
      expect(resolved.objectPosition, post.slug).toBe(post.crop);
    }
  });

  it("every post chose its cover: the fallback pool never fires in production", () => {
    // Round one's board said the covers were hashed. They are not: the hash is
    // only reached when frontmatter omits `cover:`, and none of them does.
    for (const slug of SLUGS) {
      expect(
        frontmatter(slug).cover,
        `${slug} has no explicit cover`,
      ).toBeTruthy();
    }
  });

  it("every post's shot is a real master frame from the post's own vertical", () => {
    // The fault being fixed is a conference post carrying a festival frame, so
    // the shoot's answer must come from the post's vertical, never from the id
    // it carries today. Two exceptions, both principled: a "general" post has no
    // vertical to draw from, and the three phone-up frames are the product's own
    // argument in a photograph, so they serve any post about scanning or sharing
    // whatever vertical they were shot in.
    for (const post of BRIDGE) {
      const m = master(post.shot);
      if (post.vertical === "general" || m.phoneUp) continue;
      expect(m.vertical, `${post.slug} -> ${post.shot}`).toBe(post.vertical);
    }
  });

  it("every candidate named by a post resolves to a staged file", () => {
    for (const post of BRIDGE) {
      if (!post.candidate) continue;
      expect(
        () => candidate(post.candidate as string),
        post.slug,
      ).not.toThrow();
    }
  });

  it("a post with no candidate says what the search returned instead", () => {
    for (const post of BRIDGE) {
      if (post.candidate) continue;
      expect(post.why.length, post.slug).toBeGreaterThan(40);
    }
  });
});

describe("the bridge per manifest id", () => {
  it("names every one of the twelve, and nothing else", () => {
    const ids = MARKETING_IMAGES.map((m) => m.id).sort();
    expect(Object.keys(BRIDGE_BY_ID).sort()).toEqual(ids);
    expect(STAND_INS.map((s) => s.id).sort()).toEqual(ids);
  });

  it("every id resolves to a staged file", () => {
    for (const [id, key] of Object.entries(BRIDGE_BY_ID)) {
      expect(() => candidate(key), id).not.toThrow();
    }
  });

  it("the mix keeps a licensed frame only where nobody is recognisable", () => {
    // Rule 1.4 in its operative form: the frames the mix does NOT send to the
    // shoot are the ones a licensed photograph is allowed to cover.
    for (const id of MIX_LICENSED) {
      const c = candidate(BRIDGE_BY_ID[id]);
      expect(c.people, id).not.toBe("identifiable");
    }
  });
});

describe("the three posts the stage enlarges", () => {
  it("are real posts, in the order the stage draws them", () => {
    expect(STAGE_POSTS.map((p) => p.slug)).toEqual([...STAGE_SLUGS]);
    for (const p of STAGE_POSTS) expect(BRIDGE).toContain(p);
  });

  /**
   * ★ THE TOGGLE HAS TO DO SOMETHING VISIBLE, AND ROUND TWO'S SET MEANT IT DID
   * NOT. All three of its posts went to the shoot under Mix AND under Ours, so
   * the board's largest element was identical on two of its three routes. This
   * is the test that keeps that from coming back: across the three routes the
   * stage's row of outcomes has to take three distinct shapes.
   */
  it("read differently under every route, so no route flip is inert", () => {
    const shape = (route: "licensed" | "ours" | "mix") =>
      STAGE_POSTS.map((p) => {
        const out = routeOutcome(p, route);
        return out.kind === "ours" ? "ours" : (out.key ?? "empty");
      }).join("|");
    const shapes = [shape("licensed"), shape("ours"), shape("mix")];
    expect(new Set(shapes).size).toBe(3);
  });

  it("cover the three ways this goes wrong: a barred face, a hole, a detail", () => {
    const people = STAGE_POSTS.map((p) =>
      p.candidate ? candidate(p.candidate).people : "empty",
    );
    expect(people).toContain("identifiable");
    expect(people).toContain("empty");
    expect(
      STAGE_POSTS.some((p) =>
        (MIX_LICENSED as readonly string[]).includes(p.candidate ?? ""),
      ),
    ).toBe(true);
  });
});
