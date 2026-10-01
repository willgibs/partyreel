import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * HER WAITING UPLOADS ON AN EMPTY HELD ALBUM, KNOWN BEFORE THE FIRST PAINT (crumbs-43; ROADMAP, from `voice-wiring`:
 * "a returning guest whose only uploads wait on an empty held album meets the empty state's 'Add the first photo'
 * with her badge beside Invite"). The page asks `hasWaitingUploads` where it decides anything (an empty album that
 * holds uploads for the host, open to hers, never the host's own) and hands `EventExperience` the answer as
 * `waitingOnArrival`, so the album's one Add is the row's from the first frame. What is pinned is when it asks, with
 * what, and what it hands on.
 *
 * Everything else the album page reads is stood in for, as `page.own-delete.test.tsx` does: a found, open album this
 * viewer is through the door of, at full access.
 */
vi.mock("server-only", () => ({}));
const hasWaitingUploads = vi.hoisted(() => vi.fn());
vi.mock("@/lib/guest/waiting-on-arrival.server", () => ({ hasWaitingUploads }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "test" }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("next/server", () => ({ after: vi.fn() }));

const EVENT = vi.hoisted(() => ({
  id: "11111111-2222-4333-8444-555555555555",
  qr_token: "0123456789abcdef0123456789abcdef",
  name: "Maya's 30th",
  visibility: "open",
  accepting_uploads: true,
  host_display_name: "Maya",
  moderation_mode: "hold_for_approval",
}));
vi.mock("@/lib/events/closed-door.server", () => ({
  pageDoor: async () => ({
    event: EVENT,
    decision: { kind: "through", admitted: false },
  }),
}));
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));

const seen = vi.hoisted(() => ({
  props: null as Record<string, unknown> | null,
}));
vi.mock("@/components/guest/event-experience", () => ({
  EventExperience: (props: Record<string, unknown>) => {
    seen.props = props;
    return null;
  },
}));
const stub = () => null;
vi.mock("@/components/guest/door/shut-door", () => ({ ShutDoor: stub }));
vi.mock("@/components/guest/guest-header", () => ({ GuestHeader: stub }));
vi.mock("@/components/shared/claim-ask", () => ({ ClaimAsk: stub }));
vi.mock("@/components/social/guest-list", () => ({
  GuestList: stub,
  GUEST_LIST_FACES_THRESHOLD: 8,
}));
vi.mock("@/components/shared/album-window-plan", () => ({
  ALBUM_WIDTH_COOKIE: "pr_album_w",
  parseAlbumWidth: () => null,
}));
vi.mock("@/lib/analytics/bots", () => ({ isLikelyBot: () => true }));
vi.mock("@/lib/db/mutations/analytics", () => ({ recordLinkHit: vi.fn() }));
const listAccountMediaIds = vi.fn();
const listOwnerMediaIds = vi.fn();
vi.mock("@/lib/db/mutations/guest-media", () => ({
  listAccountMediaIds: (...a: unknown[]) => listAccountMediaIds(...a),
  listOwnerMediaIds: (...a: unknown[]) => listOwnerMediaIds(...a),
}));
const stats = vi.hoisted(() => ({ approvedTotal: 0, guestCount: 0 }));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getGalleryStats: async () => stats,
  getHostAvatarSeed: async () => null,
  getOpenAlbumItemForCard: stub,
}));
vi.mock("@/lib/db/queries/profile", () => ({
  getProfileMenu: async () => ({ displayName: "Maya" }),
}));
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuestList: async () => [],
  getHostCard: async () => null,
  getMyFollowing: async () => [],
  isFollowing: async () => false,
}));
vi.mock("@/lib/social/cards", () => ({
  splitGuestList: stub,
  withAvatarUrls: stub,
}));
vi.mock("@/lib/events/gallery-access", () => ({
  doorGalleryDecision: () => null,
  resolveGalleryDecision: stub,
}));
const isRequestOwner = vi.fn();
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isRequestOwner: (...a: unknown[]) => isRequestOwner(...a),
}));
vi.mock("@/lib/events/gallery-access.server", () => ({
  resolveViewerDecision: async () => ({
    access: "full",
    gate: null,
    albumFull: false,
  }),
  streamGallerySeed: () => Promise.resolve({ kind: "locked" }),
}));
vi.mock("@/lib/events/unlock-cookie", () => ({ isUnlocked: async () => true }));
vi.mock("@/lib/guest/event-card", () => ({
  EVENT_CARD_ALT: "",
  EVENT_CARD_SIZE: {},
  eventCardPath: stub,
  privateEventCardPath: stub,
}));
const TICKET = "t".repeat(64);
vi.mock("@/lib/guest/session-cookie", () => ({
  readGuestSessionCookie: async () => TICKET,
}));
vi.mock("@/lib/media/share-save", () => ({
  PHOTO_PARAM: "photo",
  readPhotoParam: stub,
}));
vi.mock("@/lib/r2/presign", () => ({ presignDownload: stub }));
vi.mock("@/lib/shared/tile-size-cookie", () => ({
  resolveRowStep: () => 1,
  TILE_SIZE_COOKIE: "pr_tile_size",
}));
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.test",
}));
let user: { id: string; email_confirmed_at: string | null } | null = null;
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ user }),
}));
vi.mock("@/lib/welcome", () => ({ needsDisplayName: () => false }));

const { default: GuestEventPage } = await import("./page");

/** What the page hands the album for her waiting uploads. */
async function handed() {
  seen.props = null;
  const page = await GuestEventPage({
    params: Promise.resolve({ token: EVENT.qr_token }),
  });
  render(<>{page}</>);
  const props = seen.props as Record<string, unknown> | null;
  return props?.waitingOnArrival;
}

beforeEach(() => {
  vi.clearAllMocks();
  user = null;
  isRequestOwner.mockResolvedValue(false);
  listAccountMediaIds.mockResolvedValue([]);
  listOwnerMediaIds.mockResolvedValue([]);
  hasWaitingUploads.mockResolvedValue(true);
  EVENT.moderation_mode = "hold_for_approval";
  EVENT.accepting_uploads = true;
  stats.approvedTotal = 0;
});

describe("her waiting uploads on an empty held album", () => {
  it("★ are asked of the server on an empty album that holds uploads, with the request's ticket, and handed on", async () => {
    expect(await handed()).toBe(true);
    expect(hasWaitingUploads).toHaveBeenCalledWith({
      eventId: EVENT.id,
      userId: null,
      ticket: TICKET,
    });
  });

  it("a signed-in guest's account rides beside the ticket", async () => {
    user = { id: "guest-1", email_confirmed_at: "2026-09-01T00:00:00Z" };
    expect(await handed()).toBe(true);
    expect(hasWaitingUploads).toHaveBeenCalledWith({
      eventId: EVENT.id,
      userId: "guest-1",
      ticket: TICKET,
    });
  });

  it("asks nothing where it decides nothing: an album with photographs, one that holds nothing, closed uploads, the host", async () => {
    stats.approvedTotal = 3;
    expect(await handed()).toBe(false);
    stats.approvedTotal = 0;
    EVENT.moderation_mode = "live";
    expect(await handed()).toBe(false);
    EVENT.moderation_mode = "hold_for_approval";
    EVENT.accepting_uploads = false;
    expect(await handed()).toBe(false);
    EVENT.accepting_uploads = true;
    user = { id: "host-1", email_confirmed_at: "2026-09-01T00:00:00Z" };
    isRequestOwner.mockResolvedValue(true);
    expect(await handed()).toBe(false);
    expect(hasWaitingUploads).not.toHaveBeenCalled();
  });
});
