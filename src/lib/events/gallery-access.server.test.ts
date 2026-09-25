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
 * (the exact, live count), and `galleryEtagFor` hashes it, so the header's number is live even
 * where the loaded items are the nine-photo teaser.
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
vi.mock("@/lib/r2/grid-items", () => ({ toGridItems: vi.fn() }));
vi.mock("@/lib/r2/presign-bucket", () => ({ presignBucketId: () => "b1" }));
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));

const getUploadGate = vi.fn();
vi.mock("@/lib/db/queries/guest-gate", () => ({
  getUploadGate: (...args: unknown[]) => getUploadGate(...args),
}));

const {
  galleryEtagFor,
  loadGalleryReel,
  loadGalleryRowsForAccess,
  resolveViewerDecision,
} = await import("@/lib/events/gallery-access.server");

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

  it("the ETag moves with the count alone, the rows held still", async () => {
    const decision = { access: "teaser" as const, gate: "account" as const };
    const gallery = await loadGalleryRowsForAccess(EVENT, "teaser");
    const before = galleryEtagFor(decision, gallery);
    expect(
      galleryEtagFor(decision, { ...gallery, approvedTotal: 1146 }),
    ).not.toBe(before);
    expect(galleryEtagFor(decision, { ...gallery })).toBe(before);
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
      { ...EVENT, show_reel: false, reel_style_id: "warm" } as Event,
      "full",
    );
    expect(reel).toEqual({
      showReel: false,
      liveReelEnabled: true,
      styleId: "warm",
      clip: { videoAllowed: false, watermark: true, maxSeconds: 30 },
    });
    expect(getLiveReelServerFacts).toHaveBeenCalledWith("event-1");
  });
});
