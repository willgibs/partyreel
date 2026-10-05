/**
 * THE PLAN SWITCH'S SIGN-IN FALLBACK (crumbs-20: one of the ROADMAP's six bare `/login`s, from
 * `crumbs-11`). The change-plan route answers 401 when the session lapsed under an open plan sheet;
 * the host is sent to sign in and back to the page the sheet was on, where the dashboard used to be
 * the only place a sign-in could land them. Its billing logic is not this test's: a refusal and a
 * redirect are `checkout-button.test.tsx`'s.
 */
import { render, screen, waitFor } from "@testing-library/react";
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
afterEach(() => {
  vi.unstubAllGlobals();
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
