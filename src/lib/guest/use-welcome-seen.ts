"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import { storedKeysWithPrefixes } from "@/lib/guest/session-tokens";

// The entry modal's welcome, once per person at an event. Distinct prefix so collectStoredSessionTokens
// (pr_session_) never picks it up; no collision with pr_save_prompt_ / pr_pending_like_ either.
const WELCOME_PREFIX = "pr_welcome_";

function welcomeKey(qrToken: string) {
  return `${WELCOME_PREFIX}${qrToken}`;
}

// Same-tab subscribers — the native `storage` event only fires in OTHER tabs. Mirrors
// save-account-prompt's useDismissed + use-stored-session: a module listener set + an emit() on write.
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

/**
 * The welcome, marked seen on this device from outside the door: the invite list's shut door, where a
 * newcomer the list does not name meets the event and asks (build 23's NIT-1). Her ask refreshes the page
 * onto the held door, and the invitation's welcome in front of it would be one more step for a door she
 * has already stood at and knocked on. Every same-tab reader hears it at once, as `markSeen` does.
 */
export function markWelcomeSeen(qrToken: string): void {
  try {
    localStorage.setItem(welcomeKey(qrToken), "1");
  } catch {
    // Storage refused (a private window): the welcome shows once more, which is all it costs.
    return;
  }
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
 * and its consent line, once. Every same-tab reader hears it at once, as `markSeen` does; a door already showing
 * its steps only gains the welcome in front of them.
 */
export function forgetWelcome(qrToken: string): void {
  try {
    localStorage.removeItem(welcomeKey(qrToken));
  } catch {
    // Storage refused: there was no flag to forget.
  }
  emit();
}

/** Every album's welcome on the device (`forgetWelcome`'s note): the sign-out's half. */
export function forgetAllWelcomes(): void {
  try {
    for (const key of storedKeysWithPrefixes([WELCOME_PREFIX])) {
      localStorage.removeItem(key);
    }
  } catch {
    // Storage refused: there were no flags to forget.
  }
  emit();
}

/**
 * `[seen, markSeen]` for the welcome step. The server snapshot is `true` (assume seen) so the welcome
 * never flashes before hydration; it resolves to the real localStorage value on the client. `markSeen`
 * persists the flag (once per person per event: it goes with the ticket, `forgetWelcome`) and notifies same-tab
 * subscribers.
 *
 * ★ THE DEMO NEVER PERSISTS "SEEN" ACROSS VISITS, BUT STILL ADVANCES WITHIN ONE: a demo treats every
 * visit as a fresh one, even a returning one, so every demo runs end to end. `isDemo` is a plain
 * boolean, never an `isDemoToken` import here: this module stays a dependency-free localStorage
 * wrapper (unit-testable with no env/`server-only` chain), same reasoning as `entry-steps.ts`'s own
 * note about `entry-modal.tsx`.
 *
 * The demo's `seen` must not simply be permanently false, which would break the demo ITSELF:
 * `markSeen()` (Continue on the role step) would never advance the itinerary past "welcome",
 * because `computeDoor` re-adds the step every time `!welcomeSeen`. What "fresh every visit" needs
 * is EPHEMERAL, per-mount state for the demo — Continue still moves this visit forward exactly
 * once, nothing is ever written to `localStorage`, and a fresh mount (a reload, a second tab, the
 * next visitor) starts this state at `false` again regardless of any earlier visit's own history.
 */
export function useWelcomeSeen(
  qrToken: string,
  isDemo: boolean,
): [boolean, () => void] {
  const key = welcomeKey(qrToken);

  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);

  const persistedSeen = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) === "1",
    () => true,
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
