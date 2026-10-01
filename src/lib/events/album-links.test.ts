import { describe, expect, it, vi } from "vitest";

import { toGuestAlbumLinks } from "@/lib/events/album-guest-links";
import { toHostAlbumLinks } from "@/lib/events/album-host-links";
import { WHO_HOST, WHO_VERIFIED } from "@/lib/events/album-wire";
import type { UploaderIdentity } from "@/lib/media/uploader-identity";

const EVENT = "e0000000-0000-4000-8000-000000000001";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const rows = [
  {
    id: id(1),
    type: "photo" as const,
    original_key: `events/${EVENT}/photo/${id(1)}/original.jpg`,
    preview_key: `events/${EVENT}/photo/${id(1)}/preview.webp`,
  },
  {
    id: id(2),
    type: "video" as const,
    original_key: `events/${EVENT}/video/${id(2)}/original.mp4`,
    preview_key: null,
  },
];
const identities = new Map<string, UploaderIdentity>([
  [
    id(1),
    {
      displayName: "Maya",
      email: "maya@example.com",
      isHost: false,
      isVerified: true,
    },
  ],
  [
    id(2),
    { displayName: "Tom", email: null, isHost: false, isVerified: false },
  ],
]);
const presign = vi.fn(
  async (key: string, filename?: string) =>
    `signed:${key}${filename ? `#${filename}` : ""}`,
);

describe("the guest's links", () => {
  it("tile the preview, view the original (null when it IS the tile), download as an attachment", async () => {
    const [one, two] = await toGuestAlbumLinks(rows, {
      eventName: "Maya & Jay",
      presign,
      identities,
    });
    expect(one.slice(0, 4)).toEqual([
      id(1),
      `signed:${rows[0].preview_key}`,
      `signed:${rows[0].original_key}`,
      `signed:${rows[0].original_key}#maya-jay-00000000.jpg`,
    ]);
    expect(two[1]).toBe(`signed:${rows[1].original_key}`);
    expect(two[2]).toBeNull();
  });

  it("★ a name and two flags, never an address", async () => {
    const links = await toGuestAlbumLinks(rows, {
      eventName: "E",
      presign,
      identities,
    });
    expect(links[0][4]).toEqual(["Maya", WHO_VERIFIED]);
    expect(links[1][4]).toEqual(["Tom", 0]);
    expect(JSON.stringify(links)).not.toContain("maya@example.com");
  });

  it("the demo (no identities) and an unattributed row name nobody", async () => {
    const demo = await toGuestAlbumLinks(rows, {
      eventName: "E",
      presign,
      identities: null,
    });
    expect(demo.map((l) => l[4])).toEqual([null, null]);
    const partial = await toGuestAlbumLinks(rows, {
      eventName: "E",
      presign,
      identities: new Map(),
    });
    expect(partial[0][4]).toBeNull();
  });
});

describe("the host's links", () => {
  it("carry the proved address, and only the proved one", async () => {
    const links = await toHostAlbumLinks(rows, {
      eventName: "E",
      presign,
      identities,
    });
    expect(links[0][4]).toEqual(["Maya", WHO_VERIFIED, "maya@example.com"]);
    expect(links[1][4]).toEqual(["Tom", 0, null]);
  });

  it("mark the host's own uploads", async () => {
    const host = new Map<string, UploaderIdentity>([
      [
        id(1),
        { displayName: "Will", email: null, isHost: true, isVerified: true },
      ],
    ]);
    const links = await toHostAlbumLinks([rows[0]], {
      eventName: "E",
      presign,
      identities: host,
    });
    expect(links[0][4]).toEqual(["Will", WHO_HOST | WHO_VERIFIED, null]);
  });
});

/**
 * ★ THE CREDIT'S FACE RIDES THE WHO TUPLE (crumbs-38): `[name, flags, face]` for a guest and `[name, flags, email,
 * face]` for the host, the face the three fields the server resolved (`uploader-faces.ts`), and only where there is
 * one: a faceless credit is the tuple it always was, so a client from before reads it unchanged. The rule's owner
 * (an account id) never rides, whatever the identity holds.
 */
describe("the credit's face on the links", () => {
  const face = {
    avatarUrl: "https://cdn.test/avatars/a/avatar.webp?v=1",
    seed: "f".repeat(64),
    href: "/u/maya",
  };
  const faced = new Map<string, UploaderIdentity>([
    [
      id(1),
      {
        displayName: "Maya",
        email: "maya@example.com",
        isHost: false,
        isVerified: true,
        faceOwner: { kind: "account", accountId: "acct-maya", guestId: "g-1" },
        face,
      },
    ],
    [
      id(2),
      { displayName: "Tom", email: null, isHost: false, isVerified: false },
    ],
  ]);

  it("the guest's tuple carries the face after the flags, and never the owner or an address", async () => {
    const links = await toGuestAlbumLinks(rows, {
      eventName: "E",
      presign,
      identities: faced,
    });
    expect(links[0][4]).toEqual([
      "Maya",
      WHO_VERIFIED,
      [face.avatarUrl, face.seed, face.href],
    ]);
    // No face, no third field: the tuple a client from before this lane reads.
    expect(links[1][4]).toEqual(["Tom", 0]);
    const wire = JSON.stringify(links);
    expect(wire).not.toContain("acct-maya");
    expect(wire).not.toContain("g-1");
    expect(wire).not.toContain("maya@example.com");
  });

  it("the host's tuple carries it after the proved address", async () => {
    const links = await toHostAlbumLinks(rows, {
      eventName: "E",
      presign,
      identities: faced,
    });
    expect(links[0][4]).toEqual([
      "Maya",
      WHO_VERIFIED,
      "maya@example.com",
      [face.avatarUrl, face.seed, face.href],
    ]);
    expect(links[1][4]).toEqual(["Tom", 0, null]);
    expect(JSON.stringify(links)).not.toContain("acct-maya");
  });
});
