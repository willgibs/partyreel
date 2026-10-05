/**
 * THE RETURN FROM GOOGLE IS SAID ON A FULL PAGE LOAD (red-team 55's MEDIUM). Every return from Google or from the
 * connect route is a full page load, and the root layout draws `<Toaster />` AFTER `{children}`: a mount effect in the
 * page runs before the Toaster has subscribed, and sonner shows a toast only to a Toaster that is subscribed when it is
 * published. `/account?drive=unavailable` cleaned its address and said nothing, where a client navigation said it.
 *
 * This is pinned with sonner's REAL Toaster laid out as the root layout lays it (the page's tree first, the Toaster
 * after it, inside Next's Router stand-in so the history patch exists when it does under Next): a stubbed `toast` would
 * pass on the old code, which published at once. The production build in a browser is the other half
 * (`/account?drive=unavailable`, loaded whole).
 */
import { StrictMode, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";

// The component project stubs sonner everywhere; this file needs the real Toaster, whose subscription is the point.
vi.unmock("sonner");
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const { Toaster, toast } = await import("sonner");
const { DriveFlag } = await import("./drive-flag");
const { rememberIntent, DRIVE_INTENT_KEY } = await import("./drive-client");
const { resetDriveStatus } = await import("./use-drive-status");

const ALBUM = "6f1c2b0e-3b0a-4a53-9a34-0f3f9a9d1d11";

/** The root layout as it lays them out: the page's tree first, the Toaster after it (effects run in that order). */
function RootLayout({ children }: { children: ReactNode }) {
  return (
    <NextRouterStandIn>
      <div>{children}</div>
      <Toaster />
    </NextRouterStandIn>
  );
}

/** The status read the flag makes for a host who has the hint cookie: nothing sending, Drive not set up. */
function stubStatus() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        configured: false,
        connection: null,
        sends: [],
        now: new Date().toISOString(),
      }),
    })),
  );
}

let next: NextHistory;
beforeEach(() => {
  next = installNextHistory();
  stubStatus();
});

afterEach(() => {
  toast.dismiss();
  next.uninstall();
  window.history.replaceState(null, "", "/");
  sessionStorage.clear();
  document.cookie = "pr_drive=; Max-Age=0; path=/";
  resetDriveStatus();
  vi.unstubAllGlobals();
});

/** The toasts on the screen, by their words. */
const toasts = () =>
  [...document.querySelectorAll("[data-sonner-toast]")].map((el) => ({
    type: el.getAttribute("data-type"),
    text: el.textContent ?? "",
  }));

describe("the return word, on a full page load", () => {
  it("★ is said once the Toaster can hear it: the flag's effect runs before the Toaster subscribes, so a toast sent in it is dropped", async () => {
    next.land("/account?drive=unavailable");
    render(
      <RootLayout>
        <DriveFlag />
      </RootLayout>,
    );
    expect(
      await screen.findByText("Send to Google Drive isn't set up yet."),
    ).toBeInTheDocument();
    // The address is clean, and Next's copy of it too.
    expect(window.location.search).toBe("");
    expect(next.href).toBe("/account");
  });

  it.each([
    ["connected", "success", "Google Drive is connected."],
    [
      "switched",
      "success",
      "A send to your other Google account stopped when you connected this one.",
    ],
    ["declined", "warning", "You chose not to allow it at Google."],
    [
      "needs_permission",
      "warning",
      "Tick the box that lets Partyreel add files.",
    ],
    ["failed", "warning", "Couldn't connect Google Drive."],
  ])("says %s as a %s toast, with its words", async (word, type, words) => {
    next.land(`/account?drive=${word}`);
    render(
      <RootLayout>
        <DriveFlag />
      </RootLayout>,
    );
    expect(await screen.findByText(words)).toBeInTheDocument();
    expect(toasts()).toEqual([
      expect.objectContaining({ type, text: expect.stringContaining(words) }),
    ]);
  });

  it("★ says it once when React runs the effect twice (Strict Mode, as under `next dev`): the beat is not cancelled with the effect", async () => {
    next.land("/account?drive=connected");
    render(
      <StrictMode>
        <RootLayout>
          <DriveFlag />
        </RootLayout>
      </StrictMode>,
    );
    expect(
      await screen.findByText("Google Drive is connected."),
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(toasts()).toHaveLength(1);
  });

  it("says it for a host who already has the hint too, once", async () => {
    document.cookie = "pr_drive=1; path=/";
    next.land("/account?drive=declined");
    render(
      <RootLayout>
        <DriveFlag />
      </RootLayout>,
    );
    expect(
      await screen.findByText("You chose not to allow it at Google."),
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(toasts()).toHaveLength(1);
  });

  it("says nothing where Google sent no word, and leaves the address alone", async () => {
    next.land("/account?keep=1");
    render(
      <RootLayout>
        <DriveFlag />
      </RootLayout>,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(toasts()).toEqual([]);
    expect(window.location.search).toBe("?keep=1");
  });
});

describe("a send waiting in this tab", () => {
  it("leaves the word to the place that owns it, on its own page", async () => {
    rememberIntent({
      source: "panel",
      events: [ALBUM],
      includeHidden: false,
      path: `/dashboard/${ALBUM}`,
    });
    next.land(`/dashboard/${ALBUM}?drive=connected`);
    render(
      <RootLayout>
        <DriveFlag />
      </RootLayout>,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(toasts()).toEqual([]);
    // Untouched: the panel's own effect takes the word and the intent, in place, with the final press.
    expect(window.location.search).toBe("?drive=connected");
    expect(sessionStorage.getItem(DRIVE_INTENT_KEY)).not.toBeNull();
  });

  it("★ never lets a stale one for another page swallow a Connect from Account: nobody on this page would take its word", async () => {
    rememberIntent({
      source: "panel",
      events: [ALBUM],
      includeHidden: false,
      path: `/dashboard/${ALBUM}`,
    });
    next.land("/account?drive=connected");
    render(
      <RootLayout>
        <DriveFlag />
      </RootLayout>,
    );
    expect(
      await screen.findByText("Google Drive is connected."),
    ).toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("keeps meaning what it always meant for an intent an older page wrote, which names no page", async () => {
    sessionStorage.setItem(
      DRIVE_INTENT_KEY,
      JSON.stringify({
        v: 1,
        source: "picker",
        events: [ALBUM],
        includeHidden: false,
        at: Date.now(),
      }),
    );
    next.land("/dashboard?drive=connected");
    render(
      <RootLayout>
        <DriveFlag />
      </RootLayout>,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(toasts()).toEqual([]);
    expect(window.location.search).toBe("?drive=connected");
  });
});
