import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * A LINK THAT NAMES NOTHING DRAWS ITS OWN NOT-FOUND (stale-link). A `notFound()` thrown while this page rendered was
 * served as Next's error shell, an empty body until the script had run: a stale QR code on a cold phone was a white
 * page for six seconds on Slow 4G at 4x CPU (measured on `next start`), and for a reader with no script for good. So
 * the page returns its segment's not-found itself, in the HTML, at 200 (gone-link-soft: the 404 the proxy set before
 * the render was answered on Vercel with the site's /404, never this screen). Pinned: the page never throws for a
 * missing link and draws the guest link's own screen, and its metadata is the not-found's: the tab reads "Event not
 * found" (build 28's red-team: it read "Join event"), and noindex, which at 200 is all that keeps a dead link out of
 * an index.
 *
 * Everything the album itself reads is stubbed: the missing link returns before any of it is asked.
 */

vi.mock("server-only", () => ({}));
vi.mock("@/lib/events/closed-door.server", () => ({
  pageDoor: async () => null,
}));
const stub = () => null;
vi.mock("@/components/guest/door/shut-door", () => ({ ShutDoor: stub }));
vi.mock("@/components/guest/event-experience", () => ({
  EventExperience: stub,
}));
vi.mock("@/components/shared/album-window-plan", () => ({
  ALBUM_WIDTH_COOKIE: "pr_album_w",
  parseAlbumWidth: stub,
}));
vi.mock("@/components/guest/guest-header", () => ({ GuestHeader: stub }));
vi.mock("@/components/shared/claim-ask", () => ({ ClaimAsk: stub }));
vi.mock("@/components/social/guest-list", () => ({
  GuestList: stub,
  GUEST_LIST_FACES_THRESHOLD: 8,
}));
vi.mock("@/lib/analytics/bots", () => ({ isLikelyBot: stub }));
vi.mock("@/lib/db/mutations/analytics", () => ({ recordLinkHit: stub }));
vi.mock("@/lib/db/mutations/guest-media", () => ({
  listAccountMediaIds: stub,
}));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getGalleryStats: stub,
  getHostAvatarSeed: stub,
  getOpenAlbumItemForCard: stub,
}));
vi.mock("@/lib/db/queries/profile", () => ({ getProfileMenu: stub }));
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuestList: stub,
  getHostCard: stub,
  getMyFollowing: stub,
}));
vi.mock("@/lib/social/cards", () => ({
  splitGuestList: stub,
  withAvatarUrls: stub,
}));
vi.mock("@/lib/events/gallery-access", () => ({
  doorGalleryDecision: stub,
  resolveGalleryDecision: stub,
}));
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isRequestOwner: stub,
}));
vi.mock("@/lib/events/gallery-access.server", () => ({
  resolveViewerDecision: stub,
  streamGallerySeed: stub,
}));
vi.mock("@/lib/events/unlock-cookie", () => ({ isUnlocked: stub }));
vi.mock("@/lib/guest/event-card", () => ({
  EVENT_CARD_ALT: "",
  EVENT_CARD_SIZE: {},
  eventCardPath: stub,
  privateEventCardPath: stub,
}));
vi.mock("@/lib/guest/session-cookie", () => ({
  readGuestSessionCookie: stub,
}));
vi.mock("@/lib/media/share-save", () => ({
  PHOTO_PARAM: "photo",
  readPhotoParam: stub,
}));
vi.mock("@/lib/r2/presign", () => ({ presignDownload: stub }));
vi.mock("@/lib/shared/tile-size-cookie", () => ({
  resolveRowStep: stub,
  TILE_SIZE_COOKIE: "pr_tile_size",
}));
vi.mock("@/lib/site-url", () => ({ getSiteUrl: stub }));
vi.mock("@/lib/supabase/request-auth", () => ({ getRequestAuth: stub }));
vi.mock("@/lib/welcome", () => ({ needsDisplayName: stub }));

const { default: GuestEventPage, generateMetadata } = await import("./page");
const { notFoundMetadata } = await import("./not-found.metadata");
const { metadata: boundaryMetadata } = await import("./not-found");

const params = Promise.resolve({ token: "stale-token" });

describe("a guest link that names nothing", () => {
  it("draws the guest link's own not-found, never throwing for Next's error shell", async () => {
    const page = await GuestEventPage({ params });
    render(<>{page}</>);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "This event link didn't work",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "What is Partyreel?" }),
    ).toHaveAttribute("href", "/");
  });

  it("is titled as the not-found it is, noindex, with the not-found's own metadata", async () => {
    const metadata = await generateMetadata({
      params,
      searchParams: Promise.resolve({}),
    });
    expect(metadata).toBe(notFoundMetadata);
    expect(boundaryMetadata).toBe(notFoundMetadata);
    expect(metadata.title).toBe("Event not found");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
