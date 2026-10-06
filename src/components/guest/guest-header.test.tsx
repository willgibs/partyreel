/**
 * The one part of the demo's framing that is a FUNCTION rather than a look: the
 * Demo mark's PRESENCE, on every guest screen of the demo, on the one header
 * every such screen shares.
 * The pin stops there — the header pinning itself to the top under it is a
 * layout treatment (verified live, `testing-verification.md`'s blind spot),
 * never a class name this file should freeze.
 */
import type { ComponentProps, ReactNode, Ref } from "react";

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
/* `next/link` runs no prefetch in jsdom, so what is held is what the header ASKS of it: an anchor that says it
   (`data-prefetch`, as the chrome link's own test stands it in). */
vi.mock("next/link", () => ({
  useLinkStatus: () => ({ pending: false }),
  default: ({
    prefetch,
    href,
    children,
    ref,
    ...rest
  }: Omit<ComponentProps<"a">, "href"> & {
    prefetch?: boolean | null;
    href: string;
    children?: ReactNode;
    ref?: Ref<HTMLAnchorElement>;
  }) => (
    <a ref={ref} href={href} data-prefetch={String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}));

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
import { publishCoverUnderHeader } from "@/components/guest/guest-header-cover";
import { setStoredName } from "@/lib/guest/use-stored-name";

describe("GuestHeader: the way home", () => {
  /** The two doors to the marketing home the header draws: the wordmark, and Start for free. */
  const homeLinks = () =>
    screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/");
  const prefetchOf = (link: HTMLElement) => link.getAttribute("data-prefetch");

  it("★ a real album's visitor never fetches the marketing home: not on sight, not on a hover (compute-levers)", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    const links = homeLinks();
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(prefetchOf(link)).toBe("false");
      fireEvent.pointerEnter(link);
      fireEvent.focus(link);
      expect(prefetchOf(link)).toBe("false");
    }
  });

  /**
   * ★ THE DEMO FETCHES THE HOME ON INTENT, NEVER ON SIGHT (compute-reads). Its visitor is a prospective host, so a
   * pointer or a finger on the wordmark takes `next/link`'s own prefetch before the press; but the wordmark is in view
   * from the first paint, and a prefetch on sight fetched the home's payload and preloaded its three sheets into a page
   * that draws none of them ("preloaded but not used", about 17 KB a load: `chrome-link.tsx`).
   */
  it("★ the demo's two doors fetch the home on intent, never on sight", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" isDemo />);
    const links = homeLinks();
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(prefetchOf(link)).toBe("false");
      fireEvent.pointerEnter(link);
      expect(prefetchOf(link)).toBe("undefined");
    }
  });

  it("★ and for the keyboard, when focus lands", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" isDemo />);
    for (const link of homeLinks()) {
      expect(prefetchOf(link)).toBe("false");
      fireEvent.focus(link);
      expect(prefetchOf(link)).toBe("undefined");
    }
  });
});

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

  /* ★ HER OWN COLOUR (small-fixes, "the name-only guest's hashvatar"): the disc beside her own name wears the colour
     every other surface gives her, the hash of her own guest row, which only the server can make (her browser holds
     her ticket and never the row's id). One ask a ticket, a courtesy that never gates anything. */
  describe("her own colour", () => {
    const realFetch = global.fetch;
    afterEach(() => {
      global.fetch = realFetch;
    });
    const seedOf = () =>
      document.querySelector("[data-slot='avatar']") as HTMLElement | null;

    it("asks the server for it once, by her ticket, and her disc wears it", async () => {
      localStorage.setItem("pr_guest_name_tok-1", "Sam");
      localStorage.setItem("pr_session_tok-1", "sess-1");
      global.fetch = vi.fn(
        async () =>
          new Response(JSON.stringify({ ok: true, seed: "f".repeat(64) })),
      ) as unknown as typeof fetch;
      const { rerender } = render(
        <GuestHeader qrToken="tok-1" eventId="evt-1" />,
      );
      await waitFor(() =>
        expect(seedOf()?.style.backgroundBlendMode).not.toBe(""),
      );
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, init] = vi.mocked(global.fetch).mock.calls[0];
      expect(url).toBe("/api/guests/mine");
      expect(JSON.parse(String((init as RequestInit).body))).toEqual({
        qr_token: "tok-1",
        session_token: "sess-1",
        seed: true,
      });
      // Not asked again for the same ticket, however the page re-renders.
      rerender(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("★ asks nothing without a ticket: no row to colour yet, the plain disc", async () => {
      localStorage.setItem("pr_guest_name_tok-1", "Sam");
      global.fetch = vi.fn() as unknown as typeof fetch;
      render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
      await screen.findByRole("button", { name: /your name on this album/i });
      expect(global.fetch).not.toHaveBeenCalled();
      expect(seedOf()?.style.backgroundBlendMode).toBe("");
    });

    it("a colour the server could not give leaves the plain disc, and a failed ask is made again next time", async () => {
      localStorage.setItem("pr_guest_name_tok-1", "Sam");
      localStorage.setItem("pr_session_tok-1", "sess-1");
      global.fetch = vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }) as unknown as typeof fetch;
      const first = render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
      await screen.findByRole("button", { name: /your name on this album/i });
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
      expect(seedOf()?.style.backgroundBlendMode).toBe("");
      first.unmount();

      global.fetch = vi.fn(
        async () =>
          new Response(JSON.stringify({ ok: true, seed: "e".repeat(64) })),
      ) as unknown as typeof fetch;
      render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
      await waitFor(() =>
        expect(seedOf()?.style.backgroundBlendMode).not.toBe(""),
      );
    });

    /* ★ RED-TEAM 53's NIT (crumbs-65): "her header's disc flashes uncoloured on every load". The server's answer is a
       pure function of her guest row, so it is KEPT per ticket and a later load paints it at once; a first load,
       which has to ask, holds its disc back and fades it in coloured, never plain-then-coloured. */
    const discOf = () => document.querySelector("[data-disc]") as HTMLElement;

    it("★ remembers her colour per ticket: a later load paints it at once, with no ask, and keeps no ticket beside it", async () => {
      localStorage.setItem("pr_guest_name_tok-1", "Sam");
      localStorage.setItem("pr_session_tok-1", "sess-1");
      global.fetch = vi.fn(
        async () =>
          new Response(JSON.stringify({ ok: true, seed: "f".repeat(64) })),
      ) as unknown as typeof fetch;
      const first = render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
      await waitFor(() =>
        expect(seedOf()?.style.backgroundBlendMode).not.toBe(""),
      );
      first.unmount();
      // Kept, bound to the ticket by a hash of it: the ticket itself (a capability) is never written beside it.
      const kept = localStorage.getItem("pr_guest_seed_tok-1") ?? "";
      expect(kept).toMatch(/^[0-9a-z]+\.f{64}$/);
      expect(kept).not.toContain("sess-1");

      // A later load: the colour is in the first commit, and nothing is asked.
      global.fetch = vi.fn() as unknown as typeof fetch;
      render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
      expect(seedOf()?.style.backgroundBlendMode).not.toBe("");
      expect(discOf()).toHaveAttribute("data-disc", "colour");
      await act(async () => {});
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("★ a phone handed to the next guest never wears the last one's colour: a new ticket finds none kept, and asks", async () => {
      localStorage.setItem("pr_guest_name_tok-1", "Sam");
      localStorage.setItem("pr_session_tok-1", "sess-1");
      global.fetch = vi.fn(
        async () =>
          new Response(JSON.stringify({ ok: true, seed: "f".repeat(64) })),
      ) as unknown as typeof fetch;
      const first = render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
      await waitFor(() =>
        expect(seedOf()?.style.backgroundBlendMode).not.toBe(""),
      );
      first.unmount();

      // The next guest: a new ticket for the same album (the old one was put down, the entry left behind).
      localStorage.setItem("pr_guest_name_tok-1", "Dana");
      localStorage.setItem("pr_session_tok-1", "sess-2");
      let answer: (r: Response) => void = () => {};
      global.fetch = vi.fn(
        () => new Promise<Response>((resolve) => (answer = resolve)),
      ) as unknown as typeof fetch;
      render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
      // Her disc is held back and plain under it: never the last guest's colour, not for a frame.
      expect(seedOf()?.style.backgroundBlendMode).toBe("");
      expect(discOf()).toHaveAttribute("data-disc", "waiting");
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
      await act(async () => {
        answer(
          new Response(JSON.stringify({ ok: true, seed: "a".repeat(64) })),
        );
      });
      await waitFor(() =>
        expect(discOf()).toHaveAttribute("data-disc", "colour"),
      );
      expect(localStorage.getItem("pr_guest_seed_tok-1")).toMatch(/\.a{64}$/);
    });

    it("★ a first load holds its disc back until the colour lands, then shows it coloured, never plain first", async () => {
      localStorage.setItem("pr_guest_name_tok-1", "Sam");
      localStorage.setItem("pr_session_tok-1", "sess-1");
      let answer: (r: Response) => void = () => {};
      global.fetch = vi.fn(
        () => new Promise<Response>((resolve) => (answer = resolve)),
      ) as unknown as typeof fetch;
      render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
      await screen.findByRole("button", { name: /your name on this album/i });
      // While the ask is in the air the disc is waiting for its colour, and wears none.
      expect(discOf()).toHaveAttribute("data-disc", "waiting");
      expect(seedOf()?.style.backgroundBlendMode).toBe("");
      await act(async () => {
        answer(
          new Response(JSON.stringify({ ok: true, seed: "c".repeat(64) })),
        );
      });
      await waitFor(() =>
        expect(discOf()).toHaveAttribute("data-disc", "colour"),
      );
      expect(seedOf()?.style.backgroundBlendMode).not.toBe("");
    });

    it("a colour that never lands is a plain disc after a short wait, and one the server has none for is plain at once", async () => {
      localStorage.setItem("pr_guest_name_tok-1", "Sam");
      localStorage.setItem("pr_session_tok-1", "sess-1");
      vi.useFakeTimers();
      try {
        global.fetch = vi.fn(
          () => new Promise<Response>(() => {}),
        ) as unknown as typeof fetch;
        const slow = render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
        await act(async () => {});
        expect(discOf()).toHaveAttribute("data-disc", "waiting");
        await act(async () => {
          vi.advanceTimersByTime(2100);
        });
        expect(discOf()).toHaveAttribute("data-disc", "plain");
        expect(seedOf()?.style.backgroundBlendMode).toBe("");
        slow.unmount();

        // A ticket that names no row: the server says so, and there is nothing to wait for.
        localStorage.setItem("pr_session_tok-1", "sess-9");
        global.fetch = vi.fn(
          async () => new Response(JSON.stringify({ ok: true, seed: null })),
        ) as unknown as typeof fetch;
        render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
        await act(async () => {});
        expect(discOf()).toHaveAttribute("data-disc", "plain");
      } finally {
        vi.useRealTimers();
      }
    });

    it("a null from the server (a ticket that names no row) is the plain disc", async () => {
      localStorage.setItem("pr_guest_name_tok-1", "Sam");
      localStorage.setItem("pr_session_tok-1", "sess-1");
      global.fetch = vi.fn(
        async () => new Response(JSON.stringify({ ok: true, seed: null })),
      ) as unknown as typeof fetch;
      render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
      await screen.findByRole("button", { name: /your name on this album/i });
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
      expect(seedOf()?.style.backgroundBlendMode).toBe("");
    });
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
  /** `/api/me/menu`, answered with the handle (or none) the viewer's profile has, as the server now says it. */
  function serveMenuWithHandle(slug: string | null) {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        email: device.session?.user.email ?? null,
        displayName: "Priya",
        avatarUrl: null,
        seed: null,
        ownsThisEvent: false,
        slug,
      }),
    })) as unknown as typeof fetch;
  }
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

  // ★ HER HANDLE REACHES THE MENU (crumbs-81): the island asks `/api/me/menu` once and hands the menu what it answers,
  // so Your profile goes straight to `/u/<handle>` where she has one, and to `/me` before the answer lands and where
  // she has none (a door that is never a dead link).
  it("★ hands the menu the handle the server answered: Your profile is her page, and /me until then or with none", async () => {
    device.session = ME;
    serveMenuWithHandle("priya");
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    fireEvent.pointerDown(
      await screen.findByRole("button", { name: "Account menu" }),
      { ctrlKey: false, button: 0 },
    );
    await waitFor(() =>
      expect(
        screen.getByRole("menuitem", { name: /your profile/i }),
      ).toHaveAttribute("href", "/u/priya"),
    );
  });

  it("points Your profile at /me for an account the server says has no handle", async () => {
    device.session = ME;
    serveMenuWithHandle(null);
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    fireEvent.pointerDown(
      await screen.findByRole("button", { name: "Account menu" }),
      { ctrlKey: false, button: 0 },
    );
    await waitFor(() => expect(menuAsks()).toBe(1));
    expect(
      await screen.findByRole("menuitem", { name: /your profile/i }),
    ).toHaveAttribute("href", "/me");
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

/**
 * OVER THE COVER IT STANDS ON THE PHOTOGRAPH (`event-header` r1's carried call `header`): the page says a cover is
 * under it, and the album moves that word as the page does (`guest-header-cover.ts`: the door's stage arriving, the
 * demo's pinned bar once the page moves). What is pinned is the hook (`data-surface="photo"`, the room's ink) and who
 * decides, never a colour.
 */
describe("GuestHeader on the album's cover", () => {
  const header = () => document.querySelector("[data-guest-header]")!;

  afterEach(() => {
    act(() => publishCoverUnderHeader(null));
  });

  it("stands on the photograph when the page says a cover is under it, and is paper elsewhere", () => {
    const { rerender } = render(
      <GuestHeader qrToken="tok-1" eventId="evt-1" over />,
    );
    expect(header()).toHaveAttribute("data-surface", "photo");
    expect(header()).toHaveClass("dark");
    rerender(<GuestHeader qrToken="tok-1" eventId="evt-1" />);
    expect(header()).not.toHaveAttribute("data-surface");
    expect(header()).not.toHaveClass("dark");
  });

  it("★ follows the album's word once it has one (the door's stage takes it back to paper), then the page's again", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" over />);
    act(() => publishCoverUnderHeader(false));
    expect(header()).not.toHaveAttribute("data-surface");
    act(() => publishCoverUnderHeader(true));
    expect(header()).toHaveAttribute("data-surface", "photo");
    act(() => publishCoverUnderHeader(null));
    expect(header()).toHaveAttribute("data-surface", "photo");
  });

  it("keeps the Demo mark on the cover too", () => {
    render(<GuestHeader qrToken="tok-1" eventId="evt-1" isDemo over />);
    expect(screen.getByText("Demo")).toBeInTheDocument();
  });
});
