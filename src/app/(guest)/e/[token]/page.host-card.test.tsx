import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE HOST CARD SAYS WHETHER SHE FOLLOWS THE HOST (crumbs-28, from `claims-wiring`). The follow moment's Follow started
 * on Follow for a guest who already follows the host, because the card the page hands the album held no follow state.
 * The page reads it beside `getHostCard`: one head count (`isFollowing`) for a signed-in guest, and none for anyone
 * signed out or for the host herself, who is never her own guest.
 *
 * Everything else the album page reads is stood in for: a found, open album this viewer is through the door of, at
 * full access. What is pinned is the card `EventExperience` is handed.
 */
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "test" }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("next/server", () => ({ after: vi.fn() }));

const EVENT = {
  id: "11111111-2222-4333-8444-555555555555",
  qr_token: "0123456789abcdef0123456789abcdef",
  name: "Maya's 30th",
  visibility: "open",
  accepting_uploads: true,
  host_display_name: "Maya",
};
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
vi.mock("@/lib/db/mutations/guest-media", () => ({
  listAccountMediaIds: async () => [],
  listOwnerMediaIds: async () => [],
}));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getGalleryStats: async () => ({ approvedTotal: 3, guestCount: 2 }),
  getHostAvatarSeed: async () => null,
  getOpenAlbumItemForCard: stub,
}));
vi.mock("@/lib/db/queries/profile", () => ({
  getProfileMenu: async () => ({ displayName: "Priya" }),
}));
const HOST_CARD = {
  id: "host-1",
  slug: "maya",
  displayName: "Maya",
  avatarUrl: null,
};
const isFollowing = vi.fn();
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuestList: async () => [],
  getHostCard: async () => HOST_CARD,
  getMyFollowing: async () => [],
  isFollowing: (...a: unknown[]) => isFollowing(...a),
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
vi.mock("@/lib/guest/session-cookie", () => ({
  readGuestSessionCookie: async () => null,
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

async function hostCardHanded() {
  seen.props = null;
  const page = await GuestEventPage({
    params: Promise.resolve({ token: EVENT.qr_token }),
  });
  render(<>{page}</>);
  // Set by the render above, which the compiler cannot see through the reset.
  const props = seen.props as Record<string, unknown> | null;
  return props?.hostCard as (typeof HOST_CARD & { following?: boolean }) | null;
}

beforeEach(() => {
  vi.clearAllMocks();
  user = { id: "guest-1", email_confirmed_at: "2026-09-01T00:00:00Z" };
  isRequestOwner.mockResolvedValue(false);
  isFollowing.mockResolvedValue(false);
});

describe("the host card the album is handed", () => {
  it("★ says a signed-in guest who follows the host already does, read beside the card", async () => {
    isFollowing.mockResolvedValue(true);
    const card = await hostCardHanded();
    expect(card).toMatchObject({ id: "host-1", following: true });
    expect(isFollowing).toHaveBeenCalledWith("host-1");
  });

  it("says one who does not, does not", async () => {
    expect(await hostCardHanded()).toMatchObject({ following: false });
  });

  it("asks nothing for a guest signed out, who follows nobody", async () => {
    user = null;
    expect(await hostCardHanded()).toMatchObject({ following: false });
    expect(isFollowing).not.toHaveBeenCalled();
  });

  it("asks nothing for the host herself, never her own guest", async () => {
    isRequestOwner.mockResolvedValue(true);
    expect(await hostCardHanded()).toMatchObject({ following: false });
    expect(isFollowing).not.toHaveBeenCalled();
  });
});
