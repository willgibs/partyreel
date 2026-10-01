import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE OWNER'S OWN PHOTOGRAPHS ON HER OWN GUEST PAGE ARE HERS TO DELETE (crumbs-32, from `crumbs-31`). Her Add there
 * rides the host's pair, so her uploads have no guest row, and the page read "mine" from guest rows alone: after a
 * reload she had no Delete on her own uploads at all, where the hub offers it. The page now asks the owner's own read
 * for her (`listOwnerMediaIds`: the rows with no guest, through her own RLS-scoped client), and a guest's read for
 * everyone else. What is pinned is the list `EventExperience` is handed.
 *
 * Everything else the album page reads is stood in for, as `page.host-card.test.tsx` does: a found, open album this
 * viewer is through the door of, at full access.
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
const listAccountMediaIds = vi.fn();
const listOwnerMediaIds = vi.fn();
vi.mock("@/lib/db/mutations/guest-media", () => ({
  listAccountMediaIds: (...a: unknown[]) => listAccountMediaIds(...a),
  listOwnerMediaIds: (...a: unknown[]) => listOwnerMediaIds(...a),
}));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getGalleryStats: async () => ({ approvedTotal: 3, guestCount: 2 }),
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

/** The ids the page hands the album as this viewer's own. */
async function ownIdsHanded() {
  seen.props = null;
  const page = await GuestEventPage({
    params: Promise.resolve({ token: EVENT.qr_token }),
  });
  render(<>{page}</>);
  // Set by the render above, which the compiler cannot see through the reset.
  const props = seen.props as Record<string, unknown> | null;
  return props?.canDeleteIds as string[] | undefined;
}

beforeEach(() => {
  vi.clearAllMocks();
  user = { id: "host-1", email_confirmed_at: "2026-09-01T00:00:00Z" };
  isRequestOwner.mockResolvedValue(true);
  // Her own uploads here (no guest row), and a guest row of hers the guest read would list.
  listOwnerMediaIds.mockResolvedValue(["own-1", "own-2"]);
  listAccountMediaIds.mockResolvedValue(["guest-row-1"]);
});

describe("the owner's own photographs on her own guest page", () => {
  it("★ are the host's own read, so a reload keeps her Delete on every upload of hers", async () => {
    expect(await ownIdsHanded()).toEqual(["own-1", "own-2"]);
    expect(listOwnerMediaIds).toHaveBeenCalledWith(EVENT.id);
    // Never a guest row's: the RPC's guest arm refuses the event's own host.
    expect(listAccountMediaIds).not.toHaveBeenCalled();
  });

  it("a signed-in guest's are still her account's guest rows, never the host's read", async () => {
    user = { id: "guest-1", email_confirmed_at: "2026-09-01T00:00:00Z" };
    isRequestOwner.mockResolvedValue(false);
    expect(await ownIdsHanded()).toEqual(["guest-row-1"]);
    expect(listAccountMediaIds).toHaveBeenCalledWith({
      eventId: EVENT.id,
      userId: "guest-1",
    });
    expect(listOwnerMediaIds).not.toHaveBeenCalled();
  });

  it("a viewer signed out asks neither (her own are the ticket's, asked by the album)", async () => {
    user = null;
    isRequestOwner.mockResolvedValue(false);
    expect(await ownIdsHanded()).toEqual([]);
    expect(listOwnerMediaIds).not.toHaveBeenCalled();
    expect(listAccountMediaIds).not.toHaveBeenCalled();
  });
});
