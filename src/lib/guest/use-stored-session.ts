"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  SESSION_PREFIX,
  storedKeysWithPrefixes,
} from "@/lib/guest/session-tokens";
import {
  forgetAllStoredGuests,
  forgetStoredGuest,
} from "@/lib/guest/use-stored-name";

// The session_token is the guest's upload capability (database-security.md). Persist it per
// event (keyed by qr_token) so a returning guest / refresh skips the join step
// instead of creating a duplicate guest. SESSION_PREFIX + the pure token enumeration
// live in ./session-tokens (dependency-free so they stay unit-testable + shared with
// the claim helper).
function sessionKey(qrToken: string) {
  return `${SESSION_PREFIX}${qrToken}`;
}

// Same-tab subscribers — the native `storage` event only fires in OTHER tabs.
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

// Imperative setter usable OUTSIDE the hook — e.g. the guest header island, which is a
// SIBLING of the EventExperience that owns useStoredSession, so it can't reach the hook's
// setter. Writing here + firing the SAME module `emit()` notifies every useStoredSession
// subscriber (the `listeners` Set is a module singleton shared across the client bundle),
// so the header's sign-out clears the very session the upload panel is reading.
// EVERY localStorage touch is guarded. Blocking site data (Safari's "Block All
// Cookies", a locked-down enterprise profile, some private modes) makes the
// localStorage GETTER ITSELF throw a SecurityError, not just its methods.
// Unguarded, that throw lands inside the useSyncExternalStore snapshot below,
// i.e. during RENDER, and takes the whole guest album down with it. A guest who
// can't persist a session should just be a guest who re-joins, never a guest
// staring at a crashed page.
function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * A one-shot read, outside the hook, for a caller that needs the value ONCE at mount rather than
 * as live state (the door's "returning" snapshot: whether this browser already held a session when
 * the page loaded, which decides whether the OFF-state upload step is asked at all). Re-reading it
 * live would flip the instant the guest's own join mints a session and drop the step under their
 * thumb.
 */
export function readStoredSession(qrToken: string): string | null {
  if (typeof window === "undefined") return null;
  return readStored(sessionKey(qrToken));
}

export function setStoredSession(qrToken: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(sessionKey(qrToken));
    else localStorage.setItem(sessionKey(qrToken), value);
  } catch {
    // Storage unavailable: the token stays in memory for this render pass via
    // the emit below, so uploading still works for the current visit.
  }
  emit();
}

/**
 * PUT THE WHOLE TICKET DOWN, both copies.
 *
 * The session has a SERVER-readable half, the `pr_guest_<eventId>` cookie, which is what lets an
 * RSC resolve Require an upload to view for the right guest. Clearing only the localStorage copy
 * would leave a shared phone rendering the FULL album on the last contributor's ticket, which is the
 * exact leak that switch exists to close. So every put-it-down path below clears both: the local
 * one synchronously (so this tab stops uploading under it at once, even on a flaky network) and the
 * cookie through `POST /api/guests/leave`, which is HttpOnly and so only a response can expire.
 *
 * This is that second half, best-effort by design (a sign-out or a recovery must never hang on it,
 * and the local half is already gone). It resolves either way; `keepalive` lets it outlive a
 * sign-out's navigation. The synchronous `try` is there because a fetch that is not a real one (a
 * test double) can throw before it returns a promise.
 */
function postLeave(body: { qr_token: string } | { all: true }): Promise<void> {
  try {
    return fetch("/api/guests/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).then(
      () => undefined,
      () => undefined,
    );
  } catch {
    return Promise.resolve();
  }
}

/**
 * PUT DOWN A TICKET THAT IS NOT THIS VIEWER'S. The upload, rename and attach routes answer
 * `session_other_account` when this device's token for an event names a row that belongs to an
 * account the viewer is not (lib/guest/session-owner.ts), and every client that hears it lands here
 * before it joins again as whoever is holding the phone: the token, the name and address flag
 * beside it (and the prefill, when it is that same name), then the server-readable cookie.
 *
 * ★ THE COOKIE IS AWAITED, unlike the sign-out's. The very next thing every caller does is a join,
 * whose response writes this event's cookie afresh; an expiry still in flight could land after it
 * and put the NEW ticket down. Awaiting orders the two, and the leave route never fails loudly.
 */
export async function dropGuestTicket(qrToken: string): Promise<void> {
  forgetStoredGuest(qrToken);
  setStoredSession(qrToken, null);
  await postLeave({ qr_token: qrToken });
}

/**
 * THE DEVICE HALF OF A SIGN-OUT: every guest ticket this browser holds, for every event, with the
 * names and address flags beside them and the name prefill. Synchronous, so it runs to completion
 * before the account's own sign-out navigates away (the account menu calls it from its form's
 * submit, ahead of `signOutAction`, which expires the cookie half on its own response). A sign-out
 * is an account's; a guest's photographs on a claimed row stay theirs to manage from that account
 * on any device.
 */
export function forgetGuestTickets(): void {
  try {
    for (const key of storedKeysWithPrefixes([SESSION_PREFIX])) {
      localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable: there were no stored tickets to forget.
  }
  emit();
  forgetAllStoredGuests();
}

/**
 * The whole sign-out courtesy for a sign-out that runs in the BROWSER (the guest page's header,
 * which stays on the album rather than following `signOutAction` to /login): the device half now,
 * and every guest cookie through `POST /api/guests/leave` `{ all: true }`, since script cannot read
 * an HttpOnly cookie to name them. The server rule is the guarantee; this is the courtesy.
 */
export function leaveAllGuestSessions(): void {
  forgetGuestTickets();
  void postLeave({ all: true });
}

// localStorage-backed session via useSyncExternalStore: the server snapshot is
// null, so SSR/hydration render the no-session state and then swap in any stored
// session on the client WITHOUT a hydration mismatch (the React-blessed pattern,
// avoiding setState-in-effect).
export function useStoredSession(
  qrToken: string,
): [string | null, (token: string | null) => void] {
  const key = sessionKey(qrToken);

  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);

  const token = useSyncExternalStore(
    subscribe,
    () => readStored(key),
    () => null,
  );

  const setToken = useCallback(
    (value: string | null) => setStoredSession(qrToken, value),
    [qrToken],
  );

  return [token, setToken];
}
