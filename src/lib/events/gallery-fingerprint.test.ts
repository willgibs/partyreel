import { describe, expect, it } from "vitest";

import { galleryEtag, type GalleryFingerprintItem } from "./gallery-fingerprint";

const item = (over: Partial<GalleryFingerprintItem> = {}): GalleryFingerprintItem => ({
  id: "m1",
  type: "photo",
  uploaderName: "Alice",
  isHost: false,
  isVerified: true,
  ...over,
});

const base = {
  access: "full",
  gate: null as string | null,
  teaserTotal: null,
  approvedTotal: 2 as number | null,
  bucketId: "991337",
  items: [
    item(),
    item({
      id: "m2",
      uploaderName: null,
      isVerified: false,
    }),
  ],
};

describe("galleryEtag", () => {
  it("is stable for identical input and shaped as a strong validator", () => {
    const a = galleryEtag(base);
    expect(a).toBe(galleryEtag({ ...base, items: base.items.map((i) => ({ ...i })) }));
    // g6 because the payload carries the live reel's facts: a client holding an older ETag must
    // re-pull rather than 304 past a change it cannot see.
    expect(a).toMatch(/^"g7-[A-Za-z0-9_-]{27}"$/);
  });

  // THE LIVE REEL'S FACTS ARE IN THE HASH. A host turning the reel off, an operator's lever, a plan
  // change: none moves a media row, so the validator has to move by itself, or an open album would
  // 304 past the change until the presign bucket rolled.
  it("changes with every live reel fact, and a null never collides with an off switch", () => {
    const reel = {
      showReel: true,
      liveReelEnabled: true,
      styleId: null as string | null,
      clip: { videoAllowed: true, watermark: false, maxSeconds: 60 },
    };
    const on = galleryEtag({ ...base, reel });
    expect(galleryEtag({ ...base, reel: { ...reel } })).toBe(on);
    expect(galleryEtag({ ...base, reel: { ...reel, showReel: false } })).not.toBe(on);
    expect(
      galleryEtag({ ...base, reel: { ...reel, liveReelEnabled: false } }),
    ).not.toBe(on);
    expect(galleryEtag({ ...base, reel: { ...reel, styleId: "warm" } })).not.toBe(on);
    // The host's default hold (a host's "Set for everyone" must reach an open page too); absent
    // hashes as the default it means.
    expect(galleryEtag({ ...base, reel: { ...reel, holdSec: 5 } })).not.toBe(on);
    expect(galleryEtag({ ...base, reel: { ...reel, holdSec: null } })).toBe(on);
    expect(
      galleryEtag({
        ...base,
        reel: { ...reel, clip: { ...reel.clip, watermark: true } },
      }),
    ).not.toBe(on);
    expect(galleryEtag({ ...base, reel: { ...reel, clip: null } })).not.toBe(on);
    expect(galleryEtag({ ...base, reel: null })).not.toBe(on);
    // Absent (a caller that passes no reel) hashes the same as null.
    expect(galleryEtag(base)).toBe(galleryEtag({ ...base, reel: null }));
  });

  // THE ALBUM'S SIZE IS IN THE HASH. The teaser's nine photographs can stay exactly the same while
  // the album grows behind them (a video approved, a photograph removed from deeper in the album),
  // and the header's live count rides this payload: a validator blind to it would 304 the guest
  // past the new number for as long as the nine held still.
  it("changes with approvedTotal alone, the items and the teaser total held still", () => {
    const teaser = { ...base, access: "teaser", gate: "account", teaserTotal: 9 };
    const before = galleryEtag({ ...teaser, approvedTotal: 48 });
    expect(galleryEtag({ ...teaser, approvedTotal: 49 })).not.toBe(before);
    expect(galleryEtag({ ...teaser, approvedTotal: 48 })).toBe(before);
    // A locked gallery's null never collides with an empty album's zero.
    expect(galleryEtag({ ...base, approvedTotal: null })).not.toBe(
      galleryEtag({ ...base, approvedTotal: 0 }),
    );
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

  // THE GATE IS IN THE HASH. `teaser` has two causes, and the poll carries the gate to the client's
  // step machine: two decisions that differ only in WHY must never validate each other, or a guest
  // whose gate moved would 304 onto the step they already passed. Same items, same level, different
  // door.
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
    // The payload threads width/height/durationSeconds through for the masonry;
    // they are immutable per media id, so they ride OUTSIDE the hash.
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
