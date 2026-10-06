/**
 * THE PLAN SWITCH'S SIGN-IN FALLBACK (crumbs-20: one of the ROADMAP's six bare `/login`s, from
 * `crumbs-11`). The change-plan route answers 401 when the session lapsed under an open plan sheet;
 * the host is sent to sign in and back to the page the sheet was on, where the dashboard used to be
 * the only place a sign-in could land them. Its billing logic is not this test's: a refusal and a
 * redirect are `checkout-button.test.tsx`'s.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChangePlanButton } from "@/components/app/pricing/change-plan-button";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

let pathname = "/";

beforeEach(() => {
  push.mockClear();
  pathname = "/";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })),
  );
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...window.location,
      get pathname() {
        return pathname;
      },
    },
  });
});
/** The page coming back from the browser's back/forward cache, as the browser tells it. */
function pageshow(persisted: boolean) {
  window.dispatchEvent(Object.assign(new Event("pageshow"), { persisted }));
}
afterEach(() => {
  vi.unstubAllGlobals();
  // A press that left holds every door until the page comes back (`leave.ts`): this page always does, for the next test.
  pageshow(true);
});

async function press() {
  render(
    <ChangePlanButton planId="pro_50">Switch to Pro 50 GB</ChangePlanButton>,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Switch to Pro 50 GB" }),
  );
}

describe("a plan switch, signed out", () => {
  it("sends the host to sign in and back to the page the sheet was on", async () => {
    pathname = "/dashboard";
    await press();
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/login?next=%2Fdashboard"),
    );
  });

  // Reshaped on purpose (pricing-doors): /pricing used to be the example of a page off the list and is on it now, so the
  // scar moved to /help, which is still not a place a sign-in may return to.
  it("keeps the bare login on a page no sign-in returns to", async () => {
    pathname = "/help";
    await press();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });
});

/**
 * ★ PRESSED UNTIL THE PAGE HAS GONE (crumbs-83): Stripe's confirm page assigned is a page still standing while Stripe
 * answers, and the old button came back at once, so a second tap opened a second confirm session. It holds until the
 * page hides, and a page the browser brings back from its cache lets it go (`leave.ts`).
 */
describe("★ a switch, pressed until the page has gone (crumbs-83)", () => {
  it("★ stays Opening… and pressed once Stripe's address is assigned, and lets go when the page comes back", async () => {
    const CONFIRM = "https://billing.stripe.com/p/session/confirm";
    let assigned: string | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, url: CONFIRM }),
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
    await press();
    await waitFor(() => expect(assigned).toBe(CONFIRM));
    const button = screen.getByRole("button", { name: "Opening…" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    act(() => pageshow(true));
    expect(
      screen.getByRole("button", { name: "Switch to Pro 50 GB" }),
    ).toBeEnabled();
  });
});
