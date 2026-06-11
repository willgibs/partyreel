import { describe, expect, it } from "vitest";

import { galleryEtag, type GalleryFingerprintItem } from "./gallery-fingerprint";

const item = (over: Partial<GalleryFingerprintItem> = {}): GalleryFingerprintItem => ({
  id: "m1",
  type: "photo",
  uploaderName: "Alice",
  isHost: false,
  isAnonymous: false,
  ...over,
});

const base = {
  access: "full",
  teaserTotal: null,
  bucketId: "991337",
  items: [item(), item({ id: "m2", uploaderName: null, isAnonymous: true })],
};

describe("galleryEtag", () => {
  it("is stable for identical input and shaped as a strong validator", () => {
    const a = galleryEtag(base);
    expect(a).toBe(galleryEtag({ ...base, items: base.items.map((i) => ({ ...i })) }));
    expect(a).toMatch(/^"g1-[A-Za-z0-9_-]{27}"$/);
  });

  it("changes with item order, membership, and every identity field", () => {
    const a = galleryEtag(base);
    expect(galleryEtag({ ...base, items: [...base.items].reverse() })).not.toBe(a);
    expect(galleryEtag({ ...base, items: base.items.slice(0, 1) })).not.toBe(a);
    expect(
      galleryEtag({ ...base, items: [item({ uploaderName: "Bob" }), base.items[1]] }),
    ).not.toBe(a);
    expect(
      galleryEtag({ ...base, items: [item({ isHost: true }), base.items[1]] }),
    ).not.toBe(a);
    expect(
      galleryEtag({ ...base, items: [item({ isAnonymous: true }), base.items[1]] }),
    ).not.toBe(a);
    expect(
      galleryEtag({ ...base, items: [item({ type: "video" }), base.items[1]] }),
    ).not.toBe(a);
  });

  it("changes with access, teaserTotal, and the presign bucket (the security + freshness keys)", () => {
    const a = galleryEtag(base);
    expect(galleryEtag({ ...base, access: "teaser" })).not.toBe(a);
    expect(galleryEtag({ ...base, teaserTotal: 12 })).not.toBe(a);
    expect(galleryEtag({ ...base, bucketId: "991338" })).not.toBe(a);
  });

  it("null name vs the string 'null' cannot collide (canonical array form)", () => {
    const withNull = galleryEtag({ ...base, items: [item({ uploaderName: null })] });
    const withString = galleryEtag({ ...base, items: [item({ uploaderName: "null" })] });
    expect(withNull).not.toBe(withString);
  });

  it("the fingerprint input shape excludes dimensions BY DESIGN (write-once per id)", () => {
    // Phase 4 threads width/height/durationSeconds through the payload for the
    // masonry; they are immutable per media id, so they ride OUTSIDE the hash.
    // Extra unknown fields on input items must therefore never wobble the etag
    // (the canonical form picks named fields only).
    const a = galleryEtag(base);
    const b = galleryEtag({
      ...base,
      items: base.items.map((i) => ({
        ...i,
        width: 1600,
        height: 1200,
        durationSeconds: 12,
      }) as GalleryFingerprintItem),
    });
    expect(b).toBe(a);
  });
});
