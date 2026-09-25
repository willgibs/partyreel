/**
 * THE ALBUM'S FULLNESS, AS THE PAGE READS IT; AND THE ALBUM'S SIZE, AS EVERY PAYLOAD CARRIES IT.
 *
 * `resolveViewerDecision` answers the page, the poll, the export and the reel download. The page
 * alone also needs to know whether the album can take another upload: on a Require-an-upload-to-
 * view album the gate FAILS OPEN when it is full, so a guest's own last removal closes nothing and
 * the lightbox must not say it does. The gate reads the caps only for a viewer who has not
 * contributed, so for a contributor the page asks by name (`withAlbumFull`) and pays one
 * identity-less read; nobody else pays anything.
 *
 * `loadGalleryRowsForAccess` carries the album's head count beside the rows at `teaser` and `full`
 * (the exact, live count), for "Download all", its one reader now.
 *
 * `loadGallerySeed` is the page's album seed (album-guest-wiring): at full, the manifest planned by
 * the sync route's own function, its validator, and links for exactly the first paint's photographs;
 * at the teaser, the nine inline; locked, nothing.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const getEventMediaByQrToken = vi.fn();
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventMediaByQrToken: (...args: unknown[]) =>
    getEventMediaByQrToken(...args),
}));
const countApprovedMedia = vi.fn();
const getApprovedMediaForUnlock = vi.fn();
const getApprovedPhotoTeaser = vi.fn();
const getLiveReelServerFacts = vi.fn();
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  countApprovedMedia: (...args: unknown[]) => countApprovedMedia(...args),
  getLiveReelServerFacts: (...args: unknown[]) =>
    getLiveReelServerFacts(...args),
  getApprovedMediaForUnlock: (...args: unknown[]) =>
    getApprovedMediaForUnlock(...args),
  getApprovedPhotoTeaser: (...args: unknown[]) =>
    getApprovedPhotoTeaser(...args),
  getUploaderIdentities: vi.fn().mockResolvedValue(new Map()),
}));
const toGridItems = vi.fn();
vi.mock("@/lib/r2/grid-items", () => ({
  toGridItems: (...args: unknown[]) => toGridItems(...args),
}));
vi.mock("@/lib/r2/presign-bucket", () => ({ presignBucketId: () => "7" }));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({
    key,
    downloadFilename,
  }: {
    key: string;
    downloadFilename?: string;
  }) => `https://r2.test/${key}${downloadFilename ? "?dl=1" : ""}`,
}));
const readGuestAlbum = vi.fn();
const readGuestManifestPage = vi.fn();
const readGuestAlbumMedia = vi.fn();
const readGuestAlbumVersions = vi.fn();
const readGuestAttribution = vi.fn();
vi.mock("@/lib/db/queries/album-guest", () => ({
  readGuestAlbum: (...args: unknown[]) => readGuestAlbum(...args),
  readGuestManifestPage: (...args: unknown[]) => readGuestManifestPage(...args),
  readGuestAlbumMedia: (...args: unknown[]) => readGuestAlbumMedia(...args),
  readGuestAlbumVersions: (...args: unknown[]) =>
    readGuestAlbumVersions(...args),
  readGuestAttribution: (...args: unknown[]) => readGuestAttribution(...args),
}));
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));

const getUploadGate = vi.fn();
vi.mock("@/lib/db/queries/guest-gate", () => ({
  getUploadGate: (...args: unknown[]) => getUploadGate(...args),
}));

const {
  loadGalleryReel,
  loadGalleryRowsForAccess,
  loadGallerySeed,
  resolveViewerDecision,
} = await import("@/lib/events/gallery-access.server");
const { guestAlbumEtag } = await import("@/lib/events/album-validator");
const { firstPaintIds } = await import("@/components/shared/album-window-plan");

type Event = Parameters<typeof resolveViewerDecision>[0];

const EVENT = {
  id: "event-1",
  qr_token: "q".repeat(32),
  name: "Party",
  description: null,
  moderation_mode: "live",
  visibility: "open",
  has_password: false,
  accepting_uploads: true,
  require_verified_email: false,
  require_upload_to_view: true,
  event_date: null,
  qr_style: "classic",
  host_display_name: null,
  show_reel: true,
  reel_style_id: null,
  reel_hold_sec: null,
} as unknown as Event;

const GUEST = {
  isOwner: false,
  isAuthed: false,
  isUnlocked: true,
  userId: null,
  sessionToken: "t".repeat(64),
};

beforeEach(() => {
  getUploadGate.mockReset();
});

describe("resolveViewerDecision: albumFull", () => {
  it("reads nothing, and says not full, where no upload gate applies", async () => {
    const decision = await resolveViewerDecision(
      { ...EVENT, require_upload_to_view: false } as Event,
      GUEST,
      { withAlbumFull: true },
    );
    expect(decision).toEqual({ access: "full", gate: null, albumFull: false });
    expect(getUploadGate).not.toHaveBeenCalled();
  });

  it("an uncontributed guest at a full album: the gate fails open, and says so", async () => {
    getUploadGate.mockResolvedValue({
      contributed: false,
      albumFull: true,
      eventGone: false,
    });
    const decision = await resolveViewerDecision(EVENT, GUEST, {
      withAlbumFull: true,
    });
    expect(decision).toEqual({ access: "full", gate: null, albumFull: true });
    // The one read already carried the caps: no second one.
    expect(getUploadGate).toHaveBeenCalledTimes(1);
  });

  it("a contributor, asked by the page, costs ONE identity-less read that is the album's fullness", async () => {
    getUploadGate
      .mockResolvedValueOnce({
        contributed: true,
        albumFull: false,
        eventGone: false,
      })
      .mockResolvedValueOnce({
        contributed: false,
        albumFull: true,
        eventGone: false,
      });
    const decision = await resolveViewerDecision(EVENT, GUEST, {
      withAlbumFull: true,
    });
    expect(decision).toEqual({ access: "full", gate: null, albumFull: true });
    expect(getUploadGate).toHaveBeenLastCalledWith({
      eventId: "event-1",
      sessionToken: null,
      userId: null,
    });
  });

  it("a contributor on the poll (not asked) costs nothing new", async () => {
    getUploadGate.mockResolvedValue({
      contributed: true,
      albumFull: false,
      eventGone: false,
    });
    const decision = await resolveViewerDecision(EVENT, GUEST);
    expect(decision).toEqual({ access: "full", gate: null, albumFull: false });
    expect(getUploadGate).toHaveBeenCalledTimes(1);
  });

  it("an uncontributed guest with room still meets the upload door", async () => {
    getUploadGate.mockResolvedValue({
      contributed: false,
      albumFull: false,
      eventGone: false,
    });
    const decision = await resolveViewerDecision(EVENT, GUEST, {
      withAlbumFull: true,
    });
    expect(decision).toEqual({
      access: "teaser",
      gate: "upload",
      albumFull: false,
    });
  });
});

const row = (id: string) => ({
  id,
  type: "photo" as const,
  original_key: `k/${id}`,
  preview_key: null,
  width: null,
  height: null,
  duration_seconds: null,
  created_at: "2026-09-23T23:13:38.122749+00:00",
});

describe("loadGalleryRowsForAccess: the album's size rides beside the rows", () => {
  beforeEach(() => {
    countApprovedMedia.mockReset().mockResolvedValue(1145);
    getEventMediaByQrToken.mockReset().mockResolvedValue([row("a"), row("b")]);
    getApprovedMediaForUnlock.mockReset().mockResolvedValue([row("c")]);
    getApprovedPhotoTeaser
      .mockReset()
      .mockResolvedValue({ rows: [row("a")], total: 1100 });
  });

  it("at full: the whole album and the head count, never the list's length", async () => {
    const gallery = await loadGalleryRowsForAccess(EVENT, "full");
    expect(gallery.rows.map((r) => r.id)).toEqual(["a", "b"]);
    expect(gallery.approvedTotal).toBe(1145);
    expect(countApprovedMedia).toHaveBeenCalledWith(EVENT);
  });

  it("at teaser: the nine, the photo-only teaser total, and the album's true size", async () => {
    const gallery = await loadGalleryRowsForAccess(EVENT, "teaser");
    expect(gallery).toMatchObject({ teaserTotal: 1100, approvedTotal: 1145 });
  });

  it("an unlocked password album reads the admin arm and still carries the count", async () => {
    const gallery = await loadGalleryRowsForAccess(
      { ...EVENT, visibility: "password" } as Event,
      "full",
    );
    expect(gallery.rows.map((r) => r.id)).toEqual(["c"]);
    expect(gallery.approvedTotal).toBe(1145);
    expect(getEventMediaByQrToken).not.toHaveBeenCalled();
  });

  it("at none: nothing read, nothing counted", async () => {
    const gallery = await loadGalleryRowsForAccess(EVENT, "none");
    expect(gallery).toEqual({
      rows: [],
      identities: undefined,
      teaserTotal: null,
      approvedTotal: null,
    });
    expect(countApprovedMedia).not.toHaveBeenCalled();
  });
});

describe("loadGallerySeed: the page's album seed", () => {
  const T0 = 1_790_000_000_000_000;
  const uuid = (i: number) =>
    `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
  /** A 100-photograph album, newest first, 4:3, one video without a preview at the 3rd place. */
  const ENTRIES = Array.from({ length: 100 }, (_, i) =>
    i === 2
      ? ([uuid(i), 640, 480, 1 | 4, T0 - i] as const)
      : ([uuid(i), 640, 480, 4, T0 - i] as const),
  );
  const FIRST = { step: 1 as const, rhythm: "double" as const, seed: 42 };

  beforeEach(() => {
    getLiveReelServerFacts.mockReset().mockResolvedValue({
      liveReelEnabled: true,
      tier: "pro",
    });
    readGuestAlbum.mockReset().mockResolvedValue({
      version: 9,
      albumMax: 7,
      attrVersion: 3,
      approved: 100,
      hidden: null,
      pending: null,
      changes: [],
    });
    readGuestManifestPage
      .mockReset()
      .mockResolvedValue({ entries: ENTRIES, next: null });
    readGuestAlbumMedia.mockReset().mockImplementation(async (_e, ids) => ({
      // One asked id is no longer in the album (hidden since): it comes back missing.
      rows: (ids as string[])
        .filter((id) => id !== uuid(1))
        .map((id) => ({
          id,
          type: "photo",
          original_key: `e/${id}/original.jpg`,
          preview_key: null,
        })),
      identities: new Map([
        [
          uuid(0),
          {
            displayName: "Maya",
            isHost: false,
            isVerified: true,
            email: "never@leaks.test",
          },
        ],
      ]),
    }));
  });

  it("at full: the manifest planned as the sync route plans it, with the route's own validator", async () => {
    const seed = await loadGallerySeed(
      EVENT,
      { access: "full", gate: null },
      { ...FIRST, width: null },
    );
    if (seed.kind !== "full") throw new Error("expected a full seed");
    expect(seed.sync).toMatchObject({
      kind: "manifest",
      access: "full",
      v: 7, // the guest scope's version is album_max
      attr: 3,
      total: 100,
      next: null,
    });
    expect(seed.sync.entries).toHaveLength(100);
    // The version and the counts were read BEFORE the first page (album-sync.ts, rule one).
    expect(readGuestAlbum).toHaveBeenCalledWith(EVENT, 0, 0);
    expect(seed.etag).toBe(
      guestAlbumEtag({
        eventId: EVENT.id,
        access: "full",
        gate: null,
        albumMax: 7,
        attrVersion: 3,
        reel: seed.sync.reel,
      }),
    );
  });

  it("mints links for exactly the first paint's photographs, and reports the ones gone", async () => {
    const seed = await loadGallerySeed(
      EVENT,
      { access: "full", gate: null },
      { ...FIRST, width: 1400 },
    );
    if (seed.kind !== "full") throw new Error("expected a full seed");
    const expected = firstPaintIds(
      ENTRIES.map(([id, width, height]) => ({ id, width, height })),
      { ...FIRST, width: 1400 },
    );
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(100);
    const asked = readGuestAlbumMedia.mock.calls[0][1] as string[];
    expect(asked).toEqual(expected);
    expect(seed.links.links.map((l) => l[0])).toEqual(
      expected.filter((id) => id !== uuid(1)),
    );
    expect(seed.links.missing).toEqual([uuid(1)]);
    expect(seed.links.b).toBe(7);
  });

  it("a guest's attribution is a name and two flags, never an address", async () => {
    const seed = await loadGallerySeed(
      EVENT,
      { access: "full", gate: null },
      { ...FIRST, width: null },
    );
    if (seed.kind !== "full") throw new Error("expected a full seed");
    const maya = seed.links.links.find((l) => l[0] === uuid(0))!;
    expect(maya[4]).toEqual(["Maya", 2]);
    expect(JSON.stringify(seed)).not.toContain("never@leaks.test");
  });

  it("at the teaser: the nine inline, the true size, and a validator that rolls with the bucket", async () => {
    readGuestAlbumVersions
      .mockReset()
      .mockResolvedValue({ version: 9, albumMax: 7, attrVersion: 3 });
    countApprovedMedia.mockReset().mockResolvedValue(1145);
    getApprovedPhotoTeaser
      .mockReset()
      .mockResolvedValue({ rows: [row("a")], total: 1100 });
    readGuestAttribution.mockReset().mockResolvedValue(new Map());
    toGridItems.mockReset().mockResolvedValue([{ id: "a" }]);
    const seed = await loadGallerySeed(
      EVENT,
      { access: "teaser", gate: "account" },
      { ...FIRST, width: null },
    );
    expect(seed).toMatchObject({
      kind: "teaser",
      sync: {
        kind: "teaser",
        gate: "account",
        items: [{ id: "a" }],
        teaserTotal: 1100,
        approvedTotal: 1145,
      },
      etag: guestAlbumEtag({
        eventId: EVENT.id,
        access: "teaser",
        gate: "account",
        albumMax: 7,
        attrVersion: 3,
        reel: null,
        bucketId: "7",
      }),
    });
    expect(readGuestManifestPage).not.toHaveBeenCalled();
  });

  it("locked: nothing read at all", async () => {
    const seed = await loadGallerySeed(
      EVENT,
      { access: "none", gate: "password" },
      { ...FIRST, width: null },
    );
    expect(seed).toEqual({ kind: "locked" });
    expect(readGuestAlbum).not.toHaveBeenCalled();
    expect(readGuestAlbumMedia).not.toHaveBeenCalled();
  });
});

describe("loadGalleryReel: the live reel's facts for one viewer", () => {
  beforeEach(() => {
    getLiveReelServerFacts.mockReset();
    getLiveReelServerFacts.mockResolvedValue({
      liveReelEnabled: true,
      tier: "free",
    });
  });

  it("reads nothing and says nothing below full access", async () => {
    expect(await loadGalleryReel(EVENT, "teaser")).toBeNull();
    expect(await loadGalleryReel(EVENT, "none")).toBeNull();
    expect(getLiveReelServerFacts).not.toHaveBeenCalled();
  });

  it("joins the event's own switch and mood to the lever and the plan", async () => {
    const reel = await loadGalleryReel(
      {
        ...EVENT,
        show_reel: false,
        reel_style_id: "warm",
        reel_hold_sec: 5,
      } as Event,
      "full",
    );
    expect(reel).toEqual({
      showReel: false,
      liveReelEnabled: true,
      styleId: "warm",
      holdSec: 5,
      clip: { videoAllowed: false, watermark: true, maxSeconds: 30 },
    });
    expect(getLiveReelServerFacts).toHaveBeenCalledWith("event-1");
  });
});
