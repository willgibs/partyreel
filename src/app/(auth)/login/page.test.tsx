import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/login`'S ANSWER TO WHAT BROUGHT HER BACK (lp/account-exit). The callback sends a deleted
 * account's link or Google here as `?error=account_deleting`, and the page says why and when, in
 * conditional words, above the door; every other `?error=` stays the door's own failure. A param
 * repeated in the URL (`?error=a&error=b`) arrives as a list, which answered 500 before: the first
 * value is the one read.
 */

const state = vi.hoisted(() => ({ zone: "America/New_York" }));

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({ host: "partyreel.com", "x-vercel-ip-timezone": state.zone }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));
vi.mock("@/components/auth/login-form", () => ({
  LoginForm: ({ failure }: { failure: string | null }) => (
    <div data-testid="door" data-failure={failure ?? ""} />
  ),
}));

const { default: LoginPage } = await import("./page");

async function open(query: Record<string, string | string[]>) {
  render(await LoginPage({ searchParams: Promise.resolve(query) }));
}

beforeEach(() => {
  state.zone = "America/New_York";
});

describe("/login after a deleted account's sign-in", () => {
  it("★ says why and when, conditionally, above a door with no failure of its own", async () => {
    await open({ error: "account_deleting" });
    const notice = screen.getByRole("alert");
    expect(notice).toHaveTextContent(
      /^If you deleted your account, it’s still being erased\./,
    );
    expect(notice).toHaveTextContent(
      /start fresh with the same email after .+\./,
    );
    expect(screen.getByTestId("door")).toHaveAttribute("data-failure", "");
  });

  it("leaves every other failure to the door", async () => {
    await open({ error: "expired_link" });
    expect(document.querySelector("[data-account-deleting]")).toBeNull();
    expect(screen.getByTestId("door")).toHaveAttribute(
      "data-failure",
      "expired_link",
    );
  });

  it("★ reads the first of a repeated param, never a crash", async () => {
    await open({ error: ["account_deleting", "expired_link"] });
    expect(screen.getByRole("alert")).toHaveAttribute("data-account-deleting");
  });

  it("says nothing for no error at all", async () => {
    await open({});
    expect(document.querySelector("[data-account-deleting]")).toBeNull();
    expect(screen.getByTestId("door")).toHaveAttribute("data-failure", "");
  });
});
