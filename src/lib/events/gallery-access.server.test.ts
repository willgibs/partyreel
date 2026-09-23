/**
 * THE ALBUM'S FULLNESS, AS THE PAGE READS IT.
 *
 * `resolveViewerDecision` answers the page, the poll, the export and the reel download. The page
 * alone also needs to know whether the album can take another upload: on a Require-an-upload-to-
 * view album the gate FAILS OPEN when it is full, so a guest's own last removal closes nothing and
 * the lightbox must not say it does. The gate reads the caps only for a viewer who has not
 * contributed, so for a contributor the page asks by name (`withAlbumFull`) and pays one
 * identity-less read; nobody else pays anything.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventMediaByQrToken: vi.fn(),
}));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getApprovedMediaForUnlock: vi.fn(),
  getApprovedPhotoTeaser: vi.fn(),
  getUploaderIdentities: vi.fn(),
}));
vi.mock("@/lib/r2/grid-items", () => ({ toGridItems: vi.fn() }));
vi.mock("@/lib/r2/presign-bucket", () => ({ presignBucketId: () => "b1" }));
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));

const getUploadGate = vi.fn();
vi.mock("@/lib/db/queries/guest-gate", () => ({
  getUploadGate: (...args: unknown[]) => getUploadGate(...args),
}));

const { resolveViewerDecision } =
  await import("@/lib/events/gallery-access.server");

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
