/**
 * Pins for the welcome-seen flag: once per PERSON per event for an ordinary guest (once per device until the
 * device puts that album's ticket down, crumbs-43), NEVER for the demo, which treats every visit as a fresh
 * one, even a returning one, so every demo runs end to end.
 *
 * ★ RESHAPED ON PURPOSE (door-reveal): the flag was a localStorage key, which no server render can read, so the
 * page drew the album for every visitor and the welcome rose over it after hydration (Will's live walk, "full
 * guest album was visible before gate appeared over it (big bug)"). It is the `pr_welcome_<qr>` cookie now, the
 * page's server reads it to draw the door first, and these pins read the cookie where they read the key; the
 * legacy key is still put down with its ticket.
 */
import { renderToString } from "react-dom/server";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { markWelcomeSeen, useWelcomeSeen } from "@/lib/guest/use-welcome-seen";
import {
  welcomeCookieName,
  welcomeSeenIn,
} from "@/lib/guest/use-welcome-seen-cookie";
import {
  dropGuestTicket,
  forgetGuestTickets,
} from "@/lib/guest/use-stored-session";

const QR = "welcome-seen-qr-1";

/** Whether this album's welcome cookie is set on the document. */
function cookieSet(qr: string): boolean {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .includes(`${welcomeCookieName(qr)}=1`);
}

function clearCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.trim().split("=")[0];
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  }
}

beforeEach(() => {
  localStorage.clear();
  clearCookies();
});

describe("useWelcomeSeen: an ordinary guest", () => {
  it("starts unseen, and markSeen sets the cookie the page's server reads", () => {
    const { result } = renderHook(() => useWelcomeSeen(QR, false));
    expect(result.current[0]).toBe(false);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    expect(cookieSet(QR)).toBe(true);
    // The server's own reading of the same cookie (`page.tsx`), off a request's store.
    const store = new Map(
      document.cookie.split(";").map((part) => {
        const [name, value] = part.trim().split("=");
        return [name, { value }] as const;
      }),
    );
    expect(welcomeSeenIn(store, QR)).toBe(true);
    expect(welcomeSeenIn(store, "another-album")).toBe(false);
  });

  it("a fresh hook instance reads a flag an earlier visit already wrote", () => {
    markWelcomeSeen(QR);
    const { result } = renderHook(() => useWelcomeSeen(QR, false));
    expect(result.current[0]).toBe(true);
  });

  it("★ the server draws what the page said (the door is the first byte), whatever the browser holds", () => {
    function Probe({ serverSeen }: { serverSeen: boolean }) {
      const [seen] = useWelcomeSeen(QR, false, serverSeen);
      return <p>{seen ? "seen" : "welcome"}</p>;
    }
    // A server render reads the page's word, never the document: either way round.
    markWelcomeSeen(QR);
    expect(renderToString(<Probe serverSeen={false} />)).toContain("welcome");
    expect(renderToString(<Probe serverSeen />)).toContain("seen");
  });

  it("the old localStorage flag means nothing now: only the cookie the server can read", () => {
    localStorage.setItem(`pr_welcome_${QR}`, "1");
    const { result } = renderHook(() => useWelcomeSeen(QR, false));
    expect(result.current[0]).toBe(false);
  });
});

/*
 * ★ THE NEXT PERSON ON A SHARED PHONE MEETS IT (crumbs-43; ROADMAP: "the next person on a shared phone skips the
 * welcome, and with it the legal consent line (`pr_welcome_<qr>` survives every sign-out and the ticket drop)").
 * The welcome carries the consent line the door's identify and sign-in steps lean on, so it goes with the ticket
 * of the person who saw it, and a door already mounted hears it at once.
 */
describe("useWelcomeSeen: it goes with the ticket", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
  });

  it("a sign-out on the device brings every album's welcome back, for whoever holds the phone next", () => {
    localStorage.setItem(`pr_session_${QR}`, "a".repeat(64));
    localStorage.setItem(`pr_welcome_${QR}`, "1");
    markWelcomeSeen("welcome-seen-qr-2");
    const { result } = renderHook(() => useWelcomeSeen(QR, false));
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);

    act(() => forgetGuestTickets());
    expect(result.current[0]).toBe(false);
    expect(cookieSet(QR)).toBe(false);
    expect(cookieSet("welcome-seen-qr-2")).toBe(false);
    // The legacy key goes with it.
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBeNull();
  });

  it("a ticket put down as someone else's takes its album's welcome, and leaves another album's", async () => {
    const other = "welcome-seen-qr-3";
    localStorage.setItem(`pr_session_${QR}`, "a".repeat(64));
    markWelcomeSeen(other);
    const { result } = renderHook(() => useWelcomeSeen(QR, false));
    act(() => result.current[1]());

    await act(() => dropGuestTicket(QR));
    expect(result.current[0]).toBe(false);
    expect(cookieSet(QR)).toBe(false);
    expect(cookieSet(other)).toBe(true);
  });
});

describe("useWelcomeSeen: the demo is never seen", () => {
  it("reads unseen even when this device's flag is already set", () => {
    markWelcomeSeen(QR);
    const { result } = renderHook(() => useWelcomeSeen(QR, true));
    expect(result.current[0]).toBe(false);
  });

  it("markSeen still advances THIS visit (ephemeral), but persists nothing for the next one", () => {
    // A `seen` that stayed false for the whole visit would break the demo itself: Continue would
    // never advance the itinerary past "welcome", because computeDoor would keep re-adding the
    // step. So this MOUNT still moves forward once markSeen fires, and nothing about it is ever
    // written.
    const { result } = renderHook(() => useWelcomeSeen(QR, true));
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    expect(cookieSet(QR)).toBe(false);

    // A brand new mount - the next visitor, a reload, a shared link - starts over regardless.
    const again = renderHook(() => useWelcomeSeen(QR, true));
    expect(again.result.current[0]).toBe(false);
  });

  it("never taints an ordinary (non-demo) event's own flag under the same key shape", () => {
    // Two different qr_tokens, one demo and one not - the demo's own no-write guarantee is
    // per-flag already (the key is qrToken-scoped), pinned here so a future demo qrToken reuse
    // could never read as "the demo made this event's welcome seen" and vice versa.
    const other = "other-event-qr-2";
    const demo = renderHook(() => useWelcomeSeen(QR, true));
    act(() => demo.result.current[1]());
    const real = renderHook(() => useWelcomeSeen(other, false));
    act(() => real.result.current[1]());
    expect(cookieSet(QR)).toBe(false);
    expect(cookieSet(other)).toBe(true);
  });
});
