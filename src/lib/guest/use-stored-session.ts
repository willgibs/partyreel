"use client";

import { useCallback, useSyncExternalStore } from "react";

import { SESSION_PREFIX } from "@/lib/guest/session-tokens";

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
// localStorage GETTER ITSELF throw a SecurityError, not just its methods. That
// throw used to happen inside the useSyncExternalStore snapshot below, i.e.
// during RENDER, which took the whole guest album down with it. A guest who
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
