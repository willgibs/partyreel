import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
// What the page reads about this profile and this viewer's relation to it; a dead handle is the default.
const read = vi.hoisted(() => ({
  profile: null as unknown,
  /** I blocked them. */
  blocked: false,
  /** Either of us blocked the other. */
  blockedEitherWay: false,
  viewer: null as { id: string } | null,
}));
vi.mock("@/lib/db/queries/social", () => ({
  getPublicProfile: async () => read.profile,
  getPublicProfileAttendedCoverUrls: stub,
  getPublicProfileCoverUrls: stub,
  hasBlocked: async () => read.blocked,
  isBlockedEitherWay: async () => read.blockedEitherWay,
  isFollowing: async () => false,
}));
vi.mock("@/components/app/event-card", () => ({
  EventCard: stub,
  RoleMarker: stub,
}));
vi.mock("@/app/(app)/account/profile/invite", () => ({
  PAGE_CHOICES_PATH: "/account/profile",
}));
vi.mock("@/app/(guest)/u/[slug]/owner-sections", () => ({
  OwnerNote: stub,
  OwnerSections: stub,
}));
vi.mock("@/components/guest/guest-header", () => ({ GuestHeader: stub }));
vi.mock("@/components/social/follow-button", () => ({
  FollowButton: () => <button type="button">Follow</button>,
}));
vi.mock("@/components/social/profile-actions-menu", () => ({
  ProfileActionsMenu: () => <button type="button">More options</button>,
}));
// The line a first follow says is drawn under the head by a scope the page wraps it in (`first-follow-line.tsx`, tested
// beside it); here both are markers, so the page is pinned to where it puts them and for whom.
vi.mock("@/components/social/first-follow-line", () => ({
  FirstFollowScope: ({
    name,
    children,
  }: {
    name: string;
    children: React.ReactNode;
  }) => <div data-follow-scope={name}>{children}</div>,
  FirstFollowSlot: () => <p data-follow-slot />,
}));
vi.mock("@/app/(guest)/u/[slug]/blocked-well", () => ({
  BlockedWell: ({ name }: { name: string }) => <p>the well for {name}</p>,
}));
vi.mock("@/lib/avatar/seed", () => ({ seedFor: stub }));
vi.mock("@/lib/supabase/avatar-storage", () => ({ getAvatarUrl: stub }));
// The viewer is asked beside the RPC (crumbs-44), so a dead handle meets an anonymous one.
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: null, user: read.viewer }),
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
    // The boundary takes the words alone: a thrown notFound() carries Next's one noindex (crumbs-86).
    expect(boundaryMetadata).toEqual({ title: notFoundMetadata.title });
    expect(metadata.title).toBe("Profile not found");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

/**
 * THE WELL ON A PAGE SHE BLOCKED (`account-moments` r1, `block=line`). The privacy is the whole of its contract: a
 * block is private and mutual, and the page is public by existence, so what it says about a block can only ever be said
 * to the one who made it. Pinned: the well is drawn for her own block alone, never when only they blocked her (that
 * page is as it has always been, Follow not there and the menu still standing), and never to a visitor with no account.
 */
describe("a page the viewer blocked", () => {
  const jordan = {
    id: "jordan",
    slug: "jordan",
    display_name: "Jordan Pike",
    bio: null,
    avatar_updated_at: null,
    created_at: "2026-03-14T10:00:00.000Z",
    hosted_events: [],
    attended_events: [],
    private_event_count: 0,
  };

  beforeEach(() => {
    read.profile = jordan;
    read.viewer = { id: "priya" };
    read.blocked = false;
    read.blockedEitherWay = false;
  });

  async function visit() {
    render(<>{await PublicProfilePage({ params })}</>);
  }

  it("★ says it where Follow stood, to the one who blocked, and Follow is gone", async () => {
    read.blocked = true;
    read.blockedEitherWay = true;
    await visit();
    expect(screen.getByText("the well for Jordan Pike")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
    // The menu stays: it is her Unblock too, and a vanishing menu would tell the other side.
    expect(
      screen.getByRole("button", { name: "More options" }),
    ).toBeInTheDocument();
  });

  it("★ never draws it, or anything else, for a viewer only THEY blocked: Follow is merely not there", async () => {
    read.blockedEitherWay = true;
    await visit();
    expect(screen.queryByText(/the well for/)).toBeNull();
    expect(screen.queryByText(/blocked/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "More options" }),
    ).toBeInTheDocument();
  });

  it("draws neither where nothing is blocked, and nothing at all to a visitor with no account", async () => {
    await visit();
    expect(screen.queryByText(/the well for/)).toBeNull();
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
    cleanup();

    read.viewer = null;
    read.blocked = true;
    read.blockedEitherWay = true;
    await visit();
    expect(screen.queryByText(/the well for/)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

/**
 * THE LINE A FIRST FOLLOW SAYS STANDS UNDER THE HEAD (`account-moments` r2, `follow=once`): the actions are a narrow box at
 * a desk, so the page wraps the head in a scope and puts the slot under it, and the control reports into the scope instead
 * of drawing beside itself. Pinned: a visitor who can follow gets the scope, named for the page's person, with the slot
 * right after the head; everyone who cannot (a visitor with no account, one the page is blocked to either way) gets
 * neither, so nothing is shipped to a growth surface's anonymous readers.
 */
describe("the scope of a first follow's line", () => {
  const jordan = {
    id: "jordan",
    slug: "jordan",
    display_name: "Jordan Pike",
    bio: null,
    avatar_updated_at: null,
    created_at: "2026-03-14T10:00:00.000Z",
    hosted_events: [],
    attended_events: [],
    private_event_count: 0,
  };

  beforeEach(() => {
    read.profile = jordan;
    read.viewer = { id: "priya" };
    read.blocked = false;
    read.blockedEitherWay = false;
  });

  async function visit() {
    return render(<>{await PublicProfilePage({ params })}</>).container;
  }

  it("★ wraps the head for a visitor who can follow, naming the person, with the slot right under it", async () => {
    const page = await visit();
    const scope = page.querySelector("[data-follow-scope]")!;
    expect(scope).toHaveAttribute("data-follow-scope", "Jordan Pike");
    const head = scope.querySelector("h1")!.closest("section")!;
    expect(head.nextElementSibling).toBe(
      scope.querySelector("[data-follow-slot]"),
    );
    // The Follow itself is inside the head's actions, the scope's own.
    expect(scope).toContainElement(
      screen.getByRole("button", { name: "Follow" }),
    );
  });

  it("is never drawn for a visitor with no account, nor where the page is blocked either way", async () => {
    read.viewer = null;
    let page = await visit();
    expect(page.querySelector("[data-follow-scope]")).toBeNull();
    expect(page.querySelector("[data-follow-slot]")).toBeNull();
    cleanup();

    read.viewer = { id: "priya" };
    read.blockedEitherWay = true;
    page = await visit();
    expect(page.querySelector("[data-follow-scope]")).toBeNull();
    expect(page.querySelector("[data-follow-slot]")).toBeNull();
  });

  it("is never drawn on her own page, which has no Follow to say anything for", async () => {
    read.viewer = { id: "jordan" };
    const page = await visit();
    expect(page.querySelector("[data-follow-scope]")).toBeNull();
  });
});
