import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * /ME: THE OWNER MODE AT AN ADDRESS THAT NEEDS NO HANDLE (crumbs-46, Will's answer A to crumbs-44's question). An
 * account with no handle has no page of its own, and the profile's private half (her uploads, her likes, the people she
 * follows) lived only on /u/<handle>, so a guest who confirmed an email and added photos had hearts she could never
 * list. Pinned: the handle-less account meets those sections here, with the setup's invitation for a head and no Not
 * now (it is the one way on from this page); an account with a handle is sent to the page that holds them; and the
 * page is in nobody's index.
 *
 * The (app) layout above it is the sign-in gate and the name gate (`name-gate.test.ts` holds every (app) route to one);
 * its own `getProfile()` here is the request's cached read, and a missing row goes back to /login like Account's does.
 */

vi.mock("server-only", () => ({}));

const getProfile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/queries/profile", () => ({ getProfile }));

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
      display_name: "Maya",
    });
  });

  it("meets her own page: its heading, the owner mode, and the setup's invitation for a head", async () => {
    render(<>{await MePage()}</>);
    expect(
      screen.getByRole("heading", { level: 1, name: "Your profile" }),
    ).toBeInTheDocument();
    expect(screen.getByText("the owner sections")).toBeInTheDocument();
    // The invitation opens the setup itself (the dashboard's card points at the same door).
    expect(
      screen.getByRole("link", { name: "Choose what shows" }),
    ).toHaveAttribute("href", "/account/profile");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("★ keeps the invitation standing: no Not now, since it is the page's one way on to the setup", async () => {
    render(<>{await MePage()}</>);
    expect(
      screen.queryByRole("button", { name: "Not now" }),
    ).not.toBeInTheDocument();
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
