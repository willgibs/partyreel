"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import {
  WELCOME_COOKIE_MAX_AGE,
  WELCOME_COOKIE_PREFIX,
  welcomeCookieName,
} from "@/lib/guest/use-welcome-seen-cookie";

/**
 * THE WELCOME, ONCE PER PERSON AT AN ALBUM, AND THE SERVER KNOWS IT (door-reveal).
 *
 * ★ A COOKIE, SO THE FIRST BYTE IS THE DOOR. The flag lived in localStorage, which a server render cannot
 * read: the page drew the album for everyone and the welcome rose over it after hydration, 1 to 3 s of
 * album before the door (Will's live walk, his "big bug"). The flag is the `pr_welcome_<qr>` cookie now
 * (`use-welcome-seen-cookie.ts`), so the page draws the welcome itself for a newcomer, and the album at once
 * for a returning guest. The page's word is this hook's server snapshot, so the hydration draws exactly what
 * the server did.
 *
 * Same-tab subscribers hear every write (a cookie fires no `storage` event): a module listener set and an
 * `emit()`, the shape of save-account-prompt's useDismissed and use-stored-session.
 */
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

function readWelcome(qrToken: string): boolean {
  try {
    const seen = `${welcomeCookieName(qrToken)}=1`;
    return document.cookie.split(";").some((part) => part.trim() === seen);
  } catch {
    return false;
  }
}

function writeCookie(name: string, value: string, maxAge: number) {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  } catch {
    // Cookies refused (a locked-down browser): the welcome shows once more, which is all it costs.
  }
}

/** Every welcome cookie this page can see (path `/`, so every page sees them all). */
function welcomeCookieNames(): string[] {
  try {
    return document.cookie
      .split(";")
      .map((part) => part.trim().split("=")[0] ?? "")
      .filter((name) => name.startsWith(WELCOME_COOKIE_PREFIX));
  } catch {
    return [];
  }
}

/**
 * The welcome, marked seen on this device: her Continue (`useWelcomeSeen`'s `markSeen`), and the invite
 * list's shut door, where a newcomer the list does not name meets the event and asks (build 23's NIT-1): her
 * ask refreshes the page onto the held door, and the invitation in front of it would be one more step for a
 * door she has already stood at and knocked on. Every same-tab reader hears it at once.
 */
export function markWelcomeSeen(qrToken: string): void {
  writeCookie(welcomeCookieName(qrToken), "1", WELCOME_COOKIE_MAX_AGE);
  emit();
}

/**
 * ★ THE WELCOME GOES WITH ITS TICKET (crumbs-43; ROADMAP: "the next person on a shared phone skips the welcome,
 * and with it the legal consent line (`pr_welcome_<qr>` survives every sign-out and the ticket drop)"). The welcome
 * carries the consent line every guest passes once (the door's identify and sign-in steps carry none, leaning on
 * it), so "seen" is a fact about the PERSON the device holds a ticket for, never about the phone. When the device
 * puts that ticket down (`dropGuestTicket`: a ticket that was another person's, or one whose row is gone), the
 * album's welcome goes with it; when it puts every ticket down (`forgetGuestTickets`: every sign-out, the door's
 * "Use a different email"), every album's does. So the next person to join on a shared phone meets the welcome,
 * and its consent line, once. Every same-tab reader hears it at once; a door already showing its steps only gains
 * the welcome in front of them.
 */
export function forgetWelcome(qrToken: string): void {
  writeCookie(welcomeCookieName(qrToken), "", 0);
  emit();
}

/** Every album's welcome on the device (`forgetWelcome`'s note): the sign-out's half. */
export function forgetAllWelcomes(): void {
  for (const name of welcomeCookieNames()) writeCookie(name, "", 0);
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * `[seen, markSeen]` for the welcome step. The server snapshot is the PAGE'S WORD (`serverSeen`, the cookie
 * as the request carried it), so the hydration draws what the server drew: the welcome for a newcomer, from
 * the first byte, and nothing for a returning guest. `markSeen` writes the flag (once per person per event:
 * it goes with the ticket, `forgetWelcome`) and notifies same-tab subscribers.
 *
 * ★ THE DEMO NEVER PERSISTS "SEEN" ACROSS VISITS, BUT STILL ADVANCES WITHIN ONE: a demo treats every
 * visit as a fresh one, even a returning one, so every demo runs end to end. `isDemo` is a plain
 * boolean, never an `isDemoToken` import here: this module stays a dependency-free cookie
 * wrapper (unit-testable with no env/`server-only` chain), same reasoning as `entry-steps.ts`'s own
 * note about `entry-modal.tsx`.
 *
 * The demo's `seen` must not simply be permanently false, which would break the demo ITSELF:
 * `markSeen()` (Continue on the role step) would never advance the itinerary past "welcome",
 * because `computeDoor` re-adds the step every time `!welcomeSeen`. What "fresh every visit" needs
 * is EPHEMERAL, per-mount state for the demo — Continue still moves this visit forward exactly
 * once, nothing is ever written, and a fresh mount (a reload, a second tab, the next visitor) starts
 * this state at `false` again regardless of any earlier visit's own history.
 */
export function useWelcomeSeen(
  qrToken: string,
  isDemo: boolean,
  /** The page's word: whether the request carried this album's welcome cookie. */
  serverSeen = false,
): [boolean, () => void] {
  const persistedSeen = useSyncExternalStore(
    subscribe,
    () => readWelcome(qrToken),
    () => serverSeen,
  );
  // Always called (Rules of Hooks) even for a non-demo mount, where it simply goes unread below.
  const [demoSeen, setDemoSeen] = useState(false);
  const seen = isDemo ? demoSeen : persistedSeen;

  const markSeen = useCallback(() => {
    if (isDemo) {
      setDemoSeen(true);
      return;
    }
    markWelcomeSeen(qrToken);
  }, [qrToken, isDemo]);

  return [seen, markSeen];
}
