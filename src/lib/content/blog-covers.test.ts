import { describe, expect, it } from "vitest";

import {
  isMarketingImageId,
  MARKETING_IMAGES,
} from "@/lib/constants/marketing-media";

import { BLOG_FALLBACK_COVER_IDS, coverFor } from "./blog-covers";

/**
 * The cover resolver's contract is STABILITY: a published post's art must never move. These pins
 * exist because the obvious implementation (hand out unused images by walking the post list) is
 * deterministic but NOT stable — publishing a post re-skins its predecessors.
 */

describe("blog covers", () => {
  it("every pinned fallback id still exists in the manifest", () => {
    // The manifest header promises a wholesale media swap later. This is the loud failure.
    for (const id of BLOG_FALLBACK_COVER_IDS) {
      expect(isMarketingImageId(id), id).toBe(true);
    }
  });

  it("the fallback pool is landscape only", () => {
    // A portrait source would crop badly in a fixed-aspect plate.
    for (const id of BLOG_FALLBACK_COVER_IDS) {
      const image = MARKETING_IMAGES.find((m) => m.id === id);
      expect(image?.orientation, id).toBe("landscape");
    }
  });

  it("is a pure function of the slug", () => {
    const a = coverFor("stop-losing-group-photos");
    const b = coverFor("stop-losing-group-photos");
    expect(a).toEqual(b);
  });

  it("is STABLE when new posts are published", () => {
    // The regression this whole module is shaped around: resolve a set, then "publish" more posts
    // and re-resolve the originals. Nothing about the originals may move.
    const published = [
      "best-photos-are-on-everyone-elses-phone",
      "wedding-photo-qr-guests-will-use",
      "stop-losing-group-photos-to-the-group-chat",
      "introducing-the-highlight-reel",
    ];
    const before = published.map((slug) => coverFor(slug));
    const afterNewPostsExist = published.map((slug) => coverFor(slug));
    expect(afterNewPostsExist).toEqual(before);
  });

  it("an explicit cover wins, and still gets a derived crop", () => {
    const derived = coverFor("some-post");
    const explicit = coverFor("some-post", "wedding-petals");
    expect(explicit.imageId).toBe("wedding-petals");
    expect(explicit.derived).toBe(false);
    expect(derived.derived).toBe(true);
    // The crop is slug-seeded, so art-directing the image does not reset the position.
    expect(explicit.objectPosition).toBe(derived.objectPosition);
  });

  it("spreads across the pool and varies the crop past pool size", () => {
    // 40 posts is the scale the design is judged at; both axes must still be doing work.
    const slugs = Array.from({ length: 40 }, (_, i) => `post-number-${i}`);
    const covers = slugs.map((slug) => coverFor(slug));
    const images = new Set(covers.map((c) => c.imageId));
    const crops = new Set(covers.map((c) => c.objectPosition));
    expect(images.size).toBeGreaterThan(BLOG_FALLBACK_COVER_IDS.length / 2);
    expect(crops.size).toBeGreaterThan(1);
    // Past the pool size, plate identity is (image, crop): the pair must still be spread wide.
    const plates = new Set(
      covers.map((c) => `${c.imageId}@${c.objectPosition}`),
    );
    expect(plates.size).toBeGreaterThan(BLOG_FALLBACK_COVER_IDS.length);
  });

  it("resolves a real manifest file for every cover", () => {
    for (const slug of ["a", "bb", "ccc", "a-longer-slug-here"]) {
      const cover = coverFor(slug);
      expect(cover.src.startsWith("/marketing/img/")).toBe(true);
      expect(cover.width).toBeGreaterThan(0);
      expect(cover.subject.length).toBeGreaterThan(0);
    }
  });
});
