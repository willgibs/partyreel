/**
 * ACCOUNT'S GOOGLE DRIVE CARD SAYS "NOT SET UP YET" IN WORDS WHERE DRIVE IS NOT SET UP (red-team 55's NIT, the brief's and
 * `env.ts`'s own expectation: "the panel, the dashboard and Account say 'not set up yet' in words"). It drew nothing, so
 * a host looking for the connection found no card and no reason, while the three doors said it. The card stands, with the
 * doors' sentence and no press: a Connect there could only come back as "isn't set up yet".
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const state = { configured: false };
const reads = {
  connection: vi.fn(async () => null),
  sends: vi.fn(async () => []),
  totals: vi.fn(async () => ({ albums: 0, bytes: 0, lastAt: null })),
};
vi.mock("@/lib/env", () => ({ driveConfigured: () => state.configured }));
vi.mock("@/lib/db/queries/drive", () => ({
  readConnection: reads.connection,
  readMySends: reads.sends,
  readMySentTotals: reads.totals,
}));
vi.mock("./actions", () => ({ disconnectDriveAction: vi.fn() }));

const { DriveAccountCard } = await import("./drive-account-card");
const { NOT_SET_UP } = await import("./not-set-up");

const draw = async () =>
  render(await DriveAccountCard({ userId: "u1", zone: "UTC" }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Account's Google Drive card", () => {
  it("★ stands where Drive is not set up, with the doors' own sentence and nothing to press", async () => {
    state.configured = false;
    await draw();
    const card = document.querySelector("[data-drive-card]");
    expect(card?.getAttribute("data-drive-card")).toBe("unavailable");
    expect(card?.id).toBe("google-drive");
    expect(screen.getByText("Google Drive")).toBeInTheDocument();
    expect(screen.getByText(NOT_SET_UP.title)).toBeInTheDocument();
    expect(card?.textContent).toContain(NOT_SET_UP.detail);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    // Nothing of hers is read for a card with nothing to show.
    expect(reads.connection).not.toHaveBeenCalled();
    expect(reads.sends).not.toHaveBeenCalled();
  });

  it("offers Connect where Drive is set up and she has no connection", async () => {
    state.configured = true;
    await draw();
    expect(
      document
        .querySelector("[data-drive-card]")
        ?.getAttribute("data-drive-card"),
    ).toBe("none");
    expect(screen.queryByText(NOT_SET_UP.title)).toBeNull();
    expect(
      screen.getByRole("link", { name: "Connect Google Drive" }),
    ).toHaveAttribute("href", "/api/drive/connect?next=%2Faccount");
  });
});
