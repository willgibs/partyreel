import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE ALBUM'S GUEST LIST OFFERS NO FOLLOW ACROSS A BLOCK (crumbs-87, the gap audit): `followUser` is block-silent (ok,
 * nothing written), so a Follow on the chip of someone she blocked, or who blocked her, read Following over nothing.
 * The page reads the viewer's own relations for the names the list already holds (`getBlockedAmong`) and hands the
 * list the answer beside `followingIds`. What is pinned is what the page asks, of whom, and what it hands on: the
 * profile cards' ids and nobody else's (a name nobody proved has no profile to follow), the viewer's id from her own
 * session, nothing at all for a signed-out viewer, and no id the list was not already holding. The chips' own
 * behaviour is `guest-list.test.tsx`'s, and the reads' `social.test.ts`'s.
 *
 * Everything else the album page reads is stood in for, as `page.waiting.test.tsx` does: a found, open album this
 * viewer is through the door of, at full access.
 */
vi.mock("server-only", () => ({}));
vi.mock("@/lib/event/zone.server", () => ({ readPartyZone: async () => null }));
vi.mock("@/lib/disposable/waiting.server", () => ({
  albumWaits: async () => false,
}));
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
  moderation_mode: "live",
}));
vi.mock("@/lib/events/closed-door.server", () => ({
  pageDoor: async () => ({
    event: EVENT,
    decision: { kind: "through", admitted: false },
  }),
}));
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));

const stub = () => null;
vi.mock("@/components/guest/event-experience", () => ({
  // The page hands the guest list over as a slot; the album draws it.
  EventExperience: ({ guestListSlot }: { guestListSlot: React.ReactNode }) =>
    guestListSlot,
}));
vi.mock("@/components/guest/door/shut-door", () => ({ ShutDoor: stub }));
vi.mock("@/components/guest/guest-header", () => ({ GuestHeader: stub }));
vi.mock("@/components/shared/claim-ask", () => ({ ClaimAsk: stub }));
const seen = vi.hoisted(() => ({
  props: null as Record<string, unknown> | null,
}));
vi.mock("@/components/social/guest-list", () => ({
  GuestList: (props: Record<string, unknown>) => {
    seen.props = props;
    return null;
  },
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
  getProfileMenu: async () => ({ displayName: "Maya" }),
}));

const PEOPLE = vi.hoisted(() => ({
  maya: { id: "u-maya", displayName: "Maya", slug: "maya" },
  priya: { id: "u-priya", displayName: "Priya", slug: "priya" },
  sam: { kind: "unverified", id: "g-sam", displayName: "Sam" },
}));
const getBlockedAmong = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/queries/social", () => ({
  getBlockedAmong,
  getEventGuestList: async () => [PEOPLE.maya, PEOPLE.priya, PEOPLE.sam],
  getHostCard: async () => null,
  getMyFollowing: async () => [{ id: "u-maya" }],
  isFollowing: async () => false,
}));
vi.mock("@/lib/social/cards", () => ({
  // Profile cards before the unverified names, as the real split hands them on.
  splitGuestList: () => ({
    cards: [PEOPLE.maya, PEOPLE.priya],
    unverified: [PEOPLE.sam],
  }),
  withAvatarUrls: async (cards: unknown[]) => cards,
}));
vi.mock("@/lib/events/gallery-access", () => ({
  doorGalleryDecision: () => null,
  resolveGalleryDecision: stub,
}));
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isRequestOwner: async () => false,
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
  readGuestSessionCookie: async () => "t".repeat(64),
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

/** What the page hands the guest list. */
async function handed() {
  seen.props = null;
  const page = await GuestEventPage({
    params: Promise.resolve({ token: EVENT.qr_token }),
  });
  render(<>{page}</>);
  // Set by the stub during that render (a read narrowed to the null it started as would say never).
  return seen.props as Record<string, unknown> | null;
}

beforeEach(() => {
  vi.clearAllMocks();
  user = null;
  getBlockedAmong.mockResolvedValue(new Set(["u-priya"]));
});

describe("the album's guest list, across a block", () => {
  it("★ asks for the viewer's own relations among the profile cards' ids, and hands the answer on beside who she follows", async () => {
    user = { id: "viewer-1", email_confirmed_at: "2026-09-01T00:00:00Z" };
    const props = await handed();
    expect(getBlockedAmong).toHaveBeenCalledTimes(1);
    // Her id from her own session, and the two people with a profile: the typed name has none to follow.
    expect(getBlockedAmong).toHaveBeenCalledWith("viewer-1", [
      "u-maya",
      "u-priya",
    ]);
    expect(props?.blockedIds).toEqual(new Set(["u-priya"]));
    expect(props?.followingIds).toEqual(new Set(["u-maya"]));
    expect(props?.viewerId).toBe("viewer-1");
  });

  it("asks nothing of a signed-out viewer, and hands the list nothing to hide a Follow behind", async () => {
    const props = await handed();
    expect(getBlockedAmong).not.toHaveBeenCalled();
    expect(props?.blockedIds).toBeUndefined();
    expect(props?.viewerId).toBeNull();
  });
});
