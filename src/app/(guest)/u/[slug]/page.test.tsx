import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * A HANDLE NOBODY HOLDS DRAWS ITS OWN NOT-FOUND (stale-link). A `notFound()` thrown while this page rendered was
 * served as Next's error shell, an empty body until the script had run (almost six seconds of white on Slow 4G at 4x
 * CPU, measured on `next start`). So the page returns its segment's not-found itself, in the HTML, at 200
 * (gone-link-soft: the 404 the proxy set before the render was answered on Vercel with the site's /404, never this
 * screen). Pinned: the page never throws for a missing handle and draws the profile's own screen, which says nothing
 * about why, and its metadata is the not-found's: the tab reads "Profile not found" (it read "Profile"), and noindex,
 * which at 200 is all that keeps a dead handle out of an index.
 *
 * Everything a real profile reads is stubbed: the missing handle returns before any of it is asked,
 * but for the viewer, who is asked beside the RPC itself.
 */

vi.mock("server-only", () => ({}));
const stub = () => null;
vi.mock("@/lib/db/queries/social", () => ({
  getPublicProfile: async () => null,
  getPublicProfileAttendedCoverUrls: stub,
  getPublicProfileCoverUrls: stub,
  hasBlocked: stub,
  isBlockedEitherWay: stub,
  isFollowing: stub,
}));
vi.mock("@/components/app/event-card", () => ({
  EventCard: stub,
  RoleMarker: stub,
}));
vi.mock("@/app/(app)/account/profile/invite", () => ({
  PAGE_CHOICES_PATH: "/account/profile",
}));
vi.mock("@/app/(guest)/u/[slug]/owner-sections", () => ({
  OwnerSections: stub,
}));
vi.mock("@/components/guest/guest-header", () => ({ GuestHeader: stub }));
vi.mock("@/components/social/follow-button", () => ({ FollowButton: stub }));
vi.mock("@/components/social/profile-actions-menu", () => ({
  ProfileActionsMenu: stub,
}));
vi.mock("@/lib/avatar/seed", () => ({ seedFor: stub }));
vi.mock("@/lib/supabase/avatar-storage", () => ({ getAvatarUrl: stub }));
// The viewer is asked beside the RPC (crumbs-44), so a dead handle meets an anonymous one.
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: null, user: null }),
}));

const { default: PublicProfilePage, generateMetadata } = await import("./page");
const { notFoundMetadata } = await import("./not-found.metadata");
const { metadata: boundaryMetadata } = await import("./not-found");

const params = Promise.resolve({ slug: "nobody-holds-this" });

describe("a handle nobody holds", () => {
  it("draws the profile's own not-found, never throwing for Next's error shell", async () => {
    const page = await PublicProfilePage({ params });
    render(<>{page}</>);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "There's nobody at this address",
      }),
    ).toBeInTheDocument();
  });

  it("is titled as the not-found it is, noindex, with the not-found's own metadata", async () => {
    const metadata = await generateMetadata({ params });
    expect(metadata).toBe(notFoundMetadata);
    expect(boundaryMetadata).toBe(notFoundMetadata);
    expect(metadata.title).toBe("Profile not found");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
