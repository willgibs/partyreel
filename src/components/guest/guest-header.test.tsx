/**
 * The one part of the demo's framing that is a FUNCTION rather than a look: the
 * Demo mark's PRESENCE, on every guest screen of the demo, on the one header
 * every such screen shares.
 * The pin stops there — the header pinning itself to the top under it is a
 * layout treatment (verified live, `testing-verification.md`'s blind spot),
 * never a class name this file should freeze.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

/* The name menu's door, reduced to the one act it hands back (`onVerified`),
   so the pin is what the MENU does with a confirmation. The door's own
   machinery is its own contract (account-door.test.tsx). */
vi.mock("@/components/auth/account-door", () => ({
  DOOR_WEAR: {
    keep: { heading: "Keep your photos", reason: "Confirm it." },
    signin: { heading: "Log in", reason: "Log in." },
  },
  AccountDoor: ({ onVerified }: { onVerified: () => Promise<void> }) => (
    <button type="button" onClick={() => void onVerified()}>
      Finish confirming
    </button>
  ),
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn(async () => null),
}));
/* The device's session, as the client reads it: a test says who is signed in (`device.session`) and what
   the SDK announces (`device.announce`). Signed out by default: the CTA renders, never the account menu
   — the Demo mark pin below must hold on the CTA branch, which every anonymous demo visitor (the
   overwhelming majority) actually sees. */
type DeviceSession = { user: { id: string; email: string } } | null;
const device = vi.hoisted(() => ({
  session: null as DeviceSession,
  listeners: new Set<(event: string, session: DeviceSession) => void>(),
  announce(event: string) {
    for (const listener of device.listeners) listener(event, device.session);
  },
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn(async () => ({ data: { session: device.session } })),
      onAuthStateChange: (
        listener: (event: string, session: DeviceSession) => void,
      ) => {
        device.listeners.add(listener);
        return {
          data: {
            subscription: {
              unsubscribe: () => device.listeners.delete(listener),
            },
          },
        };
      },
      signOut: vi.fn(),
    },
  }),
}));

import { GuestHeader } from "@/components/guest/guest-header";
import { setStoredName } from "@/lib/guest/use-stored-name";

describe("GuestHeader: the Demo mark", () => {
  it("never appears for a real event", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    expect(screen.queryByText("Demo")).not.toBeInTheDocument();
  });

  it("appears beside the wordmark for the demo", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" isDemo />);
    expect(screen.getByText("Demo")).toBeInTheDocument();
  });

  it("the event-less profile header (/u/[slug]) stays plain (isDemo defaults false)", () => {
    render(<GuestHeader />);
    expect(screen.queryByText("Demo")).not.toBeInTheDocument();
  });
});

/**
 * THE HEADER'S THIRD STATE.
 *
 * The header knows a stranger and an account holder. The commonest person at a
 * name-only party is neither, and what is pinned is that the header KNOWS them
 * (their name, marked) and offers the three moves that are actually theirs.
 * Which icons, which order and the words of the door are precedent.
 */
describe("GuestHeader: a guest with a name and no account", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("wears the stranger's CTA until this device has typed a name", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    expect(screen.getByRole("link", { name: /start for free/i })).toBeVisible();
  });

  /** Open the name menu; the trigger only appears once a name is stored. */
  async function openMenu() {
    const trigger = await screen.findByRole("button", {
      name: /your name on this album/i,
    });
    fireEvent.pointerDown(trigger, { ctrlKey: false, button: 0 });
    return trigger;
  }

  it("names them, marks the name, and offers the three moves", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await openMenu();
    expect(screen.queryByRole("link", { name: /start for free/i })).toBeNull();
    // The PUBLIC word, read from the mark itself so the two cannot drift.
    await waitFor(() => expect(screen.getByText("Unverified")).toBeVisible());
    // "Log in", the door chooser's word (door-flow), where the row once said "Sign in".
    for (const row of [/confirm your email/i, /change name/i, /^log in$/i]) {
      expect(screen.getByRole("menuitem", { name: row })).toBeInTheDocument();
    }
  });

  /* ────────────────────────────────────────────────────────────────────────
     THE TWO STATES OF A GUEST'S OWN MENU. Publicly every unconfirmed guest is
     one thing; here, and ONLY here, they are told whether the address they
     typed is still unconfirmed. The pins are the two labels and the two rows,
     both derived from one device flag and never from an address, because no
     address is ever stored.
     ──────────────────────────────────────────────────────────────────────── */
  it("with no address: 'Unverified', and the row offers to ADD one", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    localStorage.setItem("pr_session_tok-1", "sess-1");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await openMenu();
    await waitFor(() => expect(screen.getByText("Unverified")).toBeVisible());
    expect(
      screen.getByRole("menuitem", { name: /add your email/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /confirm your email/i }),
    ).toBeNull();
  });

  it("with one attached: 'Email not confirmed', and the row offers to CONFIRM it", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    localStorage.setItem("pr_session_tok-1", "sess-1");
    localStorage.setItem("pr_guest_email_attached_tok-1", "1");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await openMenu();
    await waitFor(() =>
      expect(screen.getByText("Email not confirmed")).toBeVisible(),
    );
    expect(
      screen.getByRole("menuitem", { name: /confirm your email/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /add your email/i }),
    ).toBeNull();
    // ...and the public word is absent here, because this menu knows something
    // the album deliberately does not.
    expect(screen.queryByText("Unverified")).toBeNull();
  });

  it("never offers 'Add your email' without a row to put one on", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await openMenu();
    await waitFor(() => expect(screen.getByText("Unverified")).toBeVisible());
    expect(
      screen.queryByRole("menuitem", { name: /add your email/i }),
    ).toBeNull();
  });

  it("never claims a name on a page with no event behind it (/u/[slug])", () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader />);
    expect(screen.getByRole("link", { name: /start for free/i })).toBeVisible();
  });
});

/**
 * CONFIRMING FROM THE MENU CLAIMS, AND LEAVES THE WAY BACK. The email row is
 * the offer card's act in its words: the uploads claimed, and with them the
 * event; there is no save step. Every door here (the email row, and Log in,
 * whose claim carries the same photographs) writes the album's return marker
 * BEFORE it opens, because Google and a magic link leave the page and the
 * album's own claim on the way back is what plays the follow moment.
 */
describe("GuestNameMenu: every door claims, and leaves the way back", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  async function openDoor(row: RegExp) {
    const trigger = await screen.findByRole("button", {
      name: /your name on this album/i,
    });
    fireEvent.pointerDown(trigger, { ctrlKey: false, button: 0 });
    fireEvent.click(await screen.findByRole("menuitem", { name: row }));
    return screen.findByRole("button", { name: "Finish confirming" });
  }

  it("Confirm your email: the marker first, then the claim, then the refresh", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    const finish = await openDoor(/confirm your email/i);
    expect(localStorage.getItem("pr_pending_offer_tok-1")).toBe("1");
    fireEvent.click(finish);
    await waitFor(() => expect(claimAnonymousUploads).toHaveBeenCalled());
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("Log in: the same marker and the same claim", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    const finish = await openDoor(/^log in$/i);
    expect(localStorage.getItem("pr_pending_offer_tok-1")).toBe("1");
    fireEvent.click(finish);
    await waitFor(() => expect(claimAnonymousUploads).toHaveBeenCalled());
  });
});

/**
 * ★ THE HEADER FOLLOWS WHO THE DEVICE HOLDS (crumbs-35, build 34's red-team). It read the session once, on mount, so a
 * page rendered signed in kept her account's avatar and menu after the session ended in another tab, through the
 * door that then asked her name, until a reload; and the account that signed in under it (the confirm door's code,
 * in this very tab) never replaced the name beside it. The page's refresh does not re-run a client island, so the
 * header watches what can change who is here: the SDK's own announcements, the session cookie another tab or a
 * response sets, the tab being looked at again, and the door settling on a guest (a name or ticket written). A look
 * is LOCAL (the client's own read of the cookie, no request); only a change of account, or the door settling on a
 * guest while an account still stands, asks the server, whose 401 is the answer to "is she still signed in".
 */
describe("GuestHeader: it follows the viewer the device holds", () => {
  const ME = { user: { id: "u-1", email: "partyr33l@example.com" } };
  const DANA = { user: { id: "u-2", email: "dana@example.com" } };

  /** `/api/me/menu`, answered as the server would for whoever the device holds (`status` says otherwise). */
  function serveMenu(status = 200) {
    global.fetch = vi.fn(async () => ({
      ok: status === 200,
      status,
      json: async () => ({
        ok: true,
        email: device.session?.user.email ?? null,
        displayName: null,
        avatarUrl: null,
        seed: null,
        ownsThisEvent: false,
      }),
    })) as unknown as typeof fetch;
  }
  const menuAsks = () => vi.mocked(global.fetch).mock.calls.length;
  const account = () => screen.queryByRole("button", { name: "Account menu" });
  const cta = () => screen.queryByRole("link", { name: /start for free/i });

  async function signedInHeader() {
    device.session = ME;
    serveMenu();
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await screen.findByRole("button", { name: "Account menu" });
    await waitFor(() => expect(menuAsks()).toBe(1));
  }

  beforeEach(() => {
    localStorage.clear();
    device.session = null;
    device.listeners.clear();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });
  afterEach(() => {
    Reflect.deleteProperty(window, "cookieStore");
  });

  it("★ drops the account when its session ended in another tab, as soon as this tab is looked at again", async () => {
    await signedInHeader();
    device.session = null; // the other tab's sign-out cleared the cookie
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await waitFor(() => expect(account()).toBeNull());
    expect(cta()).toBeVisible();
  });

  it("★ drops it on the window's focus, the other way a tab is looked at again", async () => {
    await signedInHeader();
    device.session = null;
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() => expect(account()).toBeNull());
  });

  it("★ drops it the moment the session cookie changes, in a tab nobody is looking at", async () => {
    // The Cookie Store API reaches a hidden tab too: the one signal that does when a response (the app's
    // Sign out) cleared the cookie in another tab, where the SDK announces nothing.
    const cookies = new EventTarget();
    Object.defineProperty(window, "cookieStore", {
      configurable: true,
      value: cookies,
    });
    await signedInHeader();
    device.session = null;
    act(() => {
      cookies.dispatchEvent(new Event("change"));
    });
    await waitFor(() => expect(account()).toBeNull());
    expect(cta()).toBeVisible();
  });

  it("★ drops it when the SDK announces a sign-out (this browser's other tab signed out through the client)", async () => {
    await signedInHeader();
    device.session = null;
    act(() => device.announce("SIGNED_OUT"));
    await waitFor(() => expect(account()).toBeNull());
    expect(cta()).toBeVisible();
  });

  it("★ shows the account that signs in under it, with no reload (the confirm door's code, in this tab)", async () => {
    serveMenu();
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    expect(
      await screen.findByRole("link", { name: /start for free/i }),
    ).toBeVisible();
    device.session = ME;
    act(() => device.announce("SIGNED_IN"));
    expect(
      await screen.findByRole("button", { name: "Account menu" }),
    ).toBeVisible();
    expect(cta()).toBeNull();
  });

  it("★ a look at the same account asks the server nothing", async () => {
    await signedInHeader();
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
      // The SDK re-announces a standing session on every refocus.
      device.announce("SIGNED_IN");
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(menuAsks()).toBe(1);
    expect(account()).not.toBeNull();
  });

  it("★ the door settling on a guest asks the server whether the account still stands (a session ended on another device)", async () => {
    await signedInHeader();
    // The server revoked it; this device's cookie still says signed in, as it does for up to an hour.
    serveMenu(401);
    act(() => setStoredName("tok-1", "Nell"));
    await waitFor(() => expect(account()).toBeNull());
    // The name menu is hers now (the third state), not the stranger's CTA.
    expect(
      await screen.findByRole("button", { name: /your name on this album/i }),
    ).toBeVisible();
  });

  it("a server that stumbles never drops an account it did not refuse", async () => {
    device.session = ME;
    serveMenu(500);
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await screen.findByRole("button", { name: "Account menu" });
    await waitFor(() => expect(menuAsks()).toBe(1));
    // ...nor on a later ask while it still stumbles.
    act(() => setStoredName("tok-1", "Nell"));
    await waitFor(() => expect(menuAsks()).toBe(2));
    expect(account()).not.toBeNull();
  });

  it("★ another account signing in under it replaces the first at once", async () => {
    await signedInHeader();
    device.session = DANA;
    act(() => device.announce("SIGNED_IN"));
    await waitFor(() => expect(menuAsks()).toBe(2));
    fireEvent.pointerDown(
      await screen.findByRole("button", { name: "Account menu" }),
      {
        ctrlKey: false,
        button: 0,
      },
    );
    expect(await screen.findByText("dana@example.com")).toBeVisible();
    expect(screen.queryByText("partyr33l@example.com")).toBeNull();
  });

  it("stops listening when the header leaves the page", async () => {
    const cookies = new EventTarget();
    const off = vi.spyOn(cookies, "removeEventListener");
    Object.defineProperty(window, "cookieStore", {
      configurable: true,
      value: cookies,
    });
    device.session = ME;
    serveMenu();
    const { unmount } = render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    await screen.findByRole("button", { name: "Account menu" });
    expect(device.listeners.size).toBe(1);
    unmount();
    expect(device.listeners.size).toBe(0);
    expect(off).toHaveBeenCalled();
  });
});
