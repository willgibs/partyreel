import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A DASHBOARD LINK TO AN EVENT THAT IS GONE, OR NEVER THIS HOST'S, DRAWS ITS OWN 404 (crumbs-28, from `stale-link`, with
 * build 30's red-team). Each of the event's pages threw `notFound()`, which Next serves as its error shell when nothing
 * has streamed (an empty body until the script runs) and, under the hub's `loading.tsx`, as the skeleton with the
 * screen drawn only once the client had run; and the tab kept the page's own title ("Event · Partyreel", measured on
 * the alias, "Event not found" nowhere in the HTML). So each page draws the host app's not-found itself, in the HTML,
 * and heads it with the not-found's own metadata, one home (`not-found.metadata.ts`) for the head and the boundary.
 * The status stays 200 behind sign-in (the manifest's Question): a soft 404, noindex.
 *
 * `getEvent` is the one read that decides it (RLS-scoped, deleted filtered): everything else a page reads is asked
 * after it and never here.
 */
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/queries/events", () => ({
  getEvent: async () => null,
  getReelProgress: vi.fn(),
}));
// The hub reads the profile beside the event (one round trip); every other read is asked only once the event is
// found, so none of them may run here.
vi.mock("@/lib/db/queries/profile", () => ({ getProfile: async () => null }));
const later = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/request-auth", () => ({ getRequestAuth: later }));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getLiveReelServerFacts: later,
  getUploaderIdentities: later,
}));
vi.mock("@/lib/db/queries/analytics", () => ({ getLinkStats: later }));
vi.mock("@/lib/db/queries/event-doors", () => ({
  getDoorCounts: later,
  getDoorQueue: later,
  getInviteList: later,
}));
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuests: later,
  getEventSocialSettings: later,
  getMyProfileSlug: later,
  getEventGuestList: later,
}));
vi.mock("@/lib/db/queries/likes", () => ({ getEventLikeCounts: later }));
vi.mock("@/lib/db/queries/media", () => ({ listEventMedia: later }));
vi.mock("@/lib/db/queries/event-blocks", () => ({ getEventBlocks: later }));
vi.mock("@/lib/db/queries/guest-addresses", () => ({
  getConfirmedGuestAddresses: later,
}));
vi.mock("@/lib/event/host-album.server", () => ({
  dealVisitSeed: later,
  planHubManifest: later,
  readHubReel: later,
  readRestOfManifest: later,
  seedFrom: later,
}));
vi.mock("@/lib/event/host-links.server", () => ({ readHostLinksBody: later }));
vi.mock("@/lib/event/gallery-items", () => ({ toHostGalleryItems: later }));
vi.mock("@/lib/site-url", () => ({ getSiteUrl: later }));
vi.mock("@/lib/social/cards", () => ({
  splitGuestList: later,
  withAvatarUrls: later,
}));
vi.mock("@/lib/avatar/seed", () => ({ seedFor: later }));
vi.mock("next/headers", () => ({ cookies: later, headers: later }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));
// What a found event's page draws: none of it is what is pinned here.
const part = vi.hoisted(() => () => null);
vi.mock("@/components/app/event-blocks/credit-look", () => ({
  HostCreditLookProvider: part,
}));
vi.mock("@/components/app/event-blocks/blocked-section", () => ({
  BlockedSection: part,
}));
vi.mock("@/components/app/event-feed/event-cards-row", () => ({
  EventCardsRow: part,
}));
vi.mock("@/components/app/event-feed/room-card", () => ({
  reviewCardFace: part,
}));
vi.mock("@/components/app/event-feed/event-gallery", () => ({
  EventGallery: part,
  EventLive: part,
}));
vi.mock("@/components/app/event-feed/launch-list", () => ({
  LaunchList: part,
  launchItems: part,
}));
vi.mock("@/components/app/event-feed/host-album", () => ({
  HostAlbumProvider: part,
  HubAlbumCount: part,
}));
vi.mock("@/components/app/event-feed/review-room", () => ({
  ReviewRoom: part,
}));
vi.mock("@/components/app/event-uploads", () => ({ EventUploads: part }));
vi.mock("@/components/app/host-add-provider", () => ({
  HostAddProvider: part,
}));
vi.mock("@/components/app/host-selection-provider", () => ({
  HostSelectionProvider: part,
}));
vi.mock("@/components/app/pricing/return-path", () => ({
  WELCOME_VALUE: "pro",
}));
vi.mock("@/components/app/pricing/welcome-to-pro", () => ({
  WelcomeToPro: part,
}));
vi.mock("@/components/app/share/event-code-door", () => ({
  EventCodeDoor: part,
}));
vi.mock("@/components/app/share/event-link-row", () => ({
  EventLinkRow: part,
}));
vi.mock("@/components/app/share/event-share-provider", () => ({
  EventShareProvider: part,
}));
vi.mock("@/components/app/share/event-sheets", () => ({ EventSheets: part }));
vi.mock("@/components/shared/crumbs", () => ({ SetCrumbs: part }));
vi.mock("@/components/social/guest-list", () => ({ GuestList: part }));
vi.mock("@/app/(app)/dashboard/[eventId]/guests/at-the-door", () => ({
  AtTheDoor: part,
}));
vi.mock("@/app/(app)/dashboard/[eventId]/guests/guests-invite", () => ({
  GuestsInvite: part,
}));
vi.mock("@/app/(app)/dashboard/[eventId]/guests/invited-section", () => ({
  InvitedSection: part,
}));

const params = Promise.resolve({
  eventId: "00000000-0000-4000-8000-000000000000",
});
const hub = await import("./page");
const review = await import("./review/page");
const guests = await import("./guests/page");
const reel = await import("./reel/page");
const { appNotFoundMetadata } = await import("../../not-found.metadata");
const { metadata: boundaryMetadata } = await import("../../not-found");

const ROOMS = [
  {
    name: "the hub",
    draw: () => hub.default({ params, searchParams: Promise.resolve({}) }),
    head: () =>
      hub.generateMetadata({ params, searchParams: Promise.resolve({}) }),
  },
  {
    name: "Review",
    draw: () => review.default({ params }),
    head: () => review.generateMetadata({ params }),
  },
  {
    name: "Guests",
    draw: () => guests.default({ params }),
    head: () => guests.generateMetadata({ params }),
  },
  {
    name: "the reel's old room",
    draw: () => reel.default({ params }),
    head: () => reel.generateMetadata({ params }),
  },
];

beforeEach(() => later.mockClear());

describe.each(ROOMS)(
  "$name, for an event that is gone or not this host's",
  (room) => {
    it("★ draws the host app's own not-found in its HTML, never throwing for Next's error shell", async () => {
      const page = await room.draw();
      render(<>{page}</>);
      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: "We couldn't find that event",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Back to dashboard" }),
      ).toHaveAttribute("href", "/dashboard");
      // Nothing past the one read that decided it.
      expect(later).not.toHaveBeenCalled();
    });

    it('★ is titled as the 404 it is, "Event not found", from the not-found\'s own metadata', async () => {
      const metadata = await room.head();
      expect(metadata).toBe(appNotFoundMetadata);
      expect(metadata.title).toBe("Event not found");
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });
  },
);

describe("the host app's not-found boundary", () => {
  it("heads a thrown notFound() with the same words, one home for both", () => {
    expect(boundaryMetadata).toBe(appNotFoundMetadata);
  });
});
