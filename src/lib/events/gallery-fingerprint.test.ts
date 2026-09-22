import { describe, expect, it } from "vitest";

import { galleryEtag, type GalleryFingerprintItem } from "./gallery-fingerprint";

const item = (over: Partial<GalleryFingerprintItem> = {}): GalleryFingerprintItem => ({
  id: "m1",
  type: "photo",
  uploaderName: "Alice",
  isHost: false,
  isVerified: true,
  isAnonymous: false,
  ...over,
});

const base = {
  access: "full",
  gate: null as string | null,
  teaserTotal: null,
  bucketId: "991337",
  items: [
    item(),
    item({
      id: "m2",
      uploaderName: null,
      isVerified: false,
      isAnonymous: true,
    }),
  ],
};

describe("galleryEtag", () => {
  it("is stable for identical input and shaped as a strong validator", () => {
    const a = galleryEtag(base);
    expect(a).toBe(galleryEtag({ ...base, items: base.items.map((i) => ({ ...i })) }));
    // g3 since the door round (2026-09-21): the gate joined the tuple at g2 -> g3, as isVerified
    // had at g1 -> g2, so a client holding an older ETag must re-pull rather than 304 past a
    // change it cannot see.
    expect(a).toMatch(/^"g3-[A-Za-z0-9_-]{27}"$/);
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
    // The mark is viewer-visible content: a guest who proves an email later must not be served a
    // 304 that keeps the mark on screen.
    expect(
      galleryEtag({ ...base, items: [item({ isVerified: false }), base.items[1]] }),
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

  // THE GATE IS IN THE HASH (the door as three steps, 2026-09-21). `teaser` has two causes now,
  // and the poll carries the gate to the client's step machine: two decisions that differ only in
  // WHY must never validate each other, or a guest whose gate moved would 304 onto the step they
  // already passed. Same items, same level, different door.
  it("never validates across the GATE behind one access level", () => {
    const teaser = { ...base, access: "teaser", teaserTotal: 9 };
    const account = galleryEtag({ ...teaser, gate: "account" });
    const upload = galleryEtag({ ...teaser, gate: "upload" });
    const password = galleryEtag({ ...teaser, gate: "password" });
    expect(account).not.toBe(upload);
    expect(account).not.toBe(password);
    expect(upload).not.toBe(password);
    // And a gate against no gate at the same level.
    expect(galleryEtag({ ...teaser, gate: null })).not.toBe(upload);
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
