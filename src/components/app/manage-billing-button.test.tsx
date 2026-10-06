/**
 * THE BILLING BUTTON'S SIGN-IN FALLBACK (crumbs-20: one of the ROADMAP's six bare `/login`s, from
 * `crumbs-11`). A session that lapsed while a host sat on the account page sends them to sign in and
 * back to that page, never to the dashboard. The page rides only where it is one a sign-in may
 * return to (`loginPath`), so a page off the list keeps the bare login (reshaped on purpose in
 * pricing-doors: /pricing used to be that page's example and is on the list now, so the scar moved
 * to /help). The button presses the surface's doors (`pricing/pricing-doors.tsx`), the real ones
 * here: its route, and the error sentence a host reads when billing will not open.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ManageBillingButton } from "@/components/app/manage-billing-button";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

let pathname = "/";
let assigned: string | null = null;
let status = 401;
// What a refusal's body says, where the test wants the route's own sentence.
let refusal: unknown = {};

beforeEach(() => {
  push.mockClear();
  vi.mocked(toast.error).mockClear();
  pathname = "/";
  assigned = null;
  status = 401;
  refusal = {};
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () =>
        status === 200
          ? { ok: true, url: "https://billing.stripe.test/p/x" }
          : refusal,
    })),
  );
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...window.location,
      get pathname() {
        return pathname;
      },
      set href(url: string) {
        assigned = url;
      },
    },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

async function press() {
  render(<ManageBillingButton />);
  await userEvent.click(screen.getByRole("button", { name: "Manage billing" }));
}

describe("Manage billing, signed out", () => {
  it("sends the host to sign in and back to the page they were on", async () => {
    pathname = "/account";
    await press();
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/login?next=%2Faccount"),
    );
  });

  it("keeps the bare login on a page no sign-in returns to", async () => {
    pathname = "/help";
    await press();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });

  it("opens the portal when signed in, and asks nobody to sign in", async () => {
    status = 200;
    pathname = "/account";
    await press();
    await waitFor(() =>
      expect(assigned).toBe("https://billing.stripe.test/p/x"),
    );
    expect(push).not.toHaveBeenCalled();
  });
});

describe("Manage billing, when billing will not open", () => {
  it("says the route's own sentence, and goes nowhere", async () => {
    status = 400;
    refusal = {
      ok: false,
      code: "no_customer",
      message: "No billing account yet.",
    };
    await press();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't open billing.", {
        description: "No billing account yet.",
      }),
    );
    expect(assigned).toBeNull();
    expect(push).not.toHaveBeenCalled();
    // And the button is hers again, for another try.
    expect(
      screen.getByRole("button", { name: "Manage billing" }),
    ).toBeEnabled();
  });

  it("asks her to try again when the answer has no sentence", async () => {
    status = 500;
    await press();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't open billing.", {
        description: "Please try again.",
      }),
    );
  });
});
