/**
 * THE ALBUM'S FULLNESS, AS THE PAGE READS IT; AND THE ALBUM'S SIZE, AS EVERY PAYLOAD CARRIES IT.
 *
 * `resolveViewerDecision` answers the page, the album's routes and the export. The page
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
 * at the teaser, the nine inline; locked, nothing. A plan the reads' gate refuses is locked too,
 * never a throw, and `streamGallerySeed` (what the page hands the client) can never be an unhandled
 * rejection: build 10's crash of the host's own password album was both at once.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { planAlbumSync } from "@/lib/events/album-sync";

vi.mock("server-only", () => ({}));
const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
}));
// The owner idea's home (re-exported here) reads the request's own client: not this file's subject.
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isEventOwner: vi.fn(),
  isRequestOwner: vi.fn(),
}));
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
// The plan's two reads behind the gate (the snapshot, then a manifest's first page), planned by the
// REAL `planAlbumSync`, so the seed is proved to plan exactly as the sync route plans.
const planRead = vi.fn();
const planPage = vi.fn();
const planGuestAlbumSync = vi.fn();
const readGuestAlbumMedia = vi.fn();
const readGuestAlbumVersions = vi.fn();
const readGuestAttribution = vi.fn();
vi.mock("@/lib/db/queries/album-guest", () => ({
  planGuestAlbumSync: (...args: unknown[]) => planGuestAlbumSync(...args),
  readGuestAlbumMedia: (...args: unknown[]) => readGuestAlbumMedia(...args),
  readGuestAlbumVersions: (...args: unknown[]) =>
    readGuestAlbumVersions(...args),
  readGuestAttribution: (...args: unknown[]) => readGuestAttribution(...args),
}));
/** What waits, as the plan's snapshot answers it (20261002200000): nothing, unless a test says. */
let waiting: { count: number; minutes: [number, number][] } = {
  count: 0,
  minutes: [],
};
function planThroughTheGate() {
  planGuestAlbumSync
    .mockReset()
    .mockImplementation(async (_event: unknown, since: number | null) => ({
      ...(await planAlbumSync({
        scope: "album",
        since,
        read: planRead,
        page: planPage,
      })),
      waiting,
    }));
}
// THE DEVELOP (20261002200000): the page's seed develops an album due one before its first read.
const developIfDue = vi.fn();
vi.mock("@/lib/disposable/develop.server", () => ({
  developIfDue: (...args: unknown[]) => developIfDue(...args),
}));
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));

const getUploadGate = vi.fn();
vi.mock("@/lib/db/queries/guest-gate", () => ({
  getUploadGate: (...args: unknown[]) => getUploadGate(...args),
}));
// Whose a ticket is to a signed-in viewer is `session-owner.server.ts`'s (its own pins); here the answer is
// handed in: by default the ticket is hers, and a test sets it aside.
const sortTickets = vi.fn();
vi.mock("@/lib/guest/session-owner.server", () => ({
  sortTickets: (...args: unknown[]) => sortTickets(...args),
}));

const {
  loadGalleryReel,
  loadGalleryRowsForAccess,
  loadGallerySeed,
  resolveViewerDecision,
  streamGallerySeed,
} = await import("@/lib/events/gallery-access.server");
const { guestAlbumEtag } = await import("@/lib/events/album-validator");
const { firstPaintIds } = await import("@/components/shared/album-window-plan");
const { createReelItems } = await import("@/lib/guest/reconcile-album-items");
const { tileStills } = await import("@/lib/guest/reel-tile");

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
  sortTickets
    .mockReset()
    .mockImplementation(
      async (_viewer: string | null, tickets: readonly string[]) => ({
        hers: [...tickets],
        others: [],
      }),
    );
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

/**
 * A PHOTO FIRST READS THE VIEWER'S OWN TICKET (crumbs-27, the read side of crumbs-26's owner rule). The gate ORs
 * the account and the ticket (`get_upload_gate`), so on a shared phone another guest's contribution, kept on the
 * ticket the phone still held for the album, counted as a contribution of the signed-in account's: she was let
 * past the upload step having added nothing. The ticket is read only as far as it is hers (her own row, or one
 * the claim takes), and the account speaks for herself.
 */
describe("resolveViewerDecision: a signed-in account is held to the upload step by her own contribution alone", () => {
  const SIGNED_IN = { ...GUEST, userId: "user-1" };

  it("★ a ticket that is not hers contributes nothing: the gate is asked with her account alone", async () => {
    sortTickets.mockResolvedValue({ hers: [], others: [GUEST.sessionToken] });
    getUploadGate.mockResolvedValue({
      contributed: false,
      albumFull: false,
      eventGone: false,
    });
    const decision = await resolveViewerDecision(EVENT, SIGNED_IN);
    expect(sortTickets).toHaveBeenCalledWith("user-1", [GUEST.sessionToken]);
    expect(getUploadGate).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: null,
      userId: "user-1",
    });
    // Nothing of hers is in the album, so she meets the upload step, whatever the other guest added.
    expect(decision).toEqual({
      access: "teaser",
      gate: "upload",
      albumFull: false,
    });
  });

  it("a ticket that is hers is read beside her account, as ever", async () => {
    getUploadGate.mockResolvedValue({
      contributed: true,
      albumFull: false,
      eventGone: false,
    });
    await resolveViewerDecision(EVENT, SIGNED_IN);
    expect(getUploadGate).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: GUEST.sessionToken,
      userId: "user-1",
    });
  });

  it("signed out the ticket is the device's, and nobody is asked whose it is", async () => {
    getUploadGate.mockResolvedValue({
      contributed: true,
      albumFull: false,
      eventGone: false,
    });
    await resolveViewerDecision(EVENT, GUEST);
    expect(sortTickets).toHaveBeenCalledWith(null, [GUEST.sessionToken]);
    expect(getUploadGate).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: GUEST.sessionToken,
      userId: null,
    });
  });

  it("no ticket is no question, and a locked album never reaches the gate", async () => {
    getUploadGate.mockResolvedValue({
      contributed: false,
      albumFull: false,
      eventGone: false,
    });
    await resolveViewerDecision(EVENT, { ...SIGNED_IN, sessionToken: null });
    expect(sortTickets).not.toHaveBeenCalled();
    expect(getUploadGate).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: null,
      userId: "user-1",
    });
    // A locked password album never reaches the gate, so it sorts nothing either.
    await resolveViewerDecision(
      { ...EVENT, visibility: "password", has_password: true } as Event,
      { ...SIGNED_IN, isUnlocked: false },
    );
    expect(sortTickets).not.toHaveBeenCalled();
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
    captureWarning.mockReset();
    getLiveReelServerFacts.mockReset().mockResolvedValue({
      liveReelEnabled: true,
      tier: "pro",
    });
    planThroughTheGate();
    planRead.mockReset().mockResolvedValue({
      version: 9,
      albumMax: 7,
      attrVersion: 3,
      approved: 100,
      hidden: null,
      pending: null,
      changes: [],
    });
    planPage.mockReset().mockResolvedValue({ entries: ENTRIES, next: null });
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
    // Planned through the reads' own gate, with no version: a first load.
    expect(planGuestAlbumSync).toHaveBeenCalledWith(EVENT, null);
    // The version and the counts were read BEFORE the first page (album-sync.ts, rule one).
    expect(planRead).toHaveBeenCalledWith(0, 0);
    expect(planRead.mock.invocationCallOrder[0]).toBeLessThan(
      planPage.mock.invocationCallOrder[0],
    );
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
    // Nothing waits and no develop time is set: the seed says nothing of either.
    expect(seed.sync).not.toHaveProperty("waiting");
  });

  it("★ at full: an album due a develop develops first, and what waits rides the seed as it rides each sync", async () => {
    waiting = { count: 2, minutes: [[1_790_000_000_000, 2]] };
    const due = {
      ...EVENT,
      develop_due: true,
      develops_at: "2026-10-03T09:00:00.000Z",
    };
    const seed = await loadGallerySeed(
      due as typeof EVENT,
      { access: "full", gate: null },
      { ...FIRST, width: null },
    );
    waiting = { count: 0, minutes: [] };
    if (seed.kind !== "full") throw new Error("expected a full seed");
    expect(developIfDue).toHaveBeenCalledWith(due);
    expect(developIfDue.mock.invocationCallOrder[0]).toBeLessThan(
      planGuestAlbumSync.mock.invocationCallOrder[0],
    );
    expect(seed.sync.waiting).toEqual({
      count: 2,
      minutes: [[1_790_000_000_000, 2]],
      developsAt: "2026-10-03T09:00:00.000Z",
    });
    expect(seed.etag).toBe(
      guestAlbumEtag({
        eventId: EVENT.id,
        access: "full",
        gate: null,
        albumMax: 7,
        attrVersion: 3,
        reel: seed.sync.reel,
        developsAt: "2026-10-03T09:00:00.000Z",
      }),
    );
  });

  it("★ a closed album's seed carries the validator the sync route answers it with (guest-requests), so its first poll is a 304", async () => {
    const closed = { ...EVENT, accepting_uploads: false };
    const seed = await loadGallerySeed(
      closed as typeof EVENT,
      { access: "full", gate: null },
      { ...FIRST, width: null },
    );
    if (seed.kind !== "full") throw new Error("expected a full seed");
    const shape = {
      eventId: EVENT.id,
      access: "full" as const,
      gate: null,
      albumMax: 7,
      attrVersion: 3,
      reel: seed.sync.reel,
    };
    expect(seed.etag).toBe(guestAlbumEtag({ ...shape, accepting: false }));
    expect(seed.etag).not.toBe(guestAlbumEtag(shape));
  });

  it("mints links for exactly the first paint's photographs (the reel off), and reports the ones gone", async () => {
    getLiveReelServerFacts.mockResolvedValue({
      liveReelEnabled: false,
      tier: "pro",
    });
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

  it("★ an album that opens in order links its first rows, the oldest, never the newest (album-order)", async () => {
    getLiveReelServerFacts.mockResolvedValue({
      liveReelEnabled: false,
      tier: "pro",
    });
    await loadGallerySeed(
      EVENT,
      { access: "full", gate: null },
      { ...FIRST, width: 1400, sort: "oldest" },
    );
    const asked = readGuestAlbumMedia.mock.calls[0][1] as string[];
    expect(asked[0]).toBe(uuid(99));
    expect(asked).not.toContain(uuid(0));
  });

  it("with a reel, the Highlight reel tile's stills ride the seed too, after the first paint's", async () => {
    const seed = await loadGallerySeed(
      EVENT,
      { access: "full", gate: null },
      { ...FIRST, width: 1400 },
    );
    if (seed.kind !== "full") throw new Error("expected a full seed");
    const paint = firstPaintIds(
      ENTRIES.map(([id, width, height]) => ({ id, width, height })),
      { ...FIRST, width: 1400 },
    );
    const stills = tileStills(createReelItems()(ENTRIES), {
      eventId: EVENT.id,
    }).map((s) => s.id);
    const asked = readGuestAlbumMedia.mock.calls[0][1] as string[];
    expect(asked.slice(0, paint.length)).toEqual(paint);
    expect(new Set(asked)).toEqual(new Set([...paint, ...stills]));
    // The one playable-but-posterless video is never a still.
    expect(stills).not.toContain(uuid(2));
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
    expect(planGuestAlbumSync).not.toHaveBeenCalled();
  });

  it("locked: nothing read at all", async () => {
    const seed = await loadGallerySeed(
      EVENT,
      { access: "none", gate: "password" },
      { ...FIRST, width: null },
    );
    expect(seed).toEqual({ kind: "locked" });
    expect(planGuestAlbumSync).not.toHaveBeenCalled();
    expect(readGuestAlbumMedia).not.toHaveBeenCalled();
  });

  it("★ a plan the reads' gate refuses is LOCKED, never a throw, and the disagreement is reported", async () => {
    planGuestAlbumSync.mockResolvedValue(null);
    const seed = await loadGallerySeed(
      { ...EVENT, visibility: "password" } as Event,
      { access: "full", gate: null },
      { ...FIRST, width: null },
    );
    expect(seed).toEqual({ kind: "locked" });
    expect(readGuestAlbumMedia).not.toHaveBeenCalled();
    expect(captureWarning).toHaveBeenCalledWith(
      "security",
      "album: the reads refused a viewer the decision let in",
      { eventId: EVENT.id, surface: "seed" },
    );
  });

  it("a FAILED plan rejects the seed, and the reel's read racing it is never left unheld", async () => {
    planGuestAlbumSync.mockRejectedValue(new Error("album: changes since"));
    // The reel's facts fail AFTER the plan has: were they read apart from it, nobody would be
    // holding them when they did (Vitest fails the run on an unhandled rejection).
    getLiveReelServerFacts.mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("reel facts")), 5),
        ),
    );
    await expect(
      loadGallerySeed(
        EVENT,
        { access: "full", gate: null },
        { ...FIRST, width: null },
      ),
    ).rejects.toThrow("album: changes since");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(captureWarning).not.toHaveBeenCalled();
  });
});

const FIRST_COLD = {
  step: 1 as const,
  rhythm: "double" as const,
  seed: 42,
  width: null,
};

describe("streamGallerySeed: the seed as the page hands it over, un-awaited", () => {
  beforeEach(() => {
    planThroughTheGate();
    getLiveReelServerFacts.mockReset().mockResolvedValue({
      liveReelEnabled: false,
      tier: "pro",
    });
  });

  it("★ a seed that fails before anyone reads it is never an unhandled rejection, and still fails where it is read", async () => {
    planRead.mockReset().mockRejectedValue(new Error("album: changes since"));
    const seed = streamGallerySeed(
      EVENT,
      { access: "full", gate: null },
      FIRST_COLD,
    );
    // The page's own awaited reads run here, long enough for the seed to fail with nobody reading
    // it yet: without the handler, Node reports an unhandled rejection (on Vercel, exit 128).
    await new Promise((resolve) => setTimeout(resolve, 10));
    await expect(seed).rejects.toThrow("album: changes since");
  });

  it("a good seed streams unchanged", async () => {
    planRead.mockReset().mockResolvedValue({
      version: 1,
      albumMax: 1,
      attrVersion: 0,
      approved: 0,
      hidden: null,
      pending: null,
      changes: [],
    });
    planPage.mockReset().mockResolvedValue({ entries: [], next: null });
    const seed = await streamGallerySeed(
      EVENT,
      { access: "full", gate: null },
      FIRST_COLD,
    );
    expect(seed).toMatchObject({ kind: "full", sync: { total: 0 } });
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
      // 60 since the free/pro shift (it was 30): a free clip keeps the mark, not a shorter length.
      clip: { videoAllowed: false, watermark: true, maxSeconds: 60 },
    });
    expect(getLiveReelServerFacts).toHaveBeenCalledWith("event-1");
  });
});
