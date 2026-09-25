import { describe, expect, it } from "vitest";

import { guestAlbumEtag, hostAlbumEtag } from "@/lib/events/album-validator";

const base = {
  eventId: "e0000000-0000-4000-8000-000000000001",
  access: "full" as const,
  gate: null,
  albumMax: 5,
  attrVersion: 2,
  reel: null,
};

describe("the guest's validator", () => {
  it("is strong, quoted and carries the wire version", () => {
    expect(guestAlbumEtag(base)).toMatch(/^"a1-[A-Za-z0-9_-]{27}"$/);
  });

  it("is stable for the same album and the same decision", () => {
    expect(guestAlbumEtag(base)).toBe(guestAlbumEtag({ ...base }));
  });

  it.each([
    ["another album", { eventId: "e0000000-0000-4000-8000-000000000002" }],
    ["a visible change", { albumMax: 6 }],
    ["a rename", { attrVersion: 3 }],
    [
      "the reel's facts",
      {
        reel: {
          showReel: false,
          liveReelEnabled: true,
          styleId: null,
          clip: null,
        },
      },
    ],
    ["another access level", { access: "teaser" as const, gate: "account" }],
  ])("never validates across %s", (_label, over) => {
    expect(guestAlbumEtag({ ...base, ...over })).not.toBe(guestAlbumEtag(base));
  });

  it("never validates across the gate behind one level", () => {
    const account = guestAlbumEtag({
      ...base,
      access: "teaser",
      gate: "account",
    });
    const upload = guestAlbumEtag({
      ...base,
      access: "teaser",
      gate: "upload",
    });
    expect(account).not.toBe(upload);
  });

  it("★ at full access it ignores the presign bucket (links re-mint by id); the teaser rolls with it", () => {
    expect(guestAlbumEtag({ ...base, bucketId: "1" })).toBe(
      guestAlbumEtag({ ...base, bucketId: "2" }),
    );
    const t1 = guestAlbumEtag({
      ...base,
      access: "teaser",
      gate: "account",
      bucketId: "1",
    });
    const t2 = guestAlbumEtag({
      ...base,
      access: "teaser",
      gate: "account",
      bucketId: "2",
    });
    expect(t1).not.toBe(t2);
  });
});

describe("the host's validator", () => {
  const host = { eventId: base.eventId, version: 12, attrVersion: 2 };
  it("moves with the host's version and the attribution, and never equals a guest's", () => {
    expect(hostAlbumEtag({ ...host, version: 13 })).not.toBe(
      hostAlbumEtag(host),
    );
    expect(hostAlbumEtag({ ...host, attrVersion: 3 })).not.toBe(
      hostAlbumEtag(host),
    );
    expect(hostAlbumEtag(host)).not.toBe(guestAlbumEtag(base));
  });
});
