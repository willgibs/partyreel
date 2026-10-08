/**
 * "SIGNED YOU INTO THE ACCOUNT <EMAIL> ALREADY HAD", THE LINE A TAPPED LINK OWES (crumbs-88; Will's `existing=tell`: "it
 * should be dismissible and provide an action if it was a mistake"). The callback marks the dashboard
 * (`/dashboard?signed_in=existing`) after the server's own test, and this draws the one line the code would have said.
 * Pinned: the address it says is her own profile's, both ways out work (dismiss, and Not you? as the account menu's sign-out,
 * guest tickets put down first), it says nothing it cannot say (no address), and it cleans the mark off the address.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const out = vi.hoisted(() => ({ calls: [] as string[] }));
vi.mock("@/components/auth/sign-out", () => ({
  signOutHere: vi.fn(async () => {
    out.calls.push("sign-out");
  }),
}));
vi.mock("@/lib/guest/use-stored-session", () => ({
  forgetGuestTickets: vi.fn(() => {
    out.calls.push("tickets");
  }),
}));

const { ExistingAccountBanner } =
  await import("@/components/auth/account-door-existing-banner");

beforeEach(() => {
  out.calls = [];
  window.history.replaceState(null, "", "/");
});

describe("the line", () => {
  it("★ says the account she was signed into, in the code's own words, with her own address", () => {
    render(<ExistingAccountBanner email="host@example.com" />);
    const line = screen.getByRole("status");
    expect(line).toHaveTextContent(
      "Signed you into the account host@example.com already had.",
    );
  });

  it("says no address it does not have: the account she already had, nothing more", () => {
    render(<ExistingAccountBanner email={null} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Signed you into the account you already had.",
    );
  });
});

describe("its two ways out", () => {
  it("★ Dismiss puts it away, for the visit, and signs nothing out", async () => {
    render(<ExistingAccountBanner email="host@example.com" />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).toBeNull();
    expect(out.calls).toEqual([]);
  });

  it("★ Not you? puts this device's guest tickets down and signs it out, in the account menu's own order", async () => {
    render(<ExistingAccountBanner email="host@example.com" />);
    await userEvent.click(screen.getByRole("button", { name: "Not you?" }));
    expect(out.calls).toEqual(["tickets", "sign-out"]);
  });
});

describe("the address it came on", () => {
  it("★ is cleaned of the mark as it mounts, so a reload or a bookmark never says it again, and nothing else on it is touched", () => {
    window.history.replaceState(
      null,
      "",
      "/dashboard?signed_in=existing&view=table#events",
    );
    render(<ExistingAccountBanner email="host@example.com" />);
    expect(window.location.pathname).toBe("/dashboard");
    expect(window.location.search).toBe("?view=table");
    expect(window.location.hash).toBe("#events");
  });

  it("leaves an address with no mark exactly as it is", () => {
    window.history.replaceState(null, "", "/dashboard?view=table");
    render(<ExistingAccountBanner email="host@example.com" />);
    expect(window.location.search).toBe("?view=table");
  });
});
