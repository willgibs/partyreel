import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * /ME: THE OWNER MODE AT AN ADDRESS THAT NEEDS NO HANDLE (crumbs-46, Will's answer A to crumbs-44's question). An
 * account with no handle has no page of its own, and the profile's private half (her uploads, her likes, the people she
 * follows) lived only on /u/<handle>, so a guest who confirmed an email and added photos had hearts she could never
 * list. Pinned: the handle-less account meets those sections here, with the setup's invitation standing and no Not now
 * (it is the one way on from this page); an account with a handle is sent to the page that holds them; and the page is
 * in nobody's index.
 *
 * ★ RESHAPED BY `account-moments` r1 (`me-page=private`, Will 2026-10-06). The reason that expired: the page's one
 * title was "Your profile" and the invitation was its head. Its head is her own now, the public page's (her photo and
 * name, and when she joined), marked that only she can see the page, so the title that names the page is the tab's
 * (`metadata`) and the heading is her. The scars kept: the invitation still stands with no Not now, the sections are
 * the owner mode's, a page that exists redirects, and the page is noindex.
 *
 * The (app) layout above it is the sign-in gate and the name gate (`name-gate.test.ts` holds every (app) route to one);
 * its own `getProfile()` here is the request's cached read, and a missing row goes back to /login like Account's does.
 */

vi.mock("server-only", () => ({}));

const getProfile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/queries/profile", () => ({ getProfile }));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  getAvatarUrl: async () => null,
}));
vi.mock("@/lib/avatar/seed", () => ({ seedFor: () => "seed" }));

// `redirect` throws in Next to stop the render; so does this, saying where.
const redirect = vi.hoisted(() =>
  vi.fn((to: string): never => {
    throw new Error(`redirect:${to}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/app/(guest)/u/[slug]/owner-sections", () => ({
  OwnerSections: () => <p>the owner sections</p>,
}));
vi.mock("@/app/(app)/account/profile/actions", () => ({
  dismissPageInviteAction: vi.fn(),
}));
// The plate reads her photographs' light on her device after the page is idle (`page-invite-read.ts`, tested beside it);
// here it never lands, so the page is pinned to what it draws and not to a read.
vi.mock("@/components/app/dashboard/page-invite-read", () => ({
  readInviteLight: () => new Promise(() => {}),
}));

const { default: MePage, metadata } = await import("./page");

beforeEach(() => {
  getProfile.mockReset();
  redirect.mockClear();
});

describe("a handle-less account at /me", () => {
  beforeEach(() => {
    getProfile.mockResolvedValue({
      id: "u-1",
      slug: null,
      display_name: "Maya Alvarez",
      avatar_updated_at: null,
      created_at: "2026-03-14T10:00:00.000Z",
    });
  });

  it("★ meets her own page: her name for its heading, when she joined, and only she can see it", async () => {
    render(<>{await MePage()}</>);
    expect(
      screen.getByRole("heading", { level: 1, name: "Maya Alvarez" }),
    ).toBeInTheDocument();
    // The public page's own meta, with no handle to lead it.
    expect(screen.getByText("Joined March 2026")).toBeInTheDocument();
    expect(screen.queryByText(/^@/)).toBeNull();
    expect(screen.getByText("Only you can see this page.")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("then her things, the invitation between: the owner mode, and the setup's door", async () => {
    render(<>{await MePage()}</>);
    const invite = screen.getByRole("link", { name: "Choose what shows" });
    // The invitation opens the setup itself (the dashboard's card points at the same door).
    expect(invite).toHaveAttribute("href", "/account/profile");
    const sections = screen.getByText("the owner sections");
    // Head, then the invitation, then her things.
    expect(
      invite.compareDocumentPosition(sections) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The head says the whole page is hers, so the sections' own line (the public page's) is not said twice.
    expect(screen.queryByText(/only you can see the sections/i)).toBeNull();
  });

  it("★ keeps the invitation standing: no Not now, since it is the page's one way on to the setup", async () => {
    render(<>{await MePage()}</>);
    expect(
      screen.queryByRole("button", { name: "Not now" }),
    ).not.toBeInTheDocument();
  });

  // `invite=plate` (account-moments r2): the invitation is one compact lit plate under her head, arriving a beat after it,
  // and what stands below is as it was.
  it("draws the invitation as its plate, in a beat of its own after her head", async () => {
    const { container } = render(<>{await MePage()}</>);
    const plate = container.querySelector("[data-page-invite]")!;
    expect(plate).not.toBeNull();
    expect(plate.closest("[data-arrive]")).toHaveStyle({ "--arrive-i": "1" });
    expect(
      screen.getByRole("region", { name: "Your page, when you’re ready" }),
    ).toBeInTheDocument();
  });

  it("is in nobody's index, and titled for what it is", () => {
    expect(metadata.title).toBe("Your profile");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("an account whose page exists", () => {
  it("goes on to /u/<handle>, where the owner mode now lives, and never draws it here", async () => {
    getProfile.mockResolvedValue({
      id: "u-1",
      slug: "maya",
      display_name: "Maya",
    });
    await expect(MePage()).rejects.toThrow("redirect:/u/maya");
    expect(redirect).toHaveBeenCalledWith("/u/maya");
  });
});

describe("no profile row", () => {
  it("goes back to /login, as Account's page does", async () => {
    getProfile.mockResolvedValue(null);
    await expect(MePage()).rejects.toThrow("redirect:/login");
  });
});
